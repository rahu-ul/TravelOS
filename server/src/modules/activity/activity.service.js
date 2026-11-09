import { Activity } from './activity.model.js';

export const activityService = {
  log({ actorId = null, action, entityType, entityId, metadata = {} }) {
    return Activity.create({ actorId, action, entityType, entityId, metadata });
  },
  listForEntity(entityType, entityId, { limit = 50 } = {}) {
    return Activity.find({ entityType, entityId }).sort({ createdAt: -1 }).limit(limit).populate('actorId', 'name role').lean();
  },
};
