import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import { User } from '../../src/modules/auth/user.model.js';
import { Package } from '../../src/modules/packages/package.model.js';
import { PackageVersion } from '../../src/modules/packages/packageVersion.model.js';
import { Enquiry } from '../../src/modules/enquiries/enquiry.model.js';
import { Message } from '../../src/modules/enquiries/message.model.js';
import { Story } from '../../src/modules/stories/story.model.js';

const oid = () => new mongoose.Types.ObjectId();
const errorPaths = (err) => Object.keys(err?.errors ?? {});
const validate = async (doc) => doc.validate().then(() => null, (e) => e);

describe('User model', () => {
  it('rejects bad email, unknown role and missing hash', async () => {
    const err = await validate(new User({ name: 'A B', email: 'nope', role: 'god' }));
    expect(errorPaths(err)).toEqual(expect.arrayContaining(['email', 'role', 'passwordHash']));
  });
  it('lowercases email and never serialises the password hash', async () => {
    const u = new User({ name: 'Ann Lee', email: 'ANN@Example.com', passwordHash: 'x' });
    expect(await validate(u)).toBeNull();
    expect(u.email).toBe('ann@example.com');
    expect(u.role).toBe('traveller');
    expect(u.toJSON().passwordHash).toBeUndefined();
  });
});

describe('Package model', () => {
  it('requires a well-formed code and slug', async () => {
    const err = await validate(new Package({ code: 'KL7', slug: 'Bad Slug', createdBy: oid() }));
    expect(errorPaths(err)).toEqual(expect.arrayContaining(['code', 'slug']));
    expect(await validate(new Package({ code: 'pkg-kl-07', slug: 'good-slug', createdBy: oid() }))).toBeNull();
  });
});

describe('PackageVersion model', () => {
  const base = () => ({ packageId: oid(), versionNumber: 1, createdBy: oid(), content: { name: 'X' } });
  it('accepts a minimal draft (drafts may be incomplete)', async () => {
    expect(await validate(new PackageVersion(base()))).toBeNull();
  });
  it('requires a package name', async () => {
    const err = await validate(new PackageVersion({ ...base(), content: {} }));
    expect(errorPaths(err)).toContain('content.name');
  });
  it('validates season dates, price and enums', async () => {
    const bad = new PackageVersion({
      ...base(),
      seasons: [{ name: 'Peak', startDate: '2027-03-31', endDate: '2026-10-01', pricePerPerson: -5, occupancyBasis: 'weird', currency: 'USD' }],
    });
    const err = await validate(bad);
    const paths = errorPaths(err).join(' ');
    expect(paths).toMatch(/endDate/);
    expect(paths).toMatch(/pricePerPerson/);
    expect(paths).toMatch(/occupancyBasis/);
    expect(paths).toMatch(/currency/);
  });
  it('rejects fractional prices', async () => {
    const err = await validate(new PackageVersion({ ...base(), seasons: [{ name: 'P', startDate: '2026-10-01', endDate: '2026-12-01', pricePerPerson: 100.5 }] }));
    expect(errorPaths(err).join(' ')).toMatch(/pricePerPerson/);
  });
  it('refuses to save changes to a published version (immutability)', async () => {
    const doc = PackageVersion.hydrate({ ...base(), _id: oid(), status: 'published', content: { name: 'Live' } });
    doc.content.name = 'Tampered';
    await expect(doc.save()).rejects.toThrow(/immutable/);
  });
  it('refuses draft -> published without the publish workflow flag', async () => {
    const doc = PackageVersion.hydrate({ ...base(), _id: oid(), status: 'draft' });
    doc.status = 'published';
    await expect(doc.save()).rejects.toThrow(/publish workflow/);
  });
  it('blocks query updates and deletes without an explicit draft filter', async () => {
    await expect(PackageVersion.updateOne({ _id: oid() }, { $set: { changeNote: 'x' } })).rejects.toThrow(/status: 'draft'/);
    await expect(PackageVersion.deleteMany({})).rejects.toThrow(/status: 'draft'/);
  });
});

describe('Enquiry model', () => {
  const valid = () => ({
    customer: { name: 'Priya Sharma', email: 'priya@example.com', phone: '+91 98765 43210' },
    message: 'Hi, 2 adults and 1 kid, Kerala in December',
    adults: 2,
  });
  it('accepts a valid enquiry and generates a reference', async () => {
    const e = new Enquiry(valid());
    expect(await validate(e)).toBeNull();
    expect(e.reference).toMatch(/^ENQ-\d{4}-[0-9A-F]{8}$/);
    expect(e.status).toBe('new');
    expect(e.children).toBe(0);
    expect(e.whatsappConsent).toBe(false);
  });
  it('requires contact details, a message and at least one adult', async () => {
    const err = await validate(new Enquiry({ customer: {}, adults: 0 }));
    expect(errorPaths(err)).toEqual(expect.arrayContaining(['customer.name', 'customer.email', 'customer.phone', 'message', 'adults']));
  });
  it('rejects invalid email, phone, status and reversed dates', async () => {
    const err = await validate(
      new Enquiry({ ...valid(), customer: { name: 'Priya', email: 'bad', phone: 'abc' }, status: 'maybe', travelStart: '2027-01-10', travelEnd: '2027-01-01' })
    );
    expect(errorPaths(err)).toEqual(expect.arrayContaining(['customer.email', 'customer.phone', 'status', 'travelEnd']));
  });
  it('stores unknown AI-extracted values as null rather than guessing', async () => {
    const e = new Enquiry({ ...valid(), extracted: { ai: { adults: 2 } } });
    expect(e.extracted.ai.budgetInr).toBeNull();
    expect(e.extracted.ai.destination).toBeNull();
  });
});

describe('Message model', () => {
  it('requires a human approver for replies but not for acknowledgements', async () => {
    const base = { enquiryId: oid(), to: 'a@b.com', body: 'Hello' };
    const reply = await validate(new Message({ ...base, type: 'reply' }));
    expect(errorPaths(reply)).toContain('approvedBy');
    expect(await validate(new Message({ ...base, type: 'acknowledgement' }))).toBeNull();
    expect(await validate(new Message({ ...base, type: 'reply', approvedBy: oid() }))).toBeNull();
  });
});

describe('Story model', () => {
  it('validates slug/title/body and stamps publishedAt when published', async () => {
    const err = await validate(new Story({ slug: 'Bad Slug', author: oid() }));
    expect(errorPaths(err)).toEqual(expect.arrayContaining(['title', 'slug', 'body']));
    const s = new Story({ title: 'Hello world', slug: 'hello-world', body: 'text', author: oid(), status: 'published' });
    expect(await validate(s)).toBeNull();
    expect(s.publishedAt).toBeInstanceOf(Date);
  });
});
