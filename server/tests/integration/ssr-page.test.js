import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createHash } from 'node:crypto';
import { createApp } from '../../src/app.js';
import { connectTestDb, dropTestDb, createUser } from '../helpers.js';
import { Package } from '../../src/modules/packages/package.model.js';
import { PackageVersion } from '../../src/modules/packages/packageVersion.model.js';
import { THEME_SCRIPT } from '../../src/modules/ssr/ssr.theme.js';

const app = createApp({ rateLimit: { enquiryMax: 1000 } });
const SLUG = 'ssr-theme-check';
const HTML = { Accept: 'text/html' };

beforeAll(async () => {
  await connectTestDb();
  const staff = await createUser();
  const pkg = new Package({ code: 'PKG-KL-91', slug: SLUG, createdBy: staff._id });
  const version = await PackageVersion.create({
    packageId: pkg._id,
    versionNumber: 1,
    status: 'published',
    content: {
      name: 'SSR Theme Check', destination: 'Munnar', category: 'Kerala', durationDays: 4, nights: 3, hotelCategory: '4-star',
      summary: 'Summary text', description: 'Description text',
      itinerary: [{ day: 1, title: 'Arrive', description: 'Welcome' }],
      hotels: [{ name: 'Hotel', location: 'Munnar', category: '4-star', nights: 3 }],
      inclusions: ['Breakfast'], exclusions: ['Flights'],
      heroImage: { url: '/images/seed/munnar-tea.jpg', alt: 'Tea' },
    },
    seasons: [{ name: 'Peak', pricePerPerson: 18500, currency: 'INR', startDate: new Date('2026-10-01'), endDate: new Date('2027-03-31') }],
    publishedAt: new Date(), publishedBy: staff._id, createdBy: staff._id,
  });
  pkg.publishedVersionId = version._id;
  await pkg.save();
});

afterAll(dropTestDb);

describe('SSR package routes (real Express app)', () => {
  for (const path of [`/packages/${SLUG}`, `/ssr/packages/${SLUG}`]) {
    it(`${path} serves themed HTML with a CSP that permits only the theme script`, async () => {
      const res = await request(app).get(path).set(HTML).expect(200);
      expect(res.headers['content-type']).toMatch(/text\/html/);
      expect(res.text).toContain('data-theme-toggle');
      expect(res.text).toContain('SSR Theme Check');
      expect(res.text).toContain('₹18,500');
      const hash = `sha256-${createHash('sha256').update(THEME_SCRIPT, 'utf8').digest('base64')}`;
      const csp = res.headers['content-security-policy'];
      expect(csp).toContain(`script-src 'self' '${hash}'`);
      expect(csp).toContain("script-src-attr 'none'");
      expect(csp).toContain("object-src 'none'");
    });
  }

  it('other routes keep helmet\'s strict default CSP (no hash widening)', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['content-security-policy']).toContain("script-src 'self';");
  });

  it('unknown slug still falls through (no SSR page, no crash)', async () => {
    const res = await request(app).get('/packages/does-not-exist').set(HTML);
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.text).not.toContain('data-theme-toggle');
  });

  it('draft/unpublished content is not rendered', async () => {
    const res = await request(app).get('/ssr/packages/never-published');
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
