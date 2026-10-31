import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db.js';
import { mapSessionUser } from './mappers.js';

const JWT_SECRET = process.env.JWT_SECRET || 'ihuriro-dev-secret-change-me';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  language: string;
}

export function signToken(user: Pick<SessionUser, 'id' | 'role'>): string {
  return jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.sub) as
      | Record<string, unknown>
      | undefined;

    if (!row) {
      res.status(401).json({ error: 'Session expired, please sign in again' });
      return;
    }
    if (row.status !== 'active') {
      res.status(403).json({ error: 'This account is not active' });
      return;
    }

    res.locals.user = mapSessionUser(row);
    next();
  } catch {
    res.status(401).json({ error: 'Session expired, please sign in again' });
  }
}

export function requireAdmin(_req: Request, res: Response, next: NextFunction): void {
  const user = res.locals.user as SessionUser | undefined;
  if (user?.role !== 'admin') {
    res.status(403).json({ error: 'Administrator access required' });
    return;
  }
  next();
}
