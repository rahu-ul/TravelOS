import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { connectTestDb, dropTestDb, createUser } from '../helpers.js';
import { Package } from '../../src/modules/packages/package.model.js';
import { PackageVersion } from '../../src/modules/packages/packageVersion.model.js';
import { Story } from '../../src/modules/stories/story.model.js';
import { Enquiry } from '../../src/modules/enquiries/enquiry.model.js';
import { Activity } from '../../src/modules/activity/activity.model.js';

const app = createApp({ rateLimit: { enquiryMax: 1000 } });
let staff;

async function addPackage({ code, slug, name, published = true, days = 5, hotel = '4-star', category = 'Kerala', destination = 'Kerala', seasons = [], isDemo = false }) {
  const pkg = new Package({ code, slug, isDemo, createdBy: staff._id });
  const version = await PackageVersion.create({
    packageId: pkg._id,
    versionNumber: 1,
    status: published ? 'published' : 'draft',
    content: { name, destination, category, durationDays: days, nights: days - 1, hotelCategory: hotel, summary: `${name} summary`, description: `${name} description`, itinerary: [{ day: 1, title: 'Arrive', description: 'Welcome' }], hotels: [{ name: 'Hotel', location: 'Munnar', category: hotel, nights: 2 }], inclusions: ['Breakfast'], exclusions: ['Flights'], heroImage: { url: '/images/seed/munnar-tea.jpg', alt: 'Tea' } },
    seasons,
    publishedAt: published ? new Date() : undefined,
    publishedBy: published ? staff._id : undefined,
    createdBy: staff._id,
  });
  if (published) pkg.publishedVersionId = version._id;
  else pkg.draftVersionId = version._id;
  await pkg.save();
  return pkg;
}
const s = (name, start, end, price) => ({ name, startDate: start, endDate: end, pricePerPerson: price, occupancyBasis: 'double', gstIncluded: false });

let published1;
beforeAll(async () => {
  await connectTestDb();
  staff = await createUser({ email: 'public-api@test.example' });
  published1 = await addPackage({ code: 'PKG-KL-01', slug: 'munnar-trip', name: 'Munnar Trip', days: 6, seasons: [s('Peak', '2026-10-01', '2027-03-31', 32500), s('Monsoon', '2027-06-01', '2027-09-30', 24900)] });
  await addPackage({ code: 'PKG-KL-02', slug: 'beach-trip', name: 'Beach Trip', days: 4, hotel: '3-star', seasons: [s('Year', '2026-11-01', '2027-10-31', 15000)], isDemo: true });
  await addPackage({ code: 'PKG-TN-03', slug: 'ooty-trip', name: 'Ooty Trip', days: 8, hotel: '5-star', category: 'South India', destination: 'Tamil Nadu', seasons: [s('Peak', '2026-10-01', '2027-03-31', 60000)] });
  await addPackage({ code: 'PKG-KL-04', slug: 'villa-trip', name: 'Villa Trip', days: 4, hotel: 'homestay', seasons: [] });
  await addPackage({ code: 'PKG-KL-05', slug: 'secret-draft', name: 'Secret Draft', published: false, seasons: [s('Peak', '2026-10-01', '2027-03-31', 99999)] });
  await Story.create([
    { title: 'Published story', slug: 'published-story', excerpt: 'Hello', body: 'One two three.\n\nFour five.', status: 'published', author: staff._id, relatedPackageIds: [published1._id], tags: ['kerala'] },
    { title: 'Draft story', slug: 'draft-story', body: 'Hidden', status: 'draft', author: staff._id },
  ]);
  await Promise.all([Package, PackageVersion, Story, Enquiry].map((m) => m.init()));
});
afterAll(dropTestDb);

describe('GET /api/packages', () => {
  it('lists only published packages with a card shape and no internals', async () => {
    const res = await request(app).get('/api/packages?limit=24');
    expect(res.status).toBe(200);
    const slugs = res.body.data.packages.map((p) => p.slug);
    expect(slugs).toEqual(expect.arrayContaining(['munnar-trip', 'beach-trip', 'ooty-trip', 'villa-trip']));
    expect(slugs).not.toContain('secret-draft');
    expect(res.body.meta).toMatchObject({ total: 4, page: 1 });
    const munnar = res.body.data.packages.find((p) => p.slug === 'munnar-trip');
    expect(munnar).toMatchObject({ name: 'Munnar Trip', startingPrice: 24900, currency: 'INR', priceOnRequest: false, isDemo: false });
    expect(munnar).not.toHaveProperty('createdBy');
  });
  it('real client packages rank before demo ones by default', async () => {
    const res = await request(app).get('/api/packages?limit=24');
    const demoIndex = res.body.data.packages.findIndex((p) => p.isDemo);
    const lastReal = res.body.data.packages.map((p) => p.isDemo).lastIndexOf(false);
    expect(lastReal).toBeLessThan(demoIndex);
  });
  it('filters: destination, duration, hotel category, budget, month, search', async () => {
    const get = async (qs) => (await request(app).get(`/api/packages?limit=24&${qs}`)).body.data.packages.map((p) => p.slug).sort();
    expect(await get('destination=Tamil%20Nadu')).toEqual(['ooty-trip']);
    expect(await get('duration=3-4')).toEqual(['beach-trip', 'villa-trip']);
    expect(await get('hotelCategory=5-star,homestay')).toEqual(['ooty-trip', 'villa-trip']);
    expect(await get('minPrice=20000&maxPrice=40000')).toEqual(['munnar-trip']);
    expect(await get('month=7')).toEqual(['beach-trip', 'munnar-trip']);
    expect(await get('q=ooty')).toEqual(['ooty-trip']);
    expect(await get('q=nothing-matches-this')).toEqual([]);
  });
  it('sorts by price and duration', async () => {
    const get = async (sort) => (await request(app).get(`/api/packages?limit=24&sort=${sort}`)).body.data.packages.map((p) => p.slug);
    expect(await get('price_asc')).toEqual(['beach-trip', 'munnar-trip', 'ooty-trip', 'villa-trip']);
    expect(await get('price_desc')).toEqual(['ooty-trip', 'munnar-trip', 'beach-trip', 'villa-trip']);
    expect((await get('duration'))[3]).toBe('ooty-trip');
  });
  it('paginates', async () => {
    const p1 = await request(app).get('/api/packages?limit=3&page=1&sort=price_asc');
    const p2 = await request(app).get('/api/packages?limit=3&page=2&sort=price_asc');
    expect(p1.body.data.packages).toHaveLength(3);
    expect(p2.body.data.packages).toHaveLength(1);
    expect(p1.body.meta).toMatchObject({ total: 4, totalPages: 2 });
  });
  it('ignores garbage query values instead of failing', async () => {
    const res = await request(app).get('/api/packages?page=abc&limit=-5&sort=evil&duration=99&month=13&minPrice=x');
    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(4);
  });
  it('GET /api/packages/filters returns real options', async () => {
    const res = await request(app).get('/api/packages/filters');
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(4);
    expect(res.body.data.price).toEqual({ min: 15000, max: 60000 });
    expect(res.body.data.hotelCategories.map((h) => h.value)).toEqual(['3-star', '4-star', '5-star', 'homestay']);
  });
});

describe('GET /api/packages/:slug', () => {
  it('returns published detail with backend-driven seasonal pricing', async () => {
    const res = await request(app).get('/api/packages/munnar-trip');
    expect(res.status).toBe(200);
    const pkg = res.body.data.package;
    expect(pkg).toMatchObject({ slug: 'munnar-trip', startingPrice: 24900, durationDays: 6 });
    expect(pkg.seasons).toHaveLength(2);
    expect(pkg.seasons[0]).toMatchObject({ name: 'Peak', pricePerPerson: 32500, occupancyBasis: 'double', gstIncluded: false, currency: 'INR' });
    expect(pkg.itinerary[0]).toMatchObject({ day: 1, title: 'Arrive' });
    expect(pkg.related.map((r) => r.slug)).not.toContain('munnar-trip');
    expect(pkg.related.map((r) => r.slug)).not.toContain('secret-draft');
  });
  it('shows an unpriced package as price on request', async () => {
    const pkg = (await request(app).get('/api/packages/villa-trip')).body.data.package;
    expect(pkg.seasons).toEqual([]);
    expect(pkg).toMatchObject({ startingPrice: null, priceOnRequest: true });
  });
  it('returns 404 for draft-only, unknown and malformed slugs', async () => {
    for (const slug of ['secret-draft', 'does-not-exist', 'Bad_Slug!']) {
      const res = await request(app).get(`/api/packages/${slug}`);
      expect(res.status, slug).toBe(404);
      expect(res.body).toMatchObject({ success: false, error: { code: 'NOT_FOUND' } });
    }
  });
  it('never serves draft content even if the package later has a published version', async () => {
    // The public reader only follows publishedVersionId; the unpublished package has none.
    const pkg = await Package.findOne({ slug: 'secret-draft' });
    expect(pkg.publishedVersionId).toBeNull();
  });
});

describe('stories API', () => {
  it('lists only published stories', async () => {
    const res = await request(app).get('/api/stories');
    expect(res.status).toBe(200);
    expect(res.body.data.stories.map((x) => x.slug)).toEqual(['published-story']);
    expect(res.body.meta).toMatchObject({ total: 1 });
  });
  it('returns a published story with related published packages and 404 for drafts', async () => {
    const ok = await request(app).get('/api/stories/published-story');
    expect(ok.status).toBe(200);
    expect(ok.body.data.story).toMatchObject({ title: 'Published story', readingMinutes: 1 });
    expect(ok.body.data.story.relatedPackages.map((p) => p.slug)).toEqual(['munnar-trip']);
    expect(ok.body.data.story.author).toEqual({ name: 'Test User' });
    expect((await request(app).get('/api/stories/draft-story')).status).toBe(404);
    expect((await request(app).get('/api/stories/nope')).status).toBe(404);
  });
});

describe('POST /api/enquiries', () => {
  const valid = { name: 'Priya Sharma', email: 'Priya@Example.com', phone: '+91 98765 43210', destination: 'Kerala', adults: 2, children: 1, budget: 120000, requirements: 'Houseboat is a must', whatsappConsent: true };

  it('saves the enquiry and returns a reference (201)', async () => {
    const res = await request(app).post('/api/enquiries').send({ ...valid, packageSlug: 'munnar-trip', travelStart: '2099-01-10', travelEnd: '2099-01-15' });
    expect(res.status).toBe(201);
    expect(res.body.data.reference).toMatch(/^ENQ-\d{4}-[0-9A-F]{8}$/);
    const saved = await Enquiry.findOne({ reference: res.body.data.reference });
    expect(saved).toMatchObject({ source: 'website', status: 'new', adults: 2, children: 1, whatsappConsent: true });
    expect(saved.customer.email).toBe('priya@example.com');
    expect(saved.budget.amount).toBe(120000);
    expect(String(saved.packageId)).toBe(String(published1._id));
    expect(await Activity.countDocuments({ entityId: saved._id, action: 'enquiry.created' })).toBe(1);
  });
  it('works with only the required fields and composes a message', async () => {
    const res = await request(app).post('/api/enquiries').send({ name: 'Ravi Kumar', email: 'ravi@example.com', phone: '9876543210', adults: 1 });
    expect(res.status).toBe(201);
    const saved = await Enquiry.findOne({ reference: res.body.data.reference });
    expect(saved.message).toMatch(/1 adult/);
  });
  it('returns field-level validation errors', async () => {
    const res = await request(app).post('/api/enquiries').send({ name: 'A', email: 'nope', phone: 'abc', adults: 0, travelStart: '2099-02-10', travelEnd: '2099-02-01' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    const paths = res.body.error.details.map((d) => d.path);
    expect(paths).toEqual(expect.arrayContaining(['name', 'email', 'phone', 'adults', 'travelEnd']));
  });
  it('rejects past dates, unknown or draft packages', async () => {
    const past = await request(app).post('/api/enquiries').send({ ...valid, email: 'past@example.com', travelStart: '2001-01-01' });
    expect(past.status).toBe(400);
    for (const packageSlug of ['secret-draft', 'does-not-exist']) {
      const res = await request(app).post('/api/enquiries').send({ ...valid, email: 'pkg@example.com', packageSlug });
      expect(res.status, packageSlug).toBe(422);
      expect(res.body.error.details[0].path).toBe('packageSlug');
    }
  });
  it('cannot be used to set status, assignee or AI fields', async () => {
    const res = await request(app).post('/api/enquiries').send({ ...valid, email: 'mass@example.com', status: 'won', assignedTo: '64b64b64b64b64b64b64b64b', source: 'phone', ai: { replyDraft: 'x' } });
    expect(res.status).toBe(201);
    const saved = await Enquiry.findOne({ reference: res.body.data.reference });
    expect(saved).toMatchObject({ status: 'new', source: 'website', assignedTo: null });
    expect(saved.ai.replyDraft).toBeUndefined();
  });
  it('treats an immediate identical resubmission as a duplicate (same reference, 200)', async () => {
    const body = { ...valid, email: 'dup@example.com' };
    const a = await request(app).post('/api/enquiries').send(body);
    const b = await request(app).post('/api/enquiries').send(body);
    expect(a.status).toBe(201);
    expect(b.status).toBe(200);
    expect(b.body.data).toMatchObject({ reference: a.body.data.reference, duplicate: true });
    expect(await Enquiry.countDocuments({ 'customer.email': 'dup@example.com' })).toBe(1);
  });
  it('is rate limited per IP', async () => {
    const limited = createApp({ rateLimit: { enquiryMax: 2 } });
    const send = (i) => request(limited).post('/api/enquiries').send({ ...valid, email: `rl${i}@example.com` });
    expect((await send(1)).status).toBe(201);
    expect((await send(2)).status).toBe(201);
    const third = await send(3);
    expect(third.status).toBe(429);
    expect(third.body.error.code).toBe('RATE_LIMITED');
  });
});
