import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config, distDir } from './config.js';
import { queryOne } from './db.js';
import { prepareDatabase } from './schema.js';
import { AppError } from './lib/http.js';
import { runSeed } from './seed.js';
import authRoutes from './routes/auth.js';
import complaintsRoutes, { ideasRouter } from './routes/complaints.js';
import educationRoutes from './routes/education.js';
import businessRoutes from './routes/business.js';
import adminRoutes from './routes/admin.js';
import notificationRoutes from './routes/notifications.js';
import announcementRoutes from './routes/announcements.js';
import dashboardRoutes from './routes/dashboard.js';
import aiRoutes from './routes/ai.js';
import healthRoutes from './routes/health.js';
import quizRoutes from './routes/quizzes.js';
import governmentServiceRoutes from './routes/governmentServices.js';

try {
  await prepareDatabase();
  console.log(
    `[db] MySQL ready at ${config.mysql.host}:${config.mysql.port}/${config.mysql.database}`
  );
} catch (error) {
  console.error(`\n[db] ${error.message}\n`);
  process.exit(1);
}

async function userCount() {
  const row = await queryOne('SELECT COUNT(*) AS count FROM users');
  return Number(row?.count ?? 0);
}

const existingUsers = await userCount();
if (existingUsers === 0) {
  if (config.isProduction) {
    console.warn('[seed] Database is empty. Run "npm run seed" in backend/ before serving production traffic.');
  } else {
    const result = await runSeed();
    console.log(`[seed] Demo data created for ${result.users} accounts (password: Ihuriro@2026).`);
  }
}

const app = express();
app.disable('x-powered-by');

if (process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
}

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new AppError(403, `Origin ${origin} is not allowed.`));
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  })
);

app.use(express.json({ limit: '100kb' }));

const globalLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/api/health',
  message: { error: 'Too many requests. Please slow down and try again.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many sign-in attempts. Please wait 15 minutes and try again.' },
});

app.use(globalLimiter);

app.get('/api/health', async (_req, res) => {
  try {
    const users = await userCount();
    res.json({
      status: 'ok',
      service: 'ihuriro-api',
      version: '1.0.0',
      time: new Date().toISOString(),
      database: 'mysql',
      databaseOnline: true,
      users,
      ai: {
        provider: config.anthropicApiKey ? 'anthropic' : 'local',
        externalProviderConfigured: Boolean(config.anthropicApiKey),
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'degraded',
      service: 'ihuriro-api',
      database: 'mysql',
      databaseOnline: false,
      error: error.message,
    });
  }
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/ideas', ideasRouter);
app.use('/api/education', educationRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/health/topics', healthRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/government-services', governmentServiceRoutes);

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API route not found.' });
});

if (fs.existsSync(path.join(distDir, 'index.html'))) {
  app.use(express.static(distDir, { index: false, maxAge: '1h' }));
  app.get('*', (req, res, next) => {
    if (!req.accepts('html')) return next();
    return res.sendFile(path.join(distDir, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res.json({
      service: 'IHURIRO Rwanda API',
      status: 'running',
      docs: '/api/health',
      note: 'Build the frontend with "npm run build" and restart to serve the app from this server.',
    });
  });
}

app.use((req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'The request body is not valid JSON.' });
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'The request body is too large.' });
  }

  console.error('[server] Unhandled error:', err);
  return res.status(500).json({ error: 'Something went wrong on the server.' });
});

const server = app.listen(config.port, () => {
  console.log(`\nIHURIRO API listening on http://localhost:${config.port}`);
  console.log(`Health check: http://localhost:${config.port}/api/health`);
  console.log(`Environment: ${config.env} · CORS: ${config.corsOrigins.join(', ')}`);
  console.log(`Database: MySQL ${config.mysql.host}:${config.mysql.port}/${config.mysql.database}`);
  if (!config.anthropicApiKey) {
    console.log('AI assistant: built-in knowledge mode (set ANTHROPIC_API_KEY to enable the external provider).');
  }
});

function shutdown(signal) {
  console.log(`\n[server] ${signal} received, shutting down.`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
