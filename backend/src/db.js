import crypto from 'node:crypto';
import mysql from 'mysql2/promise';
import { config } from './config.js';

export const pool = mysql.createPool({
  ...config.mysql,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
  charset: 'utf8mb4',
  timezone: 'Z',
});

export async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] ?? null;
}

export async function execute(sql, params = []) {
  const [result] = await pool.query(sql, params);
  return result;
}

export async function withTransaction(handler) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await handler(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';

export function newId(prefix) {
  const bytes = crypto.randomBytes(10);
  let suffix = '';
  for (const byte of bytes) suffix += ALPHABET[byte % ALPHABET.length];
  return `${prefix}_${suffix}`;
}

export const nowIso = () => new Date().toISOString();
export const today = () => new Date().toISOString().slice(0, 10);
