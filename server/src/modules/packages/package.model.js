import mongoose from 'mongoose';
import { SLUG_REGEX } from '../../config/constants.js';

const { Schema } = mongoose;

// Stable identity of a package + pointers to its published/draft versions.
// `listing` is a denormalised projection written ONLY when a version is published.
const listingSchema = new Schema(
  {
    name: String,
    destination: String,
    category: String,
    durationDays: Number,
    nights: Number,
    heroImage: { url: String, publicId: String, alt: String },
    startingPrice: Number, // minimum season price, computed by the backend at publish time
    currency: { type: String, default: 'INR' },
    summary: String,
  },
  { _id: false }
);

const packageSchema = new Schema(
  {
    code: {
      type: String,
      required: [true, 'Package code is required'],
      trim: true,
      uppercase: true,
      match: [/^PKG-[A-Z]{2}-\d{2}$/, 'Package code must look like PKG-KL-07'],
      unique: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      trim: true,
      lowercase: true,
      match: [SLUG_REGEX, 'Slug must be lowercase letters, numbers and hyphens'],
      unique: true,
    },
    publishedVersionId: { type: Schema.Types.ObjectId, ref: 'PackageVersion', default: null },
    draftVersionId: { type: Schema.Types.ObjectId, ref: 'PackageVersion', default: null },
    // true = seeded demo package (placeholder content and prices, NOT verified client data). Shown with a badge on the site.
    isDemo: { type: Boolean, default: false },
    listing: { type: listingSchema, default: undefined },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

packageSchema.index({ publishedVersionId: 1 }, { sparse: true });
packageSchema.index({ 'listing.destination': 1, 'listing.category': 1 });

packageSchema.virtual('isPublished').get(function isPublished() {
  return Boolean(this.publishedVersionId);
});

export const Package = mongoose.models.Package || mongoose.model('Package', packageSchema);
