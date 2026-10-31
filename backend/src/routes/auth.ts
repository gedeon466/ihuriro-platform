import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { signToken, requireAuth } from '../auth.js';
import { LANGUAGES, SELF_ASSIGNABLE_ROLES } from '../constants.js';
import { db } from '../db.js';
import { mapSessionUser } from '../mappers.js';

export const authRouter = Router();

interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  phone: string | null;
  role: string;
  status: string;
  language: string;
  created_at: string;
}

const str = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

authRouter.post('/register', (req, res) => {
  const name = str(req.body?.name);
  const email = str(req.body?.email).toLowerCase();
  const password = str(req.body?.password);
  const phone = str(req.body?.phone) || null;
  const role = str(req.body?.role) || 'citizen';
  const language = str(req.body?.language) || 'en';

  if (!name || !email || !password) {
    res.status(400).json({ error: 'Name, email, and password are required' });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Enter a valid email address' });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' });
    return;
  }
  if (!(SELF_ASSIGNABLE_ROLES as readonly string[]).includes(role)) {
    res.status(400).json({ error: 'Invalid role' });
    return;
  }

  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) {
    res.status(409).json({ error: 'An account with this email already exists' });
    return;
  }

  const id = randomUUID();
  try {
    db.prepare(
      `INSERT INTO users (id, name, email, password_hash, phone, role, language)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      name,
      email,
      bcrypt.hashSync(password, 10),
      phone,
      role,
      (LANGUAGES as readonly string[]).includes(language) ? language : 'en'
    );
  } catch {
    res.status(409).json({ error: 'An account with this email already exists' });
    return;
  }

  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow;
  const user = mapSessionUser(row);
  res.status(201).json({ token: signToken(user), user });
});

authRouter.post('/login', (req, res) => {
  const email = str(req.body?.email).toLowerCase();
  const password = str(req.body?.password);

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }
  if (row.status !== 'active') {
    res.status(403).json({ error: 'This account is not active' });
    return;
  }

  const user = mapSessionUser(row);
  res.json({ token: signToken(user), user });
});

authRouter.get('/me', requireAuth, (_req, res) => {
  res.json({ user: res.locals.user });
});
