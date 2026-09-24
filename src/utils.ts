// Collision-resistant id generator for client-created records.
// Plain `${prefix}-${Date.now()}` collides when two records are created in the
// same millisecond (e.g. a double-submit), which the backend's per-user
// updateOrCreate(custom_id) silently treats as an update instead of a new row.
export const generateId = (prefix: string): string =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
