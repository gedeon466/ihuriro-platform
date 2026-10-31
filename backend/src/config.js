import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const rootDir = path.resolve(here, '..');
export const repoDir = path.resolve(rootDir, '..');
export const distDir = path.join(repoDir, 'dist');

function int(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const isProduction = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET || 'ihuriro-local-dev-secret-change-before-deploying';

if (isProduction && jwtSecret.includes('local-dev')) {
  throw new Error('JWT_SECRET must be set to a long random value in production.');
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction,
  port: int(process.env.PORT, 4000),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigins: (process.env.CORS_ORIGIN ||
    'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  mysql: {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: int(process.env.MYSQL_PORT, 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'ihuriro_app',
  },
  googleClientId: (process.env.GOOGLE_CLIENT_ID || '').trim(),
  anthropicApiKey: (process.env.ANTHROPIC_API_KEY || '').trim(),
  aiModel: process.env.AI_MODEL || 'claude-3-5-sonnet-20241022',
  aiTimeoutMs: int(process.env.AI_TIMEOUT_MS, 20000),
};

export const ROLES = [
  'citizen',
  'student',
  'parent',
  'teacher',
  'business',
  'health',
  'government',
  'admin',
];

export const PUBLIC_ROLES = ['citizen', 'student', 'parent', 'business', 'health'];

export const COMPLAINT_STATUSES = ['pending', 'in-review', 'resolved'];
