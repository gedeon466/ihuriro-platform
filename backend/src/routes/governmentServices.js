import express from 'express';
import { z } from 'zod';
import { execute, newId, nowIso, query, queryOne } from '../db.js';
import { audit } from '../lib/audit.js';
import { AppError, asyncHandler, parseBody } from '../lib/http.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

function parseList(value) {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function serialize(row) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    summary: row.summary,
    description: row.description,
    requirements: parseList(row.requirements),
    steps: parseList(row.steps),
    fee: row.fee,
    processingTime: row.processing_time,
    office: row.office,
    contact: row.contact || '',
  };
}

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const rows = await query('SELECT * FROM government_services ORDER BY title ASC');
    res.json({ services: rows.map(serialize) });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const row = await queryOne('SELECT * FROM government_services WHERE id = ?', [req.params.id]);
    if (!row) throw new AppError(404, 'Government service not found.');
    res.json({ service: serialize(row) });
  })
);

const createSchema = z.object({
  title: z.string().trim().min(3).max(160),
  category: z.string().trim().min(2).max(60),
  summary: z.string().trim().min(10).max(255),
  description: z.string().trim().min(20).max(4000),
  requirements: z.array(z.string().trim().min(3).max(300)).min(1),
  steps: z.array(z.string().trim().min(3).max(300)).min(1),
  fee: z.string().trim().min(2).max(120),
  processingTime: z.string().trim().min(2).max(120),
  office: z.string().trim().min(2).max(160),
  contact: z.string().trim().max(160).optional().or(z.literal('')),
});

router.post(
  '/',
  requireAuth,
  requireRole('admin', 'government'),
  asyncHandler(async (req, res) => {
    const data = parseBody(createSchema, req.body);
    const id = newId('gov');

    await execute(
      `INSERT INTO government_services
         (id, title, category, summary, description, requirements, steps, fee, processing_time, office, contact, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.title,
        data.category,
        data.summary,
        data.description,
        JSON.stringify(data.requirements),
        JSON.stringify(data.steps),
        data.fee,
        data.processingTime,
        data.office,
        data.contact || null,
        nowIso(),
      ]
    );

    const row = await queryOne('SELECT * FROM government_services WHERE id = ?', [id]);
    audit(req, 'government_service.create', 'government_service', id, { title: data.title });
    res.status(201).json({ service: serialize(row) });
  })
);

export default router;
