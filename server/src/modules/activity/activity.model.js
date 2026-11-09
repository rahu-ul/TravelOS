import mongoose from 'mongoose';
import { ACTIVITY_ACTIONS, ACTIVITY_ENTITY_TYPES } from '../../config/constants.js';

const { Schema } = mongoose;

// Append-only audit log. Powers package history and enquiry history.
const activitySchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', default: null }, // null = system / public submission
    action: { type: String, enum: ACTIVITY_ACTIONS, required: true },
    entityType: { type: String, enum: ACTIVITY_ENTITY_TYPES, required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

activitySchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
activitySchema.index({ createdAt: -1 });

const IMMUTABLE_OPS = ['updateOne', 'updateMany', 'findOneAndUpdate', 'replaceOne', 'deleteOne', 'deleteMany', 'findOneAndDelete'];
activitySchema.pre(IMMUTABLE_OPS, function blockMutations(next) {
  next(new Error('Activity records are append-only'));
});
activitySchema.pre('save', function blockResave(next) {
  next(this.isNew ? undefined : new Error('Activity records are append-only'));
});

export const Activity = mongoose.models.Activity || mongoose.model('Activity', activitySchema);
