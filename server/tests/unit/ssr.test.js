import { describe, it, expect } from 'vitest';
import { getRobotsTxt, getSitemapXml } from '../../src/modules/ssr/ssr.service.js';
import { LEGACY_REDIRECTS } from '../../src/config/legacyRedirects.js';

describe('SSR, SEO and Legacy Redirects', () => {
  it('includes 140 legacy redirects', () => {
    const keys = Object.keys(LEGACY_REDIRECTS);
    expect(keys.length).toBeGreaterThanOrEqual(140);
    expect(LEGACY_REDIRECTS['/kerala-houseboats']).toBe('/packages/munnar-thekkady-alleppey-houseboat');
    expect(LEGACY_REDIRECTS['/munnar-tour-package']).toBe('/packages/munnar-thekkady-alleppey-houseboat');
  });

  it('generates valid robots.txt disallowing admin paths', () => {
    const robots = getRobotsTxt('https://travelos.in');
    expect(robots).toContain('User-agent: *');
    expect(robots).toContain('Disallow: /api/admin');
    expect(robots).toContain('Sitemap: https://travelos.in/sitemap.xml');
  });
});

