import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// In dev the browser talks to Vite (5173); /api is proxied to Express so cookies stay same-origin.
// /packages/:slug is also proxied to Express so SSR HTML is served for direct/curl requests
// while React Router handles SPA navigation in the browser transparently.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:5000',
      '/ssr': 'http://127.0.0.1:5000',
      '/robots.txt': 'http://127.0.0.1:5000',
      '/sitemap.xml': 'http://127.0.0.1:5000',
      // Forward package detail requests to Express SSR when Accept includes text/html
      '/packages': {
        target: 'http://127.0.0.1:5000',
        bypass(req) {
          // Let Vite handle the request (return React SPA) if it's a browser
          // navigating via React Router (fetch, XHR, or no Accept: text/html).
          // Otherwise forward to Express SSR.
          const accept = req.headers['accept'] || '';
          const isHtmlReq = accept.includes('text/html');
          const isXhr = req.headers['x-requested-with'] === 'XMLHttpRequest';
          // Only proxy if it looks like a crawler / curl / direct page load
          // AND it's specifically /packages/<slug> (not /packages itself)
          if (isHtmlReq && !isXhr && /^\/packages\/[^/]+$/.test(req.url)) {
            return null; // null = forward to target (Express)
          }
          return req.url; // return url string = serve from Vite (SPA)
        },
      },
    },
  },
});
