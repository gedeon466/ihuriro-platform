import express from 'express';
import { z } from 'zod';
import { execute, newId, nowIso, query, queryOne } from '../db.js';
import { audit } from '../lib/audit.js';
import { AppError, asyncHandler, parseBody } from '../lib/http.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

function parseQuestions(value) {
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
    questions: parseQuestions(row.questions),
  };
}

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const rows = await query('SELECT * FROM quizzes ORDER BY title');
    res.json({ quizzes: rows.map(serialize) });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const row = await queryOne('SELECT * FROM quizzes WHERE id = ?', [req.params.id]);
    if (!row) throw new AppError(404, 'Quiz not found.');
    res.json({ quiz: serialize(row) });
  })
);

const questionSchema = z
  .object({
    question: z.string().trim().min(3).max(500),
    options: z.array(z.string().trim().min(1).max(200)).min(2).max(6),
    answer: z.coerce.number().int().min(0),
  })
  .refine((value) => value.answer < value.options.length, {
    message: 'The answer index must point at one of the options.',
    path: ['answer'],
  });

const createSchema = z.object({
  title: z.string().trim().min(3).max(160),
  category: z.string().trim().min(2).max(60).default('General'),
  questions: z.array(questionSchema).min(1).max(100),
});

router.post(
  '/',
  requireAuth,
  requireRole('admin', 'government', 'teacher'),
  asyncHandler(async (req, res) => {
    const data = parseBody(createSchema, req.body);
    const id = newId('qz');

    await execute(
      'INSERT INTO quizzes (id, title, category, questions, created_at) VALUES (?, ?, ?, ?, ?)',
      [id, data.title, data.category, JSON.stringify(data.questions), nowIso()]
    );

    const row = await queryOne('SELECT * FROM quizzes WHERE id = ?', [id]);
    audit(req, 'quiz.create', 'quiz', id, { title: data.title });
    res.status(201).json({ quiz: serialize(row) });
  })
);

export default router;
