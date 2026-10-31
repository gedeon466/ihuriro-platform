import express from 'express';
import { z } from 'zod';
import { ROLES } from '../config.js';
import { query, queryOne } from '../db.js';
import {
  createAuthAccount,
  createNotification,
  getProfileById,
  updateProfile,
} from '../auth-service.js';
import { audit } from '../lib/audit.js';
import {
  AppError,
  asyncHandler,
  pagination,
  parseBody,
  serializeAudit,
  serializeUser,
} from '../lib/http.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth, requireRole('admin'));

const createUserSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8, 'Temporary password must be at least 8 characters.').max(128),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  role: z.enum(ROLES).optional().default('citizen'),
  language: z.enum(['en', 'rw', 'fr']).optional().default('en'),
  status: z.enum(['active', 'suspended']).optional().default('active'),
});

const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  role: z.enum(ROLES).optional(),
  status: z.enum(['active', 'suspended']).optional(),
  language: z.enum(['en', 'rw', 'fr']).optional(),
});

router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const { limit, offset } = pagination(req.query);
    const q = String(req.query.q || '').trim();
    const role = String(req.query.role || '').trim();

    const where = [];
    const params = [];
    if (q) {
      where.push('(name LIKE ? OR email LIKE ?)');
      params.push(`%${q}%`, `%${q}%`);
    }
    if (role && ROLES.includes(role)) {
      where.push('role = ?');
      params.push(role);
    }
    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const rows = await query(
      `SELECT * FROM users ${clause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const total = await queryOne(`SELECT COUNT(*) AS count FROM users ${clause}`, params);

    res.json({
      users: rows.map(serializeUser),
      total: Number(total.count),
      limit,
      offset,
    });
  })
);

router.post(
  '/users',
  asyncHandler(async (req, res) => {
    const data = parseBody(createUserSchema, req.body);

    const { profile } = await createAuthAccount({
      name: data.name,
      email: data.email,
      password: data.password,
      phone: data.phone || null,
      role: data.role,
      language: data.language,
      status: data.status,
    });

    await createNotification(profile.id, {
      type: 'system',
      title: 'Your IHURIRO account is ready',
      message:
        'An administrator created your account. Change your temporary password from your profile settings.',
    });

    audit(req, 'admin.user.create', 'user', profile.id, { role: data.role });
    res.status(201).json({ user: serializeUser(profile) });
  })
);

router.patch(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const data = parseBody(updateUserSchema, req.body);
    const row = await getProfileById(req.params.id);
    if (!row) throw new AppError(404, 'User not found.');

    if (row.id === req.user.id && data.role && data.role !== row.role) {
      throw new AppError(409, 'You cannot change your own role.');
    }
    if (row.id === req.user.id && data.status && data.status !== 'active') {
      throw new AppError(409, 'You cannot suspend your own account.');
    }

    const changes = {};
    for (const key of ['name', 'phone', 'role', 'status', 'language']) {
      if (data[key] !== undefined) {
        changes[key] = key === 'phone' ? data[key] || null : data[key];
      }
    }
    if (Object.keys(changes).length === 0) throw new AppError(400, 'No changes were submitted.');

    const updated = await updateProfile(row.id, changes);
    audit(req, 'admin.user.update', 'user', row.id, Object.keys(data));
    res.json({ user: serializeUser(updated) });
  })
);

router.get(
  '/audit-logs',
  asyncHandler(async (req, res) => {
    const { limit, offset } = pagination(req.query, 200);
    const rows = await query(
      'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    const total = await queryOne('SELECT COUNT(*) AS count FROM audit_logs');

    res.json({
      logs: rows.map(serializeAudit),
      total: Number(total.count),
      limit,
      offset,
    });
  })
);

router.get(
  '/summary',
  asyncHandler(async (_req, res) => {
    const byRole = (
      await query('SELECT role, COUNT(*) AS count FROM users GROUP BY role ORDER BY count DESC')
    ).map((row) => ({ role: row.role, count: Number(row.count) }));

    const status = (
      await query('SELECT status, COUNT(*) AS count FROM users GROUP BY status')
    ).map((row) => ({ status: row.status, count: Number(row.count) }));

    const recent = (
      await query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 8')
    ).map(serializeAudit);

    const complaints = await queryOne('SELECT COUNT(*) AS count FROM complaints');
    const auditEvents = await queryOne('SELECT COUNT(*) AS count FROM audit_logs');

    res.json({
      summary: {
        users: byRole.reduce((sum, row) => sum + row.count, 0),
        byRole,
        status,
        complaints: Number(complaints.count),
        auditEvents: Number(auditEvents.count),
        recentActivity: recent,
      },
    });
  })
);

export default router;
