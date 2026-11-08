import mongoose from 'mongoose';
import { VERSION_STATUSES, OCCUPANCY_BASES, HOTEL_CATEGORIES } from '../../config/constants.js';

const { Schema } = mongoose;

const seasonSchema = new Schema({
  name: { type: String, required: [true, 'Season name is required'], trim: true, maxlength: 80 },
  startDate: { type: Date, required: [true, 'Season start date is required'] },
  endDate: { type: Date, required: [true, 'Season end date is required'] },
  pricePerPerson: {
    type: Number,
    required: [true, 'Price per person is required'],
    min: [0, 'Price cannot be negative'],
    validate: { validator: Number.isInteger, message: 'Price must be a whole number of rupees' },
  },
  occupancyBasis: { type: String, enum: OCCUPANCY_BASES, default: 'double' },
  gstIncluded: { type: Boolean, required: true, default: false },
  currency: { type: String, enum: ['INR'], default: 'INR' },
});

seasonSchema.pre('validate', function checkDates(next) {
  if (this.startDate && this.endDate && this.endDate < this.startDate) {
    this.invalidate('endDate', 'Season end date must be on or after the start date');
  }
  next();
});

const imageSchema = new Schema({ url: String, publicId: String, alt: String }, { _id: false });

const contentSchema = new Schema(
  {
    name: { type: String, required: [true, 'Package name is required'], trim: true, maxlength: 160 },
    destination: { type: String, trim: true, maxlength: 120 },
    category: { type: String, trim: true, maxlength: 60 },
    durationDays: { type: Number, min: 1, max: 60 },
    nights: { type: Number, min: 0, max: 59 },
    hotelCategory: { type: String, enum: HOTEL_CATEGORIES },
    summary: { type: String, trim: true, maxlength: 400 },
    description: { type: String, trim: true, maxlength: 8000 },
    itinerary: [
      new Schema(
        {
          day: { type: Number, required: true, min: 1 },
          title: { type: String, required: true, trim: true, maxlength: 160 },
          description: { type: String, trim: true, maxlength: 2000 },
        },
        { _id: false }
      ),
    ],
    hotels: [
      new Schema(
        {
          name: { type: String, required: true, trim: true, maxlength: 160 },
          location: { type: String, trim: true, maxlength: 120 },
          category: { type: String, enum: HOTEL_CATEGORIES },
          nights: { type: Number, min: 0 },
        },
        { _id: false }
      ),
    ],
    inclusions: [{ type: String, trim: true, maxlength: 240 }],
    exclusions: [{ type: String, trim: true, maxlength: 240 }],
    heroImage: { type: imageSchema, default: undefined },
    gallery: [imageSchema],
    location: {
      label: { type: String, trim: true, maxlength: 160 },
      lat: { type: Number, min: -90, max: 90 },
      lng: { type: Number, min: -180, max: 180 },
    },
    seo: {
      title: { type: String, trim: true, maxlength: 70 },
      description: { type: String, trim: true, maxlength: 170 },
    },
  },
  { _id: false }
);

const packageVersionSchema = new Schema(
  {
    packageId: { type: Schema.Types.ObjectId, ref: 'Package', required: true },
    versionNumber: { type: Number, required: true, min: 1 },
    status: { type: String, enum: VERSION_STATUSES, default: 'draft', required: true },
    // Optimistic-concurrency counter; incremented by every draft update.
    revision: { type: Number, default: 0, min: 0 },
    content: { type: contentSchema, required: true },
    seasons: [seasonSchema],
    restoredFromVersionId: { type: Schema.Types.ObjectId, ref: 'PackageVersion', default: null },
    changeNote: { type: String, trim: true, maxlength: 300 },
    publishedAt: Date,
    publishedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

packageVersionSchema.index({ packageId: 1, versionNumber: -1 }, { unique: true });
// At most ONE draft per package, enforced by the database.
packageVersionSchema.index(
  { packageId: 1 },
  { unique: true, partialFilterExpression: { status: 'draft' }, name: 'one_draft_per_package' }
);

// ---- Immutability of published history -------------------------------------
// Document saves: a published version can never be modified. The only allowed change is the
// draft -> published transition, which the versioning service opts into via $locals.publishing.
packageVersionSchema.pre('save', function guardPublished(next) {
  if (this.isNew) return next();
  const becamePublished = this.isModified('status') && this.status === 'published';
  if (becamePublished) {
    return this.$locals.publishing
      ? next()
      : next(new Error('Published versions can only be created through the publish workflow'));
  }
  if (this.status === 'published') {
    return next(new Error('Published package versions are immutable'));
  }
  return next();
});

// Query updates/deletes must explicitly target drafts (filter must contain status: 'draft').
const GUARDED_QUERY_OPS = ['updateOne', 'updateMany', 'findOneAndUpdate', 'findOneAndReplace', 'replaceOne', 'deleteOne', 'deleteMany', 'findOneAndDelete'];
packageVersionSchema.pre(GUARDED_QUERY_OPS, function guardQuery(next) {
  if (this.getFilter().status !== 'draft') {
    return next(new Error("Package versions can only be modified or deleted with an explicit { status: 'draft' } filter"));
  }
  return next();
});

export const PackageVersion = mongoose.models.PackageVersion || mongoose.model('PackageVersion', packageVersionSchema);
