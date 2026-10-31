import { execute, newId, nowIso } from '../db.js';

/** Fire-and-forget audit entry. Audit failures never break the request. */
export function audit(req, action, resource, resourceId = null, detail = null) {
  const params = [
    newId('aud'),
    req.user?.id ?? null,
    action,
    resource,
    resourceId == null ? null : String(resourceId),
    detail == null ? null : JSON.stringify(detail),
    req.ip ?? null,
    nowIso(),
  ];

  void execute(
    `INSERT INTO audit_logs (id, user_id, action, resource, resource_id, detail, ip, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    params
  ).catch((error) => {
    console.warn('[audit] failed to write entry:', error.message);
  });
}
