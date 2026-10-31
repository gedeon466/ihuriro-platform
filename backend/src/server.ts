import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { requireAuth } from './auth.js';
import { DEMO_ACCOUNTS } from './seed.js';
import { usersRouter } from './routes/admin.js';
import { aiRouter } from './routes/ai.js';
import { authRouter } from './routes/auth.js';
import { loansRouter, productsRouter, salesRouter } from './routes/business.js';
import { studentsRouter, teachersRouter } from './routes/education.js';
import { complaintsRouter, ideasRouter, announcementsRouter, notificationsRouter } from './routes/resources.js';

const app = express();
const port = Number(process.env.PORT) || 4000;

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
  })
);
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ihuriro-api' });
});

app.use('/api/auth', authRouter);

app.use('/api', requireAuth);
app.use('/api/complaints', complaintsRouter);
app.use('/api/ideas', ideasRouter);
app.use('/api/announcements', announcementsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/students', studentsRouter);
app.use('/api/teachers', teachersRouter);
app.use('/api/products', productsRouter);
app.use('/api/sales', salesRouter);
app.use('/api/loans', loansRouter);
app.use('/api/users', usersRouter);
app.use('/api/ai', aiRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`IHURIRO API listening on http://localhost:${port}`);
  console.log('Demo accounts:');
  for (const account of DEMO_ACCOUNTS) {
    console.log(`  ${account.email} / ${account.password} (${account.role})`);
  }
});
