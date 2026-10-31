import express from 'express';
import { z } from 'zod';
import { COMPLAINT_STATUSES } from '../config.js';
import { execute, newId, nowIso, query, queryOne } from '../db.js';
import { audit } from '../lib/audit.js';
import {
  AppError,
  asyncHandler,
  pagination,
  parseBody,
  serializeComplaint,
  serializeIdea,
} from '../lib/http.js';
import { canManageComplaints, requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

const createSchema = z.object({
  title: z.string().trim().min(5, 'Give the issue a short title.').max(120),
  category: z.string().trim().min(2).max(60),
  description: z.string().trim().min(10, 'Describe the issue in a little more detail.').max(2000),
  location: z.string().trim().min(2, 'Add the location.').max(160),
});

const updateSchema = z.object({
  title: z.string().trim().min(5).max(120).optional(),
  category: z.string().trim().min(2).max(60).optional(),
  description: z.string().trim().min(10).max(2000).optional(),
  location: z.string().trim().min(2).max(160).optional(),
  status: z.enum(COMPLAINT_STATUSES).optional(),
});

async function findComplaint(id) {
  return queryOne('SELECT * FROM complaints WHERE id = ?', [id]);
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { limit, offset } = pagination(req.query);
    const where = [];
    const params = [];

    if (!canManageComplaints(req.user)) {
      where.push('user_id = ?');
      params.push(req.user.id);
    }
    if (req.query.status && COMPLAINT_STATUSES.includes(String(req.query.status))) {
      where.push('status = ?');
      params.push(String(req.query.status));
    }
    if (req.query.category) {
      where.push('category = ?');
      params.push(String(req.query.category));
    }

    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const rows = await query(
      `SELECT * FROM complaints ${clause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({ complaints: rows.map(serializeComplaint), limit, offset });
  })
);

router.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const scope = canManageComplaints(req.user) ? '' : 'WHERE user_id = ?';
    const params = canManageComplaints(req.user) ? [] : [req.user.id];

    const rows = await query(
      `SELECT status, COUNT(*) AS count FROM complaints ${scope} GROUP BY status`,
      params
    );

    const summary = { total: 0, pending: 0, 'in-review': 0, resolved: 0 };
    for (const row of rows) {
      const value = Number(row.count);
      summary.total += value;
      if (row.status in summary) summary[row.status] = value;
    }

    res.json({ summary });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const row = await findComplaint(req.params.id);
    if (!row) throw new AppError(404, 'Complaint not found.');
    if (!canManageComplaints(req.user) && row.user_id !== req.user.id) {
      throw new AppError(403, 'You do not have access to this complaint.');
    }
    res.json({ complaint: serializeComplaint(row) });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = parseBody(createSchema, req.body);
    const id = newId('cmp');
    const timestamp = nowIso();

    await execute(
      `INSERT INTO complaints (id, user_id, title, category, description, location, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [id, req.user.id, data.title, data.category, data.description, data.location, timestamp, timestamp]
    );

    const row = await findComplaint(id);
    audit(req, 'complaint.create', 'complaint', id, { category: data.category });
    res.status(201).json({ complaint: serializeComplaint(row) });
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = parseBody(updateSchema, req.body);
    const row = await findComplaint(req.params.id);
    if (!row) throw new AppError(404, 'Complaint not found.');

    const manager = canManageComplaints(req.user);
    if (!manager && row.user_id !== req.user.id) {
      throw new AppError(403, 'You do not have access to this complaint.');
    }
    if (data.status && !manager) {
      throw new AppError(403, 'Only government officers can change complaint status.');
    }

    const fieldUpdates = ['title', 'category', 'description', 'location'].filter(
      (key) => data[key] !== undefined
    );
    if (!manager && fieldUpdates.length > 0 && row.status !== 'pending') {
      throw new AppError(409, 'This complaint is already being reviewed and can no longer be edited.');
    }

    const changes = [];
    const params = [];
    for (const key of [...fieldUpdates, ...(data.status ? ['status'] : [])]) {
      changes.push(`${key} = ?`);
      params.push(data[key]);
    }
    if (changes.length === 0) throw new AppError(400, 'No changes were submitted.');

    changes.push('updated_at = ?');
    params.push(nowIso(), row.id);
    await execute(`UPDATE complaints SET ${changes.join(', ')} WHERE id = ?`, params);

    const updated = await findComplaint(row.id);
    audit(req, 'complaint.update', 'complaint', row.id, {
      fields: Object.keys(data),
      status: updated.status,
    });
    res.json({ complaint: serializeComplaint(updated) });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const row = await findComplaint(req.params.id);
    if (!row) throw new AppError(404, 'Complaint not found.');

    const manager = canManageComplaints(req.user);
    if (!manager && row.user_id !== req.user.id) {
      throw new AppError(403, 'You do not have access to this complaint.');
    }
    if (!manager && row.status !== 'pending') {
      throw new AppError(409, 'Only pending complaints can be withdrawn.');
    }

    await execute('DELETE FROM complaints WHERE id = ?', [row.id]);
    audit(req, 'complaint.delete', 'complaint', row.id);
    res.json({ ok: true });
  })
);

export default router;

export const ideasRouter = express.Router();
ideasRouter.use(requireAuth);

const ideaSchema = z.object({
  title: z.string().trim().min(5).max(120),
  description: z.string().trim().min(10).max(2000),
  category: z.string().trim().max(60).optional().or(z.literal('')),
});

ideasRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const manager = req.user.role === 'admin' || req.user.role === 'government';
    const rows = manager
      ? await query('SELECT * FROM ideas ORDER BY created_at DESC LIMIT 100')
      : await query(
          'SELECT * FROM ideas WHERE user_id = ? ORDER BY created_at DESC LIMIT 100',
          [req.user.id]
        );

    res.json({ ideas: rows.map(serializeIdea) });
  })
);

ideasRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = parseBody(ideaSchema, req.body);
    const id = newId('idea');

    await execute(
      `INSERT INTO ideas (id, user_id, title, description, category, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'submitted', ?)`,
      [id, req.user.id, data.title, data.description, data.category || null, nowIso()]
    );

    const row = await queryOne('SELECT * FROM ideas WHERE id = ?', [id]);
    audit(req, 'idea.create', 'idea', id);
    res.status(201).json({ idea: serializeIdea(row) });
  })
);
