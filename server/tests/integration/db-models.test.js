import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { connectTestDb, dropTestDb, createUser } from '../helpers.js';
import { User } from '../../src/modules/auth/user.model.js';
import { Package } from '../../src/modules/packages/package.model.js';
import { PackageVersion } from '../../src/modules/packages/packageVersion.model.js';
import { Activity } from '../../src/modules/activity/activity.model.js';

beforeAll(connectTestDb);
afterAll(dropTestDb);

describe('database constraints', () => {
  it('enforces unique user email', async () => {
    await createUser({ email: 'dup@test.example' });
    await expect(createUser({ email: 'DUP@test.example' })).rejects.toMatchObject({ code: 11000 });
  });

  it('allows only one draft per package but many published versions', async () => {
    const admin = await createUser();
    const pkg = await Package.create({ code: 'PKG-KL-99', slug: 'unique-one', createdBy: admin._id });
    const mk = (n, status) => ({ packageId: pkg._id, versionNumber: n, status, content: { name: `v${n}` }, createdBy: admin._id });
    await PackageVersion.create(mk(1, 'published'));
    await PackageVersion.create(mk(2, 'published'));
    await PackageVersion.create(mk(3, 'draft'));
    await expect(PackageVersion.create(mk(4, 'draft'))).rejects.toMatchObject({ code: 11000 });
    await expect(PackageVersion.create(mk(2, 'published'))).rejects.toMatchObject({ code: 11000 }); // version number unique per package
  });

  it('allows the draft -> published transition only via the publish flag, and then locks the version', async () => {
    const admin = await createUser();
    const pkg = await Package.create({ code: 'PKG-KL-98', slug: 'publish-flow', createdBy: admin._id });
    const draft = await PackageVersion.create({ packageId: pkg._id, versionNumber: 1, content: { name: 'Draft' }, createdBy: admin._id });
    draft.status = 'published';
    draft.$locals.publishing = true;
    await draft.save();
    const reloaded = await PackageVersion.findById(draft._id);
    reloaded.content.name = 'Changed after publish';
    await expect(reloaded.save()).rejects.toThrow(/immutable/);
  });

  it('allows draft edits through an explicit draft-filtered update', async () => {
    const admin = await createUser();
    const pkg = await Package.create({ code: 'PKG-KL-97', slug: 'draft-edit', createdBy: admin._id });
    const v = await PackageVersion.create({ packageId: pkg._id, versionNumber: 1, content: { name: 'A' }, createdBy: admin._id });
    const res = await PackageVersion.updateOne({ _id: v._id, status: 'draft', revision: 0 }, { $set: { 'content.name': 'B' }, $inc: { revision: 1 } });
    expect(res.modifiedCount).toBe(1);
    const stale = await PackageVersion.updateOne({ _id: v._id, status: 'draft', revision: 0 }, { $set: { 'content.name': 'C' }, $inc: { revision: 1 } });
    expect(stale.modifiedCount).toBe(0); // stale revision matches nothing -> caller returns 409
  });

  it('keeps activity records append-only', async () => {
    const a = await Activity.create({ action: 'enquiry.created', entityType: 'enquiry', entityId: new mongoose.Types.ObjectId() });
    a.metadata = { tampered: true };
    await expect(a.save()).rejects.toThrow(/append-only/);
    await expect(Activity.deleteMany({})).rejects.toThrow(/append-only/);
  });

  it('never returns the password hash unless explicitly selected', async () => {
    const u = await createUser({ email: 'hash@test.example' });
    expect((await User.findById(u._id)).passwordHash).toBeUndefined();
    expect((await User.findById(u._id).select('+passwordHash')).passwordHash).toMatch(/^\$2[aby]\$/);
  });
});
