export const ROLES = Object.freeze({
  TRAVELLER: 'traveller',
  STAFF_ADMIN: 'staff_admin',
  // Reserved for later: EDITOR: 'editor', CONSULTANT: 'consultant'
});
export const ROLE_VALUES = Object.values(ROLES);

export const PERMISSIONS = Object.freeze({
  PACKAGES_READ: 'packages:read',
  PACKAGES_WRITE: 'packages:write',
  PACKAGES_PUBLISH: 'packages:publish',
  ENQUIRIES_READ: 'enquiries:read',
  ENQUIRIES_WRITE: 'enquiries:write',
  STORIES_WRITE: 'stories:write',
  USERS_READ: 'users:read',
});

// Adding Editor / Consultant later = adding one entry here.
export const ROLE_PERMISSIONS = Object.freeze({
  [ROLES.TRAVELLER]: [],
  [ROLES.STAFF_ADMIN]: Object.values(PERMISSIONS),
});

export const ENQUIRY_STATUSES = ['new', 'contacted', 'quoted', 'won', 'lost'];
export const ENQUIRY_SOURCES = ['website', 'phone', 'whatsapp', 'email', 'walk_in', 'other'];
export const AI_TASK_STATUSES = ['pending', 'ok', 'failed'];
export const VERSION_STATUSES = ['draft', 'published'];
export const STORY_STATUSES = ['draft', 'published'];
export const OCCUPANCY_BASES = ['single', 'double', 'triple', 'family'];
export const HOTEL_CATEGORIES = ['3-star', '4-star', '5-star', 'homestay', 'mixed'];
export const MESSAGE_TYPES = ['acknowledgement', 'reply'];
export const DELIVERY_STATUSES = ['mocked', 'sent', 'failed'];

export const ACTIVITY_ACTIONS = [
  'package.created',
  'package.updated',
  'package.published',
  'package.restored',
  'package.duplicated',
  'enquiry.created',
  'enquiry.assigned',
  'enquiry.status_changed',
  'enquiry.note_added',
  'enquiry.reply_approved',
  'story.created',
  'story.updated',
  'story.published',
];
export const ACTIVITY_ENTITY_TYPES = ['package', 'enquiry', 'story'];

export const COOKIE_NAME = 'travelos_token';
export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
