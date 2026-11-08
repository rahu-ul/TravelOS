import { getPublishedPackageBySlug, listPublishedSlugs } from '../packages/packages.service.js';
import { LEGACY_REDIRECTS } from '../../config/legacyRedirects.js';
import { logger } from '../../utils/logger.js';

export function legacyRedirectMiddleware(req, res, next) {
  const target = LEGACY_REDIRECTS[req.path];
  if (target) {
    logger.info(`Legacy redirect 301: ${req.path} -> ${target}`);
    return res.redirect(301, target);
  }
  next();
}

export function getRobotsTxt(baseUrl = 'https://travelos.in') {
  return `User-agent: *
Allow: /
Allow: /packages
Allow: /packages/*
Allow: /destinations
Allow: /stories
Allow: /stories/*
Allow: /about
Allow: /contact

Disallow: /api/admin
Disallow: /api/admin/*
Disallow: /admin
Disallow: /admin/*

Sitemap: ${baseUrl}/sitemap.xml
`;
}

export async function getSitemapXml(baseUrl = 'https://travelos.in') {
  const publishedPackages = await listPublishedSlugs();

  const staticRoutes = [
    { loc: '/', changefreq: 'daily', priority: '1.0' },
    { loc: '/packages', changefreq: 'daily', priority: '0.9' },
    { loc: '/destinations', changefreq: 'weekly', priority: '0.8' },
    { loc: '/stories', changefreq: 'weekly', priority: '0.8' },
    { loc: '/about', changefreq: 'monthly', priority: '0.6' },
    { loc: '/contact', changefreq: 'monthly', priority: '0.7' },
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  for (const r of staticRoutes) {
    xml += `  <url>\n    <loc>${baseUrl}${r.loc}</loc>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>\n`;
  }

  for (const pkg of publishedPackages) {
    const lastMod = pkg.lastModified ? new Date(pkg.lastModified).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    xml += `  <url>\n    <loc>${baseUrl}/packages/${pkg.slug}</loc>\n    <lastmod>${lastMod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
  }

  xml += `</urlset>`;
  return xml;
}

export async function renderPackageSsrHtml(slug, baseUrl = 'https://travelos.in') {
  const pkg = await getPublishedPackageBySlug(slug);

  const title = `${pkg.seo?.title || pkg.name} | TravelOS Kerala`;
  const description = pkg.seo?.description || pkg.summary || `Experience ${pkg.name} with TravelOS. Authentic Kerala journeys.`;
  const canonicalUrl = `${baseUrl}/packages/${pkg.slug}`;
  const heroImageUrl = pkg.heroImage?.url ? (pkg.heroImage.url.startsWith('http') ? pkg.heroImage.url : `${baseUrl}${pkg.heroImage.url}`) : `${baseUrl}/images/hero-kerala.jpg`;

  // JSON-LD Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: pkg.name,
    description: pkg.summary,
    touristType: ['Leisure', 'Cultural', 'Nature'],
    itinerary: (pkg.itinerary || []).map((day) => ({
      '@type': 'Day',
      dayNumber: day.day,
      name: day.title,
      description: day.description,
    })),
    offers: pkg.seasons?.map((s) => ({
      '@type': 'Offer',
      name: s.name,
      price: s.pricePerPerson || 0,
      priceCurrency: s.currency || 'INR',
      availability: 'https://schema.org/InStock',
      validFrom: s.startDate,
      validThrough: s.endDate,
    })),
  };

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${canonicalUrl}" />

  <!-- Open Graph / Social -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:image" content="${heroImageUrl}" />
  <meta property="og:site_name" content="TravelOS" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${heroImageUrl}" />

  <!-- JSON-LD Structured Data -->
  <script type="application/ld+json">
    ${JSON.stringify(jsonLd)}
  </script>

  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 0; background-color: #F8F6EF; color: #252A27; line-height: 1.6; }
    .hero-container { position: relative; height: 380px; background-size: cover; background-position: center; display: flex; align-items: flex-end; }
    .hero-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.2)); }
    .hero-content { position: relative; z-index: 10; max-width: 1100px; margin: 0 auto; width: 100%; padding: 24px; color: #fff; }
    .badge { display: inline-block; background: #87916B; color: #fff; padding: 4px 10px; border-radius: 99px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 8px; }
    .main-content { max-width: 1100px; margin: 0 auto; padding: 32px 24px; display: grid; grid-template-columns: 2fr 1fr; gap: 40px; }
    @media (max-width: 768px) { .main-content { grid-template-columns: 1fr; } }
    .booking-sidebar { background: #fff; border-radius: 16px; border: 1px solid #E9E2D3; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .price-box { background: #183F35; color: #fff; padding: 16px; border-radius: 12px; margin-bottom: 20px; }
    .btn-enquire { display: block; text-align: center; background: #183F35; color: #fff; text-decoration: none; padding: 14px; border-radius: 99px; font-weight: 600; margin-top: 16px; }
    .itinerary-day { border-left: 2px solid #87916B; padding-left: 16px; margin-bottom: 20px; }
    .disclaimer { font-size: 12px; color: #666; margin-top: 8px; }
  </style>
</head>
<body>
  <header style="background: #183F35; padding: 16px 24px; color: #fff; display: flex; justify-content: space-between; align-items: center;">
    <a href="/" style="color: #fff; text-decoration: none; font-size: 20px; font-weight: bold; font-family: Georgia, serif;">TravelOS <span style="color: #87916B;">Kerala</span></a>
    <a href="/packages" style="color: #E9E2D3; text-decoration: none; font-size: 14px;">Browse All Packages →</a>
  </header>

  <section class="hero-container" style="background-image: url('${heroImageUrl}');">
    <div class="hero-overlay"></div>
    <div class="hero-content">
      <span class="badge">${escapeHtml(pkg.hotelCategory || 'Tour Package')}</span>
      <h1 style="font-family: Georgia, serif; font-size: 38px; margin: 0 0 8px 0;">${escapeHtml(pkg.name)}</h1>
      <p style="font-size: 16px; color: #E9E2D3; margin: 0;">${escapeHtml(pkg.destination || 'Kerala')} · ${pkg.durationDays || ''} Days / ${pkg.nights || ''} Nights</p>
    </div>
  </section>

  <main class="main-content">
    <div>
      <h2 style="font-family: Georgia, serif; font-size: 24px;">Overview</h2>
      <p style="color: #444; font-size: 16px; line-height: 1.7;">${escapeHtml(pkg.description || pkg.summary || '')}</p>

      <h2 style="font-family: Georgia, serif; font-size: 24px; margin-top: 36px;">Day-by-Day Itinerary</h2>
      ${(pkg.itinerary || []).map((day) => `
        <div class="itinerary-day">
          <h3 style="margin: 0 0 6px 0; font-size: 18px;">Day ${day.day}: ${escapeHtml(day.title)}</h3>
          <p style="margin: 0; color: #555; font-size: 15px;">${escapeHtml(day.description || '')}</p>
        </div>
      `).join('')}

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 36px;">
        <div style="background: #fff; padding: 20px; border-radius: 12px; border: 1px solid #E9E2D3;">
          <h3 style="margin-top: 0; color: #183F35;">✓ What's Included</h3>
          <ul style="padding-left: 20px; color: #444; font-size: 14px;">
            ${(pkg.inclusions || []).map((inc) => `<li>${escapeHtml(inc)}</li>`).join('')}
          </ul>
        </div>
        <div style="background: #fff; padding: 20px; border-radius: 12px; border: 1px solid #E9E2D3;">
          <h3 style="margin-top: 0; color: #B91C1C;">✗ Not Included</h3>
          <ul style="padding-left: 20px; color: #444; font-size: 14px;">
            ${(pkg.exclusions || []).map((exc) => `<li>${escapeHtml(exc)}</li>`).join('')}
          </ul>
        </div>
      </div>
    </div>

    <aside>
      <div class="booking-sidebar">
        <div class="price-box">
          <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #E9E2D3;">Authoritative Price</div>
          <div style="font-family: Georgia, serif; font-size: 32px; font-weight: bold; margin: 4px 0;">
            ${pkg.startingPrice ? `₹${pkg.startingPrice.toLocaleString('en-IN')}` : 'Price on Request'}
          </div>
          <div style="font-size: 12px; color: #E9E2D3;">Per person on twin-sharing basis · GST extra</div>
        </div>

        <h4 style="margin: 16px 0 8px 0; font-size: 14px; text-transform: uppercase; color: #87916B;">Seasonal Rates</h4>
        ${(pkg.seasons || []).map((s) => `
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #E9E2D3; font-size: 14px;">
            <span>${escapeHtml(s.name)}</span>
            <span style="font-weight: 600; color: #183F35;">₹${(s.pricePerPerson || 0).toLocaleString('en-IN')}</span>
          </div>
        `).join('')}

        <p class="disclaimer">All rates are verified by backend pricing engine. Twin-sharing adult basis. GST 5% applies unless specified.</p>

        <a href="/contact?package=${pkg.slug}" class="btn-enquire">Enquire Now →</a>
      </div>
    </aside>
  </main>

  <footer style="background: #252A27; color: #E9E2D3; padding: 32px 24px; text-align: center; font-size: 13px; margin-top: 60px;">
    <p>© ${new Date().getFullYear()} TravelOS. Kochi, Kerala. High-end South India & Kerala Tour Operations.</p>
  </footer>
</body>
</html>`;
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

