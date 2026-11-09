import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

vi.mock('../../src/modules/packages/packages.service.js', () => ({
  getPublishedPackageBySlug: vi.fn(),
  listPublishedSlugs: vi.fn(),
}));

const { getPublishedPackageBySlug } = await import('../../src/modules/packages/packages.service.js');
const { renderPackageSsrHtml } = await import('../../src/modules/ssr/ssr.service.js');
const { THEME_KEY, THEME_SCRIPT, THEME_SCRIPT_HASH, getSsrCspHeader } = await import('../../src/modules/ssr/ssr.theme.js');

const basePkg = {
  slug: 'kerala-backwaters',
  name: 'Kerala Backwaters',
  destination: 'Alleppey',
  durationDays: 5,
  nights: 4,
  hotelCategory: '5-star',
  summary: 'A calm backwater journey',
  description: 'Glide through the canals.',
  heroImage: { url: '/images/seed/kerala-houseboat.jpg', alt: 'Houseboat' },
  gallery: [{ url: '/images/seed/munnar-tea.jpg', alt: 'Tea' }],
  startingPrice: 32500,
  itinerary: [
    { day: 1, title: 'Arrive in Kochi', description: 'Welcome drinks.' },
    { day: 2, title: 'Houseboat', description: 'Cruise the canals.' },
  ],
  hotels: [{ name: 'Demo Resort', location: 'Alleppey', category: '5-star', nights: 2 }],
  inclusions: ['Breakfast', 'Transfers'],
  exclusions: ['Flights'],
  seasons: [
    { name: 'Peak season', pricePerPerson: 32500, currency: 'INR', startDate: '2026-10-01', endDate: '2027-03-31' },
    { name: 'Monsoon season', pricePerPerson: 24900, currency: 'INR' },
  ],
  seo: { title: 'Backwaters', description: 'Seo description' },
  isDemo: true,
};

const render = async (overrides = {}, base = 'https://travelos.in') => {
  getPublishedPackageBySlug.mockResolvedValue({ ...basePkg, ...overrides });
  return renderPackageSsrHtml('kerala-backwaters', base);
};

beforeEach(() => vi.clearAllMocks());

describe('SSR package page: theming', () => {
  it('inlines the theme bootstrap before any stylesheet or body content (no flash)', async () => {
    const html = await render();
    const script = html.indexOf('<script>');
    expect(script).toBeGreaterThan(-1);
    expect(script).toBeLessThan(html.indexOf('<style>'));
    expect(script).toBeLessThan(html.indexOf('rel="stylesheet"'));
    expect(script).toBeLessThan(html.indexOf('<body>'));
    expect(html).toContain(`<script>${THEME_SCRIPT}</script>`);
  });

  it('bootstrap resolves saved choice, then OS preference, then light', () => {
    expect(THEME_SCRIPT).toContain("localStorage.getItem(KEY)");
    expect(THEME_SCRIPT).toContain('(prefers-color-scheme: dark)');
    expect(THEME_SCRIPT).toContain("setAttribute('data-theme'");
    expect(THEME_SCRIPT).toContain("e.target.closest('[data-theme-toggle]')");
  });

  it('uses the same storage key as the React app so the choice carries across', () => {
    const provider = readFileSync(new URL('../../../client/src/theme/ThemeProvider.jsx', import.meta.url), 'utf8');
    expect(provider).toContain(`'${THEME_KEY}'`);
    const indexHtml = readFileSync(new URL('../../../client/index.html', import.meta.url), 'utf8');
    expect(indexHtml).toContain(`'${THEME_KEY}'`);
  });

  it('ships light and dark token sets, plus a no-JS OS-preference fallback', async () => {
    const html = await render();
    expect(html).toContain('[data-theme="dark"]');
    expect(html).toContain('--bg: #F7F8F5');
    expect(html).toContain('--bg: #101713');
    expect(html).toContain(':root:not([data-theme])');
    expect(html).toContain('prefers-reduced-motion: reduce');
    expect(html).toContain('<meta name="color-scheme" content="light dark" />');
  });

  it('renders an accessible theme toggle and a no-JS mobile menu', async () => {
    const html = await render();
    expect(html).toMatch(/<button[^>]*data-theme-toggle[^>]*role="switch"[^>]*aria-checked="false"/);
    expect(html).toContain('<details class="mnav">');
  });

  it('contains no inline event handlers (blocked by script-src-attr none)', async () => {
    const html = await render();
    expect(html).not.toMatch(/\son[a-z]+\s*=\s*["']/i);
  });
});

describe('SSR package page: CSP', () => {
  it('allows exactly the theme script by hash and keeps helmet defaults otherwise', () => {
    const csp = getSsrCspHeader();
    const expected = `sha256-${createHash('sha256').update(THEME_SCRIPT, 'utf8').digest('base64')}`;
    expect(THEME_SCRIPT_HASH).toBe(expected);
    expect(csp).toContain(`script-src 'self' '${expected}'`);
    expect(csp).toContain("script-src-attr 'none'");
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).not.toContain("'unsafe-inline'; ");
    expect(csp).not.toMatch(/script-src[^;]*unsafe-inline/);
  });

  it('hash matches the script actually present in the rendered page', async () => {
    const html = await render();
    const body = html.match(/<script>([\s\S]*?)<\/script>/)[1];
    const hash = `sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}`;
    expect(getSsrCspHeader()).toContain(hash);
  });
});

describe('SSR package page: preserved SEO and content', () => {
  it('keeps title, description, canonical, Open Graph and Twitter tags', async () => {
    const html = await render();
    expect(html).toContain('<title>Backwaters | TravelOS Kerala</title>');
    expect(html).toContain('<meta name="description" content="Seo description" />');
    expect(html).toContain('<link rel="canonical" href="https://travelos.in/packages/kerala-backwaters" />');
    expect(html).toContain('<meta property="og:url" content="https://travelos.in/packages/kerala-backwaters" />');
    expect(html).toContain('<meta property="og:image" content="https://travelos.in/images/seed/kerala-houseboat.jpg" />');
    expect(html).toContain('<meta property="og:site_name" content="TravelOS" />');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(html).toContain('<meta name="twitter:image" content="https://travelos.in/images/seed/kerala-houseboat.jpg" />');
  });

  it('keeps valid JSON-LD with itinerary and offers', async () => {
    const html = await render();
    const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    expect(ld['@type']).toBe('TouristTrip');
    expect(ld.name).toBe('Kerala Backwaters');
    expect(ld.itinerary).toHaveLength(2);
    expect(ld.itinerary[0]).toMatchObject({ dayNumber: 1, name: 'Arrive in Kochi' });
    expect(ld.offers.map((o) => o.price)).toEqual([32500, 24900]);
    expect(ld.offers[0].priceCurrency).toBe('INR');
  });

  it('keeps pricing, itinerary, inclusions, exclusions, hotels and the enquiry link', async () => {
    const html = await render();
    expect(html).toContain('₹32,500');
    expect(html).toContain('₹24,900');
    expect(html).toContain('Per person on twin-sharing basis · GST extra');
    expect(html).toContain('Seasonal Rates');
    expect(html).toContain('Day 1: Arrive in Kochi');
    expect(html).toContain('Cruise the canals.');
    expect(html).toContain('Breakfast');
    expect(html).toContain('Flights');
    expect(html).toContain('Demo Resort');
    expect(html).toContain('5 Days / 4 Nights');
    expect(html).toContain('href="/contact?package=kerala-backwaters"');
    expect(html).toContain('All rates are verified by backend pricing engine.');
  });

  it('shows "Price on Request" when there is no starting price', async () => {
    const html = await render({ startingPrice: 0 });
    expect(html).toContain('Price on Request');
  });

  it('renders every itinerary day in the markup (crawlable) and opens day 1 only', async () => {
    const html = await render();
    expect((html.match(/<details class="day"/g) || []).length).toBe(2);
    expect((html.match(/<details class="day" open>/g) || []).length).toBe(1);
  });
});

describe('SSR package page: escaping', () => {
  it('escapes package text', async () => {
    const html = await render({ name: '<img src=x onerror=alert(1)>"Quote"' });
    expect(html).not.toContain('<img src=x onerror=alert(1)>');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;&quot;Quote&quot;');
  });

  it('JSON-LD cannot be broken out of with a closing script tag', async () => {
    const html = await render({ summary: 'bad </script><script>alert(1)</script>' });
    const ldBlock = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1];
    expect(ldBlock).not.toContain('</script');
    expect(JSON.parse(ldBlock).description).toBe('bad </script><script>alert(1)</script>');
    expect(html).not.toContain('<script>alert(1)</script>');
  });

  it('escapes a hostile base URL (Host header) in attributes', async () => {
    const html = await render({}, 'http://evil.test"><script>alert(1)</script>');
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('http://evil.test&quot;&gt;&lt;script&gt;');
  });
});
