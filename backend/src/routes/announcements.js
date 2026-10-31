import express from 'express';
import { z } from 'zod';
import { execute, newId, nowIso, query, queryOne } from '../db.js';
import { audit } from '../lib/audit.js';
import { AppError, asyncHandler, parseBody } from '../lib/http.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

function serialize(row) {
  return {
    id: row.id,
    title: row.title,
    date: String(row.date || '').slice(0, 10),
    category: row.category,
    content: row.content,
  };
}

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const rows = await query('SELECT * FROM announcements ORDER BY `date` DESC LIMIT 50');
    res.json({ announcements: rows.map(serialize) });
  })
);

const createSchema = z.object({
  title: z.string().trim().min(3).max(160),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the YYYY-MM-DD format.'),
  category: z.string().trim().min(2).max(60),
  content: z.string().trim().min(10).max(4000),
});

router.post(
  '/',
  requireAuth,
  requireRole('admin', 'government'),
  asyncHandler(async (req, res) => {
    const data = parseBody(createSchema, req.body);
    const id = newId('ann');

    await execute(
      'INSERT INTO announcements (id, title, `date`, category, content, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, data.title, data.date, data.category, data.content, nowIso()]
    );

    const row = await queryOne('SELECT * FROM announcements WHERE id = ?', [id]);
    audit(req, 'announcement.create', 'announcement', id, { title: data.title });
    res.status(201).json({ announcement: serialize(row) });
  })
);

router.delete(
  '/:id',
  requireAuth,
  requireRole('admin', 'government'),
  asyncHandler(async (req, res) => {
    const row = await queryOne('SELECT * FROM announcements WHERE id = ?', [req.params.id]);
    if (!row) throw new AppError(404, 'Announcement not found.');

    await execute('DELETE FROM announcements WHERE id = ?', [row.id]);
    audit(req, 'announcement.delete', 'announcement', row.id);
    res.json({ ok: true });
  })
);

export default router;
