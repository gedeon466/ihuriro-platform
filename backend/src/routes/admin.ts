import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { requireAdmin } from '../auth.js';
import { USER_ROLES, USER_STATUSES } from '../constants.js';
import { db } from '../db.js';
import { mapUser } from '../mappers.js';

const str = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

export const usersRouter = Router();

usersRouter.use(requireAdmin);

usersRouter.get('/', (_req, res) => {
  const rows = db
    .prepare('SELECT id, name, email, phone, role, status, language, created_at FROM users ORDER BY created_at DESC')
    .all() as any[];
  res.json(rows.map(mapUser));
});

usersRouter.post('/', (req, res) => {
  const name = str(req.body?.name);
  const email = str(req.body?.email).toLowerCase();
  const phone = str(req.body?.phone);
  const role = str(req.body?.role) || 'citizen';
  const status = str(req.body?.status) || 'active';
  const password = str(req.body?.password) || 'Welcome@123';

  if (!name || !email) {
    res.status(400).json({ error: 'Name and email are required' });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Enter a valid email address' });
    return;
  }
  if (!(USER_ROLES as readonly string[]).includes(role)) {
    res.status(400).json({ error: 'Invalid role' });
    return;
  }
  if (!(USER_STATUSES as readonly string[]).includes(status)) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: 'Temporary password must be at least 8 characters' });
    return;
  }
  if (db.prepare('SELECT id FROM users WHERE email = ?').get(email)) {
    res.status(409).json({ error: 'A user with this email already exists' });
    return;
  }

  const id = randomUUID();
  db.prepare(
    `INSERT INTO users (id, name, email, password_hash, phone, role, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, name, email, bcrypt.hashSync(password, 10), phone || null, role, status);

  const row = db
    .prepare('SELECT id, name, email, phone, role, status, language, created_at FROM users WHERE id = ?')
    .get(id) as any;
  res.status(201).json(mapUser(row));
});
