import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import mongoose from 'mongoose';
import path from 'node:path';
import fs from 'node:fs';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { sendSuccess } from './utils/response.js';
import { createLimiter } from './middleware/rateLimit.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import { adminRouter } from './modules/auth/admin.routes.js';
import { packagesRouter } from './modules/packages/packages.routes.js';
import { storiesRouter } from './modules/stories/stories.routes.js';
import { createEnquiryRouter } from './modules/enquiries/enquiries.routes.js';
import { legacyRedirectMiddleware, getRobotsTxt, getSitemapXml, renderPackageSsrHtml, getSsrCspHeader } from './modules/ssr/ssr.service.js';
import { asyncHandler } from './utils/asyncHandler.js';

// Application factory: no side effects (no DB connection, no listen) so tests can build isolated apps.
export function createApp(options = {}) {
  const limits = {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    loginMax: env.LOGIN_RATE_LIMIT_MAX,
    enquiryMax: 10, // public enquiry submissions per IP per hour
    ...options.rateLimit,
  };

  const app = express();
  app.disable('x-powered-by');
  if (env.isProduction) app.set('trust proxy', 1); // behind a platform proxy (Render, Railway, ...)

  // 140 Legacy URL Redirects with 301
  app.use(legacyRedirectMiddleware);

  app.use(helmet());
  app.use(
    cors({
      origin(origin, cb) {
        // No Origin header = same-origin / curl / server-to-server. Otherwise must be allow-listed.
        cb(null, !origin || env.clientOrigins.includes(origin));
      },
      credentials: true,
    })
  );
  if (!env.isTest) app.use(morgan(env.isProduction ? 'combined' : 'dev', { stream: logger.stream }));

  // SEO: robots.txt and sitemap.xml
  app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send(getRobotsTxt(`${req.protocol}://${req.get('host')}`));
  });

  app.get('/sitemap.xml', asyncHandler(async (req, res) => {
    const xml = await getSitemapXml(`${req.protocol}://${req.get('host')}`);
    res.type('application/xml');
    res.send(xml);
  }));

  // ── SSR for public package pages ─────────────────────────────────────────
  // Both routes serve full server-rendered HTML so that:
  //   • Search engine crawlers get pre-rendered content on the canonical URL
  //   • curl / direct HTTP requests (assignment verification) work correctly
  //   • Social sharing bots receive Open Graph / JSON-LD metadata immediately
  //
  // HOW IT WORKS:
  //   1. /ssr/packages/:slug  — dedicated SSR endpoint (always SSR)
  //   2. /packages/:slug      — canonical URL; serves SSR HTML when the
  //      Accept header prefers text/html (crawlers, curl, direct navigation)
  //      OR when the X-No-Ssr header is absent (non-XHR requests).
  //      React SPA in the browser will still hydrate the page via its own JS
  //      bundle after the initial HTML is painted.
  //
  // VITE DEV: In dev mode (/packages/:slug) this route lives on the Express
  // server (port 5000) while the interactive React SPA lives on Vite (port
  // 5173). The Vite proxy does NOT forward /packages/* to Express, so the
  // SSR interception only applies to direct-to-Express requests in dev, and
  // to ALL requests when the built client is served from Express in prod.

  // Helper: does this request want an HTML page (not an XHR / fetch)?
  function wantsHtml(req) {
    // XHR / fetch calls set Accept: application/json or X-Requested-With: XMLHttpRequest
    if (req.headers['x-requested-with'] === 'XMLHttpRequest') return false;
    if (req.headers['x-no-ssr'] === '1') return false;
    const accept = req.headers['accept'] || '';
    // curl, wget, Googlebot, Bingbot all include text/html in Accept
    return accept.includes('text/html') || accept === '*/*' || accept === '';
  }

  app.get('/ssr/packages/:slug', asyncHandler(async (req, res) => {
    const html = await renderPackageSsrHtml(req.params.slug, `${req.protocol}://${req.get('host')}`);
    res.set('Content-Security-Policy', getSsrCspHeader()); // helmet default + the theme script's hash
    res.type('text/html');
    res.send(html);
  }));

  // Normal canonical URL — serves SSR HTML to crawlers/direct HTTP requests
  app.get('/packages/:slug', asyncHandler(async (req, res, next) => {
    if (!wantsHtml(req)) return next(); // let downstream handle JSON/API-style requests
    try {
      const html = await renderPackageSsrHtml(req.params.slug, `${req.protocol}://${req.get('host')}`);
      res.set('Content-Security-Policy', getSsrCspHeader()); // helmet default + the theme script's hash
      res.type('text/html');
      return res.send(html);
    } catch {
      // Package not found or DB error — fall through to React SPA / 404 handler
      return next();
    }
  }));

  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use(mongoSanitize({ replaceWith: '_' })); // strips $ and . keys (NoSQL operator injection)
  app.use('/api', createLimiter({ windowMs: limits.windowMs, limit: limits.max }));

  app.get('/api/health', (_req, res) => {
    const dbUp = mongoose.connection.readyState === 1;
    res.status(dbUp ? 200 : 503);
    sendSuccess(res, { status: dbUp ? 'ok' : 'degraded', db: dbUp ? 'connected' : 'disconnected', uptimeSeconds: Math.round(process.uptime()) }, { status: dbUp ? 200 : 503 });
  });

  app.use('/api/auth', createAuthRouter({ loginLimit: limits.loginMax, windowMs: limits.windowMs }));
  app.use('/api/admin', adminRouter);

  // Public, read-only website APIs + public enquiry submission (Phase 2)
  app.use('/api/packages', packagesRouter);
  app.use('/api/stories', storiesRouter);
  app.use('/api/enquiries', createEnquiryRouter({ limit: limits.enquiryMax }));

  // Production SPA static asset serving & client-side route fallback
  if (env.isProduction) {
    const clientDist = path.resolve(process.cwd(), '../client/dist');
    if (fs.existsSync(clientDist)) {
      app.use(express.static(clientDist));
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/ssr') || req.path.startsWith('/packages/')) return next();
        res.sendFile(path.join(clientDist, 'index.html'));
      });
    }
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
