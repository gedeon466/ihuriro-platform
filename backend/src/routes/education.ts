import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db } from '../db.js';
import { mapStudent, mapTeacher } from '../mappers.js';

const str = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');
const int = (value: unknown, fallback: number): number => {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const clampPercent = (value: number): number => Math.min(100, Math.max(0, value));

function splitList(value: unknown): string {
  if (Array.isArray(value)) return JSON.stringify(value.map(String).filter(Boolean));
  return JSON.stringify(
    str(value)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  );
}

export const studentsRouter = Router();

studentsRouter.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM students ORDER BY created_at DESC, name ASC').all() as any[];
  res.json(rows.map(mapStudent));
});

studentsRouter.post('/', (req, res) => {
  const name = str(req.body?.name);
  if (!name) {
    res.status(400).json({ error: 'Student name is required' });
    return;
  }

  const id = randomUUID();
  db.prepare(
    `INSERT INTO students (id, name, class_name, date_of_birth, gender, parent_name, parent_phone, academic_year, attendance, performance, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    name,
    str(req.body?.class) || null,
    str(req.body?.dateOfBirth) || null,
    str(req.body?.gender) || null,
    str(req.body?.parentName) || null,
    str(req.body?.parentPhone) || null,
    str(req.body?.academicYear) || null,
    clampPercent(int(req.body?.attendance, 100)),
    clampPercent(int(req.body?.performance, 0)),
    str(req.body?.status) || 'active'
  );

  const row = db.prepare('SELECT * FROM students WHERE id = ?').get(id) as any;
  res.status(201).json(mapStudent(row));
});

export const teachersRouter = Router();

teachersRouter.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM teachers ORDER BY created_at DESC, name ASC').all() as any[];
  res.json(rows.map(mapTeacher));
});

teachersRouter.post('/', (req, res) => {
  const name = str(req.body?.name);
  if (!name) {
    res.status(400).json({ error: 'Teacher name is required' });
    return;
  }

  const id = randomUUID();
  db.prepare(
    `INSERT INTO teachers (id, name, subjects, classes, students, phone, email)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    name,
    splitList(req.body?.subjects),
    splitList(req.body?.classes),
    Math.max(0, int(req.body?.students, 0)),
    str(req.body?.phone) || null,
    str(req.body?.email) || null
  );

  const row = db.prepare('SELECT * FROM teachers WHERE id = ?').get(id) as any;
  res.status(201).json(mapTeacher(row));
});
