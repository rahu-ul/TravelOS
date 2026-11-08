import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { setupDb, teardownDb, createUser } from '../support/hardening-helpers.js';
import { User } from '../../src/modules/auth/user.model.js';
import { Package } from '../../src/modules/packages/package.model.js';
import { PackageVersion } from '../../src/modules/packages/packageVersion.model.js';
import { Enquiry } from '../../src/modules/enquiries/enquiry.model.js';
import { Message } from '../../src/modules/enquiries/message.model.js';
import { Activity } from '../../src/modules/activity/activity.model.js';
import { Story } from '../../src/modules/stories/story.model.js';

const oid = () => new mongoose.Types.ObjectId();
const paths = (err) => Object.keys(err.errors);

let staff;
beforeAll(async () => {
  await setupDb();
  await Promise.all([Package, PackageVersion, Enquiry, Story].map((m) => m.init()));
  staff = await createUser({ email: 'models@test.example' });
});
afterAll(teardownDb);

describe('User', () => {
  it('requires name, email and password hash; rejects bad email and role', () => {
    const err = new User({ email: 'bad', role: 'wizard' }).validateSync();
    expect(paths(err)).toEqual(expect.arrayContaining(['name', 'email', 'passwordHash', 'role']));
  });
  it('lowercases email, hides passwordHash from JSON and enforces unique email', async () => {
    const hash = await User.hashPassword('Abcdefghij1');
    const u = await User.create({ name: 'Ann', email: 'ANN@Test.Example', passwordHash: hash });
    expect(u.email).toBe('ann@test.example');
    expect(u.toJSON().passwordHash).toBeUndefined();
    expect(hash).not.toContain('Abcdefghij1');
    await expect(User.create({ name: 'Ann 2', email: 'ann@test.example', passwordHash: hash })).rejects.toMatchObject({ code: 11000 });
  });
});

describe('Package', () => {
  it('validates code and slug formats', () => {
    const err = new Package({ code: 'KL7', slug: 'Bad Slug', createdBy: staff._id }).validateSync();
    expect(paths(err)).toEqual(expect.arrayContaining(['code', 'slug']));
    expect(new Package({ code: 'pkg-kl-07', slug: 'munnar-trip', createdBy: staff._id }).validateSync()).toBeUndefined();
  });
  it('enforces unique code and slug', async () => {
    await Package.create({ code: 'PKG-AA-01', slug: 'aa-one', createdBy: staff._id });
    await expect(Package.create({ code: 'PKG-AA-01', slug: 'aa-two', createdBy: staff._id })).rejects.toMatchObject({ code: 11000 });
  });
});

describe('PackageVersion', () => {
  const season = (over = {}) => ({ name: 'Peak', startDate: '2026-10-01', endDate: '2027-03-31', pricePerPerson: 32500, gstIncluded: false, ...over });
  const make = (over = {}) => new PackageVersion({ packageId: oid(), versionNumber: 1, createdBy: staff._id, content: { name: 'Test package' }, seasons: [season()], ...over });

  it('accepts a valid version and applies defaults', () => {
    const v = make();
    expect(v.validateSync()).toBeUndefined();
    expect(v.status).toBe('draft');
    expect(v.seasons[0].currency).toBe('INR');
    expect(v.seasons[0].occupancyBasis).toBe('double');
  });
  it('rejects a season ending before it starts', async () => {
    // Date-order rule lives in a pre('validate') hook, so use async validate().
    const err = await make({ seasons: [season({ startDate: '2026-12-01', endDate: '2026-11-01' })] }).validate().catch((e) => e);
    expect(Object.keys(err.errors).some((p) => p.endsWith('endDate'))).toBe(true);
    await expect(make({ seasons: [season({ startDate: '2026-11-01', endDate: '2026-11-01' })] }).validate()).resolves.toBeUndefined();
  });
  it('rejects negative or fractional prices and a missing price', () => {
    expect(make({ seasons: [season({ pricePerPerson: -1 })] }).validateSync()).toBeDefined();
    expect(make({ seasons: [season({ pricePerPerson: 100.5 })] }).validateSync()).toBeDefined();
    expect(make({ seasons: [season({ pricePerPerson: undefined })] }).validateSync()).toBeDefined();
  });
  it('requires a package name', () => {
    expect(make({ content: {} }).validateSync()).toBeDefined();
  });

  describe('immutability and single draft', () => {
    let packageId;
    beforeEach(() => { packageId = oid(); });

    it('allows only one draft per package (database-enforced)', async () => {
      await PackageVersion.create({ packageId, versionNumber: 1, createdBy: staff._id, content: { name: 'A' } });
      await expect(PackageVersion.create({ packageId, versionNumber: 2, createdBy: staff._id, content: { name: 'B' } })).rejects.toMatchObject({ code: 11000 });
    });
    it('cannot be published except through the publish workflow flag', async () => {
      const v = await PackageVersion.create({ packageId, versionNumber: 1, createdBy: staff._id, content: { name: 'A' } });
      v.status = 'published';
      await expect(v.save()).rejects.toThrow(/publish workflow/);
      const again = await PackageVersion.findById(v._id);
      again.$locals.publishing = true;
      again.status = 'published';
      again.publishedAt = new Date();
      await expect(again.save()).resolves.toBeDefined();
    });
    it('published versions are immutable via save, update and delete', async () => {
      const v = new PackageVersion({ packageId, versionNumber: 1, status: 'published', createdBy: staff._id, content: { name: 'Live' }, publishedAt: new Date() });
      await v.save();
      const loaded = await PackageVersion.findById(v._id);
      loaded.content.name = 'Tampered';
      await expect(loaded.save()).rejects.toThrow(/immutable/);
      await expect(PackageVersion.updateOne({ _id: v._id }, { 'content.name': 'x' })).rejects.toThrow(/status: 'draft'/);
      await expect(PackageVersion.updateOne({ _id: v._id, status: 'published' }, { 'content.name': 'x' })).rejects.toThrow(/status: 'draft'/);
      await expect(PackageVersion.deleteOne({ _id: v._id })).rejects.toThrow();
      expect((await PackageVersion.findById(v._id)).content.name).toBe('Live');
    });
    it('drafts can be updated with an explicit draft filter', async () => {
      const v = await PackageVersion.create({ packageId, versionNumber: 1, createdBy: staff._id, content: { name: 'A' } });
      const res = await PackageVersion.updateOne({ _id: v._id, status: 'draft', revision: 0 }, { $set: { 'content.name': 'B' }, $inc: { revision: 1 } });
      expect(res.modifiedCount).toBe(1);
    });
  });
});

describe('Enquiry', () => {
  const valid = (over = {}) => ({
    customer: { name: 'Priya Sharma', email: 'Priya@Example.com', phone: '+91 98765 43210' },
    message: 'Hi, 2 adults and 1 kid, Kerala 5-6 nights in December.',
    adults: 2,
    ...over,
  });
  it('accepts a valid enquiry, generates a reference and defaults', async () => {
    const e = await Enquiry.create(valid());
    expect(e.reference).toMatch(/^ENQ-\d{4}-[0-9A-F]{8}$/);
    expect(e.status).toBe('new');
    expect(e.children).toBe(0);
    expect(e.customer.email).toBe('priya@example.com');
    expect(e.whatsappConsent).toBe(false);
  });
  it('validates required fields, counts, phone and email', () => {
    const err = new Enquiry({ customer: { name: 'A', email: 'nope', phone: 'abc' }, adults: 0, children: -1, message: 'hi' }).validateSync();
    expect(paths(err)).toEqual(expect.arrayContaining(['customer.name', 'customer.email', 'customer.phone', 'adults', 'children', 'message']));
  });
  it('rejects an invalid status and travel end before start', async () => {
    expect(paths(new Enquiry(valid({ status: 'bogus' })).validateSync())).toContain('status');
    const err = await new Enquiry(valid({ travelStart: '2026-12-10', travelEnd: '2026-12-01' })).validate().catch((e) => e);
    expect(paths(err)).toContain('travelEnd');
  });
  it('keeps AI task statuses constrained and the reference immutable', async () => {
    expect(paths(new Enquiry(valid({ ai: { status: { extract: 'maybe' } } })).validateSync())).toContain('ai.status.extract');
    const e = await Enquiry.create(valid());
    const original = e.reference;
    e.reference = 'ENQ-HACKED';
    await e.save();
    expect((await Enquiry.findById(e._id)).reference).toBe(original);
  });
});

describe('Message', () => {
  it('requires a staff approver for replies but not for acknowledgements', () => {
    const base = { enquiryId: oid(), to: 'a@b.co', body: 'Hello' };
    expect(paths(new Message({ ...base, type: 'reply' }).validateSync())).toContain('approvedBy');
    expect(new Message({ ...base, type: 'acknowledgement' }).validateSync()).toBeUndefined();
    expect(new Message({ ...base, type: 'reply', approvedBy: staff._id }).deliveryStatus).toBe('mocked');
  });
});

describe('Activity', () => {
  it('is append-only', async () => {
    const a = await Activity.create({ actorId: staff._id, action: 'package.created', entityType: 'package', entityId: oid() });
    a.action = 'package.updated';
    await expect(a.save()).rejects.toThrow(/append-only/);
    await expect(Activity.updateOne({ _id: a._id }, { action: 'package.updated' })).rejects.toThrow(/append-only/);
    await expect(Activity.deleteMany({})).rejects.toThrow(/append-only/);
  });
  it('rejects unknown actions', () => {
    expect(paths(new Activity({ action: 'hacked', entityType: 'package', entityId: oid() }).validateSync())).toContain('action');
  });
});

describe('Story', () => {
  it('sets publishedAt when published and validates the slug', async () => {
    const s = await Story.create({ title: 'Backwater mornings', slug: 'backwater-mornings', body: 'Text', status: 'published', author: staff._id });
    expect(s.publishedAt).toBeInstanceOf(Date);
    expect(paths(new Story({ title: 'x', slug: 'Bad Slug', author: staff._id }).validateSync())).toEqual(expect.arrayContaining(['title', 'slug', 'body']));
  });
  it('keeps drafts unpublished', () => {
    const s = new Story({ title: 'Draft story', slug: 'draft-story', body: 'b', author: staff._id });
    s.validateSync();
    expect(s.status).toBe('draft');
    expect(s.publishedAt).toBeUndefined();
  });
});
