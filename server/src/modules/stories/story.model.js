import mongoose from 'mongoose';
import { SLUG_REGEX, STORY_STATUSES } from '../../config/constants.js';

const { Schema } = mongoose;

// Staff-managed blog ("travel stories"). Can link to packages so blogs are connected to what is for sale.
const storySchema = new Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true, minlength: 3, maxlength: 160 },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      trim: true,
      lowercase: true,
      match: [SLUG_REGEX, 'Slug must be lowercase letters, numbers and hyphens'],
      unique: true,
    },
    excerpt: { type: String, trim: true, maxlength: 300 },
    body: { type: String, required: [true, 'Story body is required'], maxlength: 30000 },
    coverImage: { url: String, publicId: String, alt: String },
    tags: [{ type: String, trim: true, lowercase: true, maxlength: 40 }],
    status: { type: String, enum: STORY_STATUSES, default: 'draft' },
    publishedAt: Date,
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    relatedPackageIds: [{ type: Schema.Types.ObjectId, ref: 'Package' }],
    seo: {
      title: { type: String, trim: true, maxlength: 70 },
      description: { type: String, trim: true, maxlength: 170 },
    },
    isDemo: { type: Boolean, default: false }, // clearly identifies seeded demo content
  },
  { timestamps: true }
);

storySchema.pre('validate', function setPublishedAt(next) {
  if (this.status === 'published' && !this.publishedAt) this.publishedAt = new Date();
  next();
});

storySchema.index({ status: 1, publishedAt: -1 });
storySchema.index({ tags: 1 });

export const Story = mongoose.models.Story || mongoose.model('Story', storySchema);
