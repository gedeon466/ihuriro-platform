export const USER_ROLES = [
  'citizen',
  'student',
  'parent',
  'teacher',
  'business',
  'health',
  'government',
  'admin',
] as const;

export const SELF_ASSIGNABLE_ROLES = USER_ROLES.filter((role) => role !== 'admin');

export const USER_STATUSES = ['active', 'pending', 'suspended'] as const;

export const COMPLAINT_STATUSES = ['pending', 'in-review', 'resolved', 'rejected'] as const;

export const LANGUAGES = ['en', 'rw', 'fr'] as const;
