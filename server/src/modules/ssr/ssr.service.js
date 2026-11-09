import { getPublishedPackageBySlug, listPublishedSlugs } from '../packages/packages.service.js';
import { LEGACY_REDIRECTS } from '../../config/legacyRedirects.js';
import { logger } from '../../utils/logger.js';
import { THEME_SCRIPT, PAGE_CSS, getSsrCspHeader } from './ssr.theme.js';

export { getSsrCspHeader };

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

  const heroSrc = pkg.heroImage?.url || '/images/hero-kerala.jpg';
  const heroAlt = pkg.heroImage?.alt || pkg.name;

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

  const icon = {
    pin: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    cal: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
    sun: '<svg class="i-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg class="i-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    menu: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    arrow: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  };
  const logo = `<svg width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 28V15"/><path d="M16 15C16 9.5 13 6 8.5 4.8c0 4.4 2.3 7.8 7.5 10.2z"/><path d="M16 15c0-5.5 3-9 7.5-10.2 0 4.4-2.3 7.8-7.5 10.2z"/><path d="M16 21.5c-4.3.2-8.3-1.6-10.5-5.8 4.2-.5 8.6.7 10.5 5.8z"/><path d="M16 21.5c4.3.2 8.3-1.6 10.5-5.8-4.2-.5-8.6.7-10.5 5.8z"/></svg>`;

  const navLinks = [
    ['/', 'Home'],
    ['/destinations', 'Destinations'],
    ['/packages', 'Packages'],
    ['/stories', 'Travel Stories'],
    ['/about', 'About'],
    ['/contact', 'Contact'],
  ];
  const navHtml = navLinks
    .map(([href, label]) => `<a href="${href}"${href === '/packages' ? ' aria-current="page"' : ''}>${label}</a>`)
    .join('');
  const mobileNavHtml = navLinks.map(([href, label]) => `<a class="l" href="${href}">${label}</a>`).join('');

  const toggle = `<button type="button" class="theme-toggle" data-theme-toggle role="switch" aria-checked="false" aria-label="Switch to dark mode" title="Dark mode">${icon.sun}${icon.moon}</button>`;

  const nightsLabel = `${pkg.durationDays || ''} Days / ${pkg.nights || ''} Nights`;
  const galleryHtml = (pkg.gallery || [])
    .filter((g) => g && g.url)
    .slice(0, 4)
    .map((g) => `<img src="${escapeHtml(g.url)}" alt="${escapeHtml(g.alt || pkg.name)}" width="192" height="128" loading="lazy" />`)
    .join('');

  const itinerary = pkg.itinerary || [];
  const inclusions = pkg.inclusions || [];
  const exclusions = pkg.exclusions || [];
  const seasons = pkg.seasons || [];
  const hotels = pkg.hotels || [];

  const tabs = [
    ['overview', 'Overview'],
    itinerary.length ? ['itinerary', 'Itinerary'] : null,
    hotels.length ? ['stays', 'Stays'] : null,
    inclusions.length || exclusions.length ? ['inclusions', 'Inclusions'] : null,
    seasons.length ? ['pricing', 'Pricing'] : null,
  ].filter(Boolean);

  const priceText = pkg.startingPrice ? `₹${pkg.startingPrice.toLocaleString('en-IN')}` : 'Price on Request';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <!-- Theme bootstrap: runs before any CSS or body content so the wrong theme never flashes -->
  <script>${THEME_SCRIPT}</script>
  <meta name="color-scheme" content="light dark" />
  <meta name="theme-color" content="#F7F8F5" media="(prefers-color-scheme: light)" />
  <meta name="theme-color" content="#101713" media="(prefers-color-scheme: dark)" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />

  <!-- Open Graph / Social -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
  <meta property="og:image" content="${escapeHtml(heroImageUrl)}" />
  <meta property="og:site_name" content="TravelOS" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(heroImageUrl)}" />

  <!-- JSON-LD Structured Data -->
  <script type="application/ld+json">
    ${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}
  </script>

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@300;400;500;600&display=swap" />
  <style>${PAGE_CSS}</style>
</head>
<body>
  <a class="skip" href="#content">Skip to content</a>
  <header class="site-header">
    <div class="container header-row">
      <a href="/" class="brand" aria-label="TravelOS home">${logo}<span><span class="brand-name">TravelOS</span><span class="brand-tag">Kerala &amp; South India</span></span></a>
      <nav class="nav" aria-label="Primary">${navHtml}</nav>
      <div class="header-actions">
        ${toggle}
        <a href="/contact" class="btn btn-gold header-cta">Plan Your Trip</a>
        <details class="mnav">
          <summary aria-label="Open menu">${icon.menu}</summary>
          <div class="mnav-panel">
            ${mobileNavHtml}
            <a href="/contact" class="btn btn-gold btn-block">Plan Your Trip</a>
          </div>
        </details>
      </div>
    </div>
  </header>

  <main id="content" class="container">
    <nav class="crumbs" aria-label="Breadcrumb">
      <a href="/">Home</a><span class="sep">/</span><a href="/packages">Packages</a><span class="sep">/</span><span aria-current="page">${escapeHtml(pkg.name)}</span>
    </nav>

    <div class="layout">
      <div>
        <header>
          <div class="meta">
            <span class="badge">${escapeHtml(pkg.hotelCategory || 'Tour Package')}</span>
            <span class="ic">${icon.pin}${escapeHtml(pkg.destination || 'Kerala')}</span>
            <span class="ic">${icon.cal}${nightsLabel}</span>
            ${pkg.isDemo ? '<span class="badge">Demo package</span>' : ''}
          </div>
          <h1>${escapeHtml(pkg.name)}</h1>
        </header>

        <div class="hero"><img src="${escapeHtml(heroSrc)}" alt="${escapeHtml(heroAlt)}" width="1600" height="1000" fetchpriority="high" /></div>
        ${galleryHtml ? `<div class="thumbs">${galleryHtml}</div>` : ''}

        <nav class="tabs" aria-label="Package sections">${tabs.map(([id, label]) => `<a href="#${id}">${label}</a>`).join('')}</nav>

        <div class="sections">
          <section id="overview">
            <h2>Overview</h2>
            <p class="lead">${escapeHtml(pkg.description || pkg.summary || '')}</p>
          </section>

          <section id="itinerary">
            <h2>Day-by-Day Itinerary</h2>
            <div class="days">
              ${itinerary.map((day, i) => `
              <details class="day"${i === 0 ? ' open' : ''}>
                <summary><h3>Day ${day.day}: ${escapeHtml(day.title)}</h3><span class="plus" aria-hidden="true">+</span></summary>
                <p>${escapeHtml(day.description || '')}</p>
              </details>`).join('')}
            </div>
          </section>

          ${hotels.length ? `
          <section id="stays">
            <h2>Where You&rsquo;ll Stay</h2>
            <ul class="hotels">
              ${hotels.map((h) => `<li class="card"><strong>${escapeHtml(h.name)}</strong><span>${escapeHtml([h.location, h.category, h.nights ? `${h.nights} ${Number(h.nights) === 1 ? 'night' : 'nights'}` : ''].filter(Boolean).join(' · '))}</span></li>`).join('')}
            </ul>
          </section>` : ''}

          <section id="inclusions">
            <h2>Inclusions &amp; Exclusions</h2>
            <div class="two">
              <div class="card box">
                <h3>What's Included</h3>
                <ul class="ticks">
                  ${inclusions.map((inc) => `<li><span class="tick" aria-hidden="true">✓</span>${escapeHtml(inc)}</li>`).join('')}
                </ul>
              </div>
              <div class="card box">
                <h3>Not Included</h3>
                <ul class="ticks">
                  ${exclusions.map((exc) => `<li><span class="tick no" aria-hidden="true">–</span>${escapeHtml(exc)}</li>`).join('')}
                </ul>
              </div>
            </div>
          </section>

          ${seasons.length ? `
          <section id="pricing">
            <h2>Seasonal Pricing</h2>
            <div class="card rates">
              ${seasons.map((s) => `<div class="rate"><span>${escapeHtml(s.name)}</span><span class="amt">₹${(s.pricePerPerson || 0).toLocaleString('en-IN')}<small>per person</small></span></div>`).join('')}
            </div>
          </section>` : ''}
        </div>
      </div>

      <aside aria-label="Enquiry">
        <div class="card enquiry">
          <div class="price-box">
            <div class="lbl">Starting from</div>
            <div class="val">${priceText}</div>
            <div class="sub">Per person on twin-sharing basis · GST extra</div>
          </div>
          <div class="enquiry-body">
            ${seasons.length ? `<div>
              <h4>Seasonal Rates</h4>
              ${seasons.map((s) => `<div class="rate"><span>${escapeHtml(s.name)}</span><span class="amt">₹${(s.pricePerPerson || 0).toLocaleString('en-IN')}</span></div>`).join('')}
            </div>` : ''}
            <p class="disclaimer" style="margin:0">All rates are verified by backend pricing engine. Twin-sharing adult basis. GST 5% applies unless specified.</p>
            <a href="/contact?package=${encodeURIComponent(pkg.slug)}" class="btn btn-primary btn-block">Enquire Now ${icon.arrow}</a>
            <a href="/contact" class="btn btn-outline btn-block">Talk to a travel expert</a>
            <p class="fine">Free consultation, no obligation</p>
          </div>
        </div>
      </aside>
    </div>
  </main>

  <footer class="site-footer">
    <div class="container footer-grid">
      <div>
        <a href="/" class="brand" aria-label="TravelOS home">${logo}<span class="brand-name">TravelOS</span></a>
        <p>Premium travel experiences across Kerala and South India. Curated itineraries, local expertise and personal service.</p>
      </div>
      <div><h4>Explore</h4><ul><li><a href="/destinations">Destinations</a></li><li><a href="/packages">Packages</a></li><li><a href="/stories">Travel Stories</a></li><li><a href="/about">About TravelOS</a></li></ul></div>
      <div><h4>Plan Your Trip</h4><ul><li><a href="/contact">Contact Us</a></li><li><a href="/packages">All Packages</a></li></ul></div>
    </div>
    <div class="copyright"><div class="container"><p>© ${new Date().getFullYear()} TravelOS. Kochi, Kerala. High-end South India &amp; Kerala Tour Operations.</p></div></div>
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

