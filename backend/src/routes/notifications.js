import express from 'express';
import { z } from 'zod';
import { execute, newId, nowIso, query, queryOne, today } from '../db.js';
import { audit } from '../lib/audit.js';
import {
  AppError,
  asyncHandler,
  pagination,
  parseBody,
  serializeNotification,
} from '../lib/http.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { limit, offset } = pagination(req.query);
    const unreadOnly = String(req.query.unread || '') === 'true';
    const filter = unreadOnly ? 'AND `read` = 0' : '';

    const rows = await query(
      `SELECT * FROM notifications
       WHERE user_id = ? ${filter}
       ORDER BY \`date\` DESC, created_at DESC
       LIMIT ? OFFSET ?`,
      [req.user.id, limit, offset]
    );

    const unread = await queryOne(
      'SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND `read` = 0',
      [req.user.id]
    );

    res.json({
      notifications: rows.map(serializeNotification),
      unread: Number(unread.count),
      limit,
      offset,
    });
  })
);

router.post(
  '/read-all',
  asyncHandler(async (req, res) => {
    const result = await execute(
      'UPDATE notifications SET `read` = 1 WHERE user_id = ? AND `read` = 0',
      [req.user.id]
    );
    const updated = Number(result.affectedRows);
    audit(req, 'notification.read-all', 'notification', null, { updated });
    res.json({ ok: true, updated });
  })
);

router.patch(
  '/:id/read',
  asyncHandler(async (req, res) => {
    const row = await queryOne('SELECT * FROM notifications WHERE id = ? AND user_id = ?', [
      req.params.id,
      req.user.id,
    ]);
    if (!row) throw new AppError(404, 'Notification not found.');

    await execute('UPDATE notifications SET `read` = 1 WHERE id = ?', [row.id]);
    res.json({ notification: serializeNotification({ ...row, read: 1 }) });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const row = await queryOne('SELECT * FROM notifications WHERE id = ? AND user_id = ?', [
      req.params.id,
      req.user.id,
    ]);
    if (!row) throw new AppError(404, 'Notification not found.');

    await execute('DELETE FROM notifications WHERE id = ?', [row.id]);
    audit(req, 'notification.delete', 'notification', row.id);
    res.json({ ok: true });
  })
);

const sendSchema = z.object({
  audience: z.enum(['user', 'all']).optional().default('user'),
  userId: z.string().trim().optional(),
  type: z.enum(['government', 'school', 'health', 'business', 'system']),
  title: z.string().trim().min(3).max(120),
  message: z.string().trim().min(3).max(1000),
  channel: z.enum(['sms', 'email', 'system']).optional().default('system'),
});

router.post(
  '/',
  requireRole('admin', 'government'),
  asyncHandler(async (req, res) => {
    const data = parseBody(sendSchema, req.body);
    const timestamp = nowIso();

    let recipients;
    if (data.audience === 'all') {
      recipients = await query("SELECT id FROM users WHERE status = 'active'");
    } else {
      if (!data.userId) throw new AppError(422, 'Choose a recipient.');
      const target = await queryOne('SELECT id FROM users WHERE id = ?', [data.userId]);
      if (!target) throw new AppError(404, 'Recipient not found.');
      recipients = [target];
    }

    for (const recipient of recipients) {
      await execute(
        `INSERT INTO notifications (id, user_id, type, title, message, \`read\`, \`date\`, channel, created_at)
         VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)`,
        [
          newId('ntf'),
          recipient.id,
          data.type,
          data.title,
          data.message,
          today(),
          data.channel,
          timestamp,
        ]
      );
    }

    audit(req, 'notification.send', 'notification', null, {
      audience: data.audience,
      recipients: recipients.length,
      title: data.title,
    });

    res.status(201).json({ ok: true, sent: recipients.length });
  })
);

export default router;
