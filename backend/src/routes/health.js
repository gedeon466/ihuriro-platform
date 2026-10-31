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
    category: row.category,
    excerpt: row.excerpt,
    readMinutes: Number(row.read_minutes ?? 4),
  };
}

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const rows = await query('SELECT * FROM health_topics ORDER BY category, title');
    res.json({ topics: rows.map(serialize) });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const row = await queryOne('SELECT * FROM health_topics WHERE id = ?', [req.params.id]);
    if (!row) throw new AppError(404, 'Health topic not found.');
    res.json({ topic: serialize(row) });
  })
);

const createSchema = z.object({
  title: z.string().trim().min(3).max(160),
  category: z.string().trim().min(2).max(60),
  excerpt: z.string().trim().min(10).max(2000),
  readMinutes: z.coerce.number().int().min(1).max(120).optional(),
});

router.post(
  '/',
  requireAuth,
  requireRole('admin', 'government', 'health'),
  asyncHandler(async (req, res) => {
    const data = parseBody(createSchema, req.body);
    const id = newId('htp');

    await execute(
      'INSERT INTO health_topics (id, title, category, excerpt, read_minutes, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, data.title, data.category, data.excerpt, data.readMinutes ?? 4, nowIso()]
    );

    const row = await queryOne('SELECT * FROM health_topics WHERE id = ?', [id]);
    audit(req, 'health_topic.create', 'health_topic', id, { title: data.title });
    res.status(201).json({ topic: serialize(row) });
  })
);

export default router;
