import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { requireAdmin, type SessionUser } from '../auth.js';
import { COMPLAINT_STATUSES } from '../constants.js';
import { db } from '../db.js';
import { mapAnnouncement, mapComplaint, mapNotification } from '../mappers.js';

const str = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

export const complaintsRouter = Router();

complaintsRouter.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM complaints ORDER BY created_at DESC').all() as any[];
  res.json(rows.map(mapComplaint));
});

complaintsRouter.post('/', (req, res) => {
  const user = res.locals.user as SessionUser;
  const category = str(req.body?.category);
  const title = str(req.body?.title);
  const description = str(req.body?.description);
  const location = str(req.body?.location);

  if (!category || !title || !description || !location) {
    res.status(400).json({ error: 'Category, title, description, and location are required' });
    return;
  }

  const id = randomUUID();
  db.prepare(
    `INSERT INTO complaints (id, user_id, category, title, description, location)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, user.id, category, title, description, location);

  const row = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id) as any;
  res.status(201).json(mapComplaint(row));
});

complaintsRouter.patch('/:id/status', requireAdmin, (req, res) => {
  const status = str(req.body?.status);
  if (!(COMPLAINT_STATUSES as readonly string[]).includes(status)) {
    res.status(400).json({ error: 'Invalid complaint status' });
    return;
  }

  const result = db.prepare('UPDATE complaints SET status = ? WHERE id = ?').run(status, req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Complaint not found' });
    return;
  }

  const row = db.prepare('SELECT * FROM complaints WHERE id = ?').get(req.params.id) as any;
  res.json(mapComplaint(row));
});

export const ideasRouter = Router();

ideasRouter.post('/', (req, res) => {
  const user = res.locals.user as SessionUser;
  const title = str(req.body?.title);
  const description = str(req.body?.description);

  if (!title || !description) {
    res.status(400).json({ error: 'Title and description are required' });
    return;
  }

  const id = randomUUID();
  db.prepare('INSERT INTO ideas (id, user_id, title, description) VALUES (?, ?, ?, ?)').run(
    id,
    user.id,
    title,
    description
  );

  const row = db.prepare('SELECT * FROM ideas WHERE id = ?').get(id) as any;
  res.status(201).json({
    id: row.id,
    title: row.title,
    description: row.description,
    date: String(row.created_at).slice(0, 10),
  });
});

export const announcementsRouter = Router();

announcementsRouter.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM announcements ORDER BY date DESC, rowid DESC').all() as any[];
  res.json(rows.map(mapAnnouncement));
});

export const notificationsRouter = Router();

notificationsRouter.get('/', (_req, res) => {
  const rows = db
    .prepare('SELECT * FROM notifications ORDER BY date DESC, rowid DESC')
    .all() as any[];
  res.json(rows.map(mapNotification));
});

notificationsRouter.post('/read-all', (_req, res) => {
  db.prepare('UPDATE notifications SET read = 1 WHERE read = 0').run();
  res.json({ success: true });
});

notificationsRouter.patch('/:id/read', (req, res) => {
  const result = db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Notification not found' });
    return;
  }
  res.json({ success: true });
});
