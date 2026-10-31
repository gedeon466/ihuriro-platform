import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';
import { config, rootDir } from './config.js';
import { query } from './db.js';

const SCHEMA_FILE = path.join(rootDir, 'sql', 'schema.mysql.sql');

export const REQUIRED_TABLES = [
  'users',
  'complaints',
  'ideas',
  'announcements',
  'notifications',
  'students',
  'student_absences',
  'student_attendance',
  'teachers',
  'schools',
  'classes',
  'subjects',
  'lessons',
  'assignments',
  'results',
  'products',
  'sales',
  'stock_movements',
  'suppliers',
  'loan_records',
  'audit_logs',
  'health_topics',
  'quizzes',
  'government_services',
];

function databaseName() {
  const name = config.mysql.database;
  if (!/^[A-Za-z0-9_]+$/.test(name)) {
    throw new Error(`MYSQL_DATABASE must contain only letters, numbers and underscores (got "${name}").`);
  }
  return name;
}

// Columns added after the first release. CREATE TABLE IF NOT EXISTS never
// alters an existing table, so these are applied one by one when missing.
const COLUMN_PATCHES = [
  { table: 'students', column: 'parent_email', definition: 'VARCHAR(254) NULL AFTER parent_phone' },
  { table: 'student_attendance', column: 'school_id', definition: 'VARCHAR(40) NULL AFTER student_id' },
  { table: 'student_attendance', column: 'class_id', definition: 'VARCHAR(40) NULL AFTER school_id' },
  { table: 'student_attendance', column: 'remarks', definition: 'VARCHAR(255) NULL AFTER status' },
  { table: 'student_absences', column: 'kind', definition: "VARCHAR(20) NOT NULL DEFAULT 'absence' AFTER `date`" },
  { table: 'student_absences', column: 'remarks', definition: 'VARCHAR(255) NULL AFTER kind' },
  { table: 'products', column: 'supplier_id', definition: 'VARCHAR(40) NULL AFTER description' },
  { table: 'products', column: 'expiry_date', definition: 'DATE NULL AFTER supplier_id' },
  {
    table: 'stock_movements',
    column: 'reason',
    definition: "VARCHAR(40) NOT NULL DEFAULT 'other' AFTER total",
  },
  { table: 'stock_movements', column: 'supplier_id', definition: 'VARCHAR(40) NULL AFTER reason' },
  { table: 'stock_movements', column: 'supplier_name', definition: 'VARCHAR(120) NULL AFTER supplier_id' },
  { table: 'stock_movements', column: 'expiry_date', definition: 'DATE NULL AFTER supplier_name' },
  { table: 'stock_movements', column: 'user_name', definition: 'VARCHAR(120) NULL AFTER user_id' },
];

async function applyColumnPatches(connection, name) {
  for (const patch of COLUMN_PATCHES) {
    const [rows] = await connection.query(
      `SELECT COUNT(*) AS count FROM information_schema.columns
       WHERE table_schema = ? AND table_name = ? AND column_name = ?`,
      [name, patch.table, patch.column]
    );
    if (Number(rows[0].count) > 0) continue;

    await connection.query(
      `ALTER TABLE \`${patch.table}\` ADD COLUMN \`${patch.column}\` ${patch.definition}`
    );
  }
}

export async function applySchema() {
  if (!fs.existsSync(SCHEMA_FILE)) {
    throw new Error(`Schema file not found: ${SCHEMA_FILE}`);
  }

  const name = databaseName();
  const connection = await mysql.createConnection({
    host: config.mysql.host,
    port: config.mysql.port,
    user: config.mysql.user,
    password: config.mysql.password,
    multipleStatements: true,
  });

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await connection.query(`USE \`${name}\``);
    await connection.query(fs.readFileSync(SCHEMA_FILE, 'utf8'));
    await applyColumnPatches(connection, name);
  } finally {
    await connection.end();
  }
}

export async function findMissingTables() {
  const rows = await query(
    `SELECT table_name AS name FROM information_schema.tables WHERE table_schema = ?`,
    [databaseName()]
  );
  const present = new Set(rows.map((row) => String(row.name).toLowerCase()));
  return REQUIRED_TABLES.filter((table) => !present.has(table));
}

export async function assertSchema() {
  const missing = await findMissingTables();
  if (missing.length === 0) return;

  throw new Error(
    `The MySQL database is missing: ${missing.join(', ')}. ` +
      'Make sure MySQL is running in XAMPP, then restart the API (it applies backend/sql/schema.mysql.sql automatically).'
  );
}

export async function prepareDatabase() {
  await applySchema();
  await assertSchema();
}
