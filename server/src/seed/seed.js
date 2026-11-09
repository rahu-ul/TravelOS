import { env } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { logger } from '../utils/logger.js';
import { ROLES } from '../config/constants.js';
import { User } from '../modules/auth/user.model.js';
import { Package } from '../modules/packages/package.model.js';
import { PackageVersion } from '../modules/packages/packageVersion.model.js';
import { Enquiry } from '../modules/enquiries/enquiry.model.js';
import { Message } from '../modules/enquiries/message.model.js';
import { Activity } from '../modules/activity/activity.model.js';
import { Story } from '../modules/stories/story.model.js';
import { passwordPolicy } from '../modules/auth/auth.validation.js';
import { packagesSeed } from './data/packages.js';
import { demoPackagesSeed } from './data/packages.demo.js';
import { storiesSeed } from './data/stories.js';
import { enquiriesSeed } from './data/enquiries.js';

const DEV_DEFAULT_PASSWORD = 'TravelOS#Demo2026';

async function seed() {
  // Demo credentials must never exist in production unless explicitly forced.
  if (env.isProduction && !env.ALLOW_PROD_SEED) {
    throw new Error('Refusing to seed in production. Set ALLOW_PROD_SEED=true and SEED_DEFAULT_PASSWORD to a strong value if you really mean it.');
  }
  if (env.isProduction && !env.SEED_DEFAULT_PASSWORD) {
    throw new Error('SEED_DEFAULT_PASSWORD is required when seeding in production.');
  }
  const password = env.SEED_DEFAULT_PASSWORD || DEV_DEFAULT_PASSWORD;
  passwordPolicy.parse(password);

  try {
    await connectDB();
    logger.info('Clearing existing data (users, packages, versions, enquiries, messages, activities, stories)...');
    // Native driver calls on purpose: bypasses the immutability / append-only model guards. Dev seed only.
    await Promise.all([User, Package, PackageVersion, Enquiry, Message, Activity, Story].map((m) => m.collection.deleteMany({})));
    await Promise.all([User, Package, PackageVersion, Enquiry, Message, Activity, Story].map((m) => m.syncIndexes()));

    // ---- Users
    const passwordHash = await User.hashPassword(password);
    const adminEmail = env.DEMO_ADMIN_EMAIL || 'admin@travelos.example';
    const adminPassword = env.DEMO_ADMIN_PASSWORD ? await User.hashPassword(env.DEMO_ADMIN_PASSWORD) : passwordHash;

    const [admin, staff2, traveller] = await User.create([
      { name: 'Anjali Menon', email: adminEmail, passwordHash: adminPassword, role: ROLES.STAFF_ADMIN },
      { name: 'Rohit Nair', email: 'consultant@travelos.example', passwordHash, role: ROLES.STAFF_ADMIN },
      { name: 'Demo Traveller', email: 'traveller@travelos.example', passwordHash, role: ROLES.TRAVELLER },
    ]);
    const staffByKey = { staff1: admin, staff2 };

  // ---- Packages + versions
  const packageByCode = {};
  for (const p of [...packagesSeed, ...demoPackagesSeed]) {
    const pkg = new Package({ code: p.code, slug: p.slug, isDemo: Boolean(p.isDemo), createdBy: admin._id });
    const version = new PackageVersion({
      packageId: pkg._id,
      versionNumber: 1,
      status: p.published ? 'published' : 'draft',
      content: p.content,
      seasons: p.seasons,
      createdBy: admin._id,
      publishedAt: p.published ? new Date() : undefined,
      publishedBy: p.published ? admin._id : undefined,
      changeNote: p.published ? 'Initial published version (seed)' : 'Initial draft (seed)',
    });
    await version.save();

    if (p.published) {
      pkg.publishedVersionId = version._id;
      pkg.listing = {
        name: p.content.name,
        destination: p.content.destination,
        category: p.content.category,
        durationDays: p.content.durationDays,
        nights: p.content.nights,
        heroImage: p.content.heroImage,
        startingPrice: p.seasons.length ? Math.min(...p.seasons.map((s) => s.pricePerPerson)) : null, // null = price on request
        currency: 'INR',
        summary: p.content.summary,
      };
    } else {
      pkg.draftVersionId = version._id;
    }
    await pkg.save();
    packageByCode[p.code] = pkg;
    await Activity.create({ actorId: admin._id, action: 'package.created', entityType: 'package', entityId: pkg._id, metadata: { code: p.code } });
    if (p.published) {
      await Activity.create({ actorId: admin._id, action: 'package.published', entityType: 'package', entityId: pkg._id, metadata: { versionNumber: 1 } });
    }
  }

  // ---- Stories
  for (const s of storiesSeed) {
    const { relatedPackageCodes, ...rest } = s;
    await Story.create({ ...rest, author: admin._id, relatedPackageIds: relatedPackageCodes.map((c) => packageByCode[c]._id) });
  }

  // ---- Enquiries
  for (const e of enquiriesSeed) {
    const { packageCode, assignTo, note, ...rest } = e;
    const assignee = assignTo ? staffByKey[assignTo] : null;
    const enquiry = await Enquiry.create({
      ...rest,
      packageId: packageCode ? packageByCode[packageCode]._id : null,
      assignedTo: assignee?._id ?? null,
      statusChangedAt: e.status === 'new' ? undefined : new Date(),
      notes: note && assignee ? [{ authorId: assignee._id, body: note }] : [],
    });
    await Activity.create({ actorId: null, action: 'enquiry.created', entityType: 'enquiry', entityId: enquiry._id, metadata: { source: e.source } });
    if (assignee) {
      await Activity.create({ actorId: admin._id, action: 'enquiry.assigned', entityType: 'enquiry', entityId: enquiry._id, metadata: { assignedTo: String(assignee._id) } });
    }
  }

  const counts = {
    users: await User.countDocuments(),
    packages: await Package.countDocuments(),
    packageVersions: await PackageVersion.countDocuments(),
    enquiries: await Enquiry.countDocuments(),
    stories: await Story.countDocuments(),
    activities: await Activity.countDocuments(),
  };
  logger.info('Seed complete:', JSON.stringify(counts));
  if (!env.isProduction) {
    logger.info('DEV-ONLY demo logins (shared password: see SEED_DEFAULT_PASSWORD or README):');
    logger.info('  staff admin : admin@travelos.example');
    logger.info('  staff admin : consultant@travelos.example');
    logger.info('  traveller   : traveller@travelos.example');
  }
  } finally {
    await disconnectDB();
  }
}

seed().catch((err) => {
  logger.error('Seed failed:', err.message);
  process.exit(1);
});
