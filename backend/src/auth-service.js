import bcrypt from 'bcryptjs';
import { execute, newId, nowIso, queryOne, today } from './db.js';
import { AppError } from './lib/http.js';

const PROFILE_COLUMNS =
  'id, name, email, phone, role, language, status, created_at, updated_at';

export async function findAuthUserByEmail(email) {
  return queryOne('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
}

export async function verifyPassword(email, password) {
  const user = await findAuthUserByEmail(email);
  if (!user) return null;
  const matches = await bcrypt.compare(password, user.password_hash);
  return matches ? user : null;
}

export async function getProfileById(id) {
  return queryOne(`SELECT ${PROFILE_COLUMNS} FROM users WHERE id = ?`, [id]);
}

export async function getProfileByEmail(email) {
  return queryOne(`SELECT ${PROFILE_COLUMNS} FROM users WHERE email = ?`, [email.toLowerCase()]);
}

export async function upsertProfile({
  id,
  name,
  email,
  phone = null,
  role = 'citizen',
  language = 'en',
  status = 'active',
}) {
  const timestamp = nowIso();
  await execute(
    `INSERT INTO users (id, name, email, phone, role, password_hash, language, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       phone = VALUES(phone),
       role = VALUES(role),
       language = VALUES(language),
       status = VALUES(status),
       updated_at = VALUES(updated_at)`,
    [id, name, email.toLowerCase(), phone, role, '', language, status, timestamp, timestamp]
  );
  return getProfileById(id);
}

export async function ensureProfileForAuthUser(authUser) {
  const existing = await getProfileById(authUser.id);
  if (existing) return existing;

  const meta = authUser.user_metadata || {};
  return upsertProfile({
    id: authUser.id,
    name: meta.name || authUser.email?.split('@')[0] || 'IHURIRO User',
    email: authUser.email,
    phone: meta.phone || null,
    role: meta.role || 'citizen',
    language: meta.language || 'en',
  });
}

export async function createAuthAccount(
  { name, email, password, role, language, phone, status },
  { allowExisting = false } = {}
) {
  const existing = await findAuthUserByEmail(email);
  if (existing) {
    if (!allowExisting) {
      throw new AppError(409, 'An account with this email already exists.');
    }
    const profile = await upsertProfile({
      id: existing.id,
      name,
      email,
      phone,
      role,
      language,
      status: status || 'active',
    });
    return { authUser: existing, profile, existed: true };
  }

  const id = newId('usr');
  const hash = await bcrypt.hash(password, 10);
  const timestamp = nowIso();

  try {
    await execute(
      `INSERT INTO users (id, name, email, phone, role, password_hash, language, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        name,
        email.toLowerCase(),
        phone || null,
        role || 'citizen',
        hash,
        language || 'en',
        status || 'active',
        timestamp,
        timestamp,
      ]
    );
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new AppError(409, 'An account with this email already exists.');
    }
    throw error;
  }

  const profile = await getProfileById(id);
  return { authUser: { id, email }, profile, existed: false };
}

export async function setPassword(userId, password) {
  const hash = await bcrypt.hash(password, 10);
  await execute('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', [
    hash,
    nowIso(),
    userId,
  ]);
}

export async function updateProfile(id, changes) {
  const allowed = ['name', 'phone', 'role', 'status', 'language'];
  const fields = [];
  const params = [];
  for (const key of allowed) {
    if (changes[key] !== undefined) {
      fields.push(`${key} = ?`);
      params.push(key === 'phone' ? changes[key] || null : changes[key]);
    }
  }
  if (fields.length === 0) throw new AppError(400, 'No profile changes were submitted.');

  fields.push('updated_at = ?');
  params.push(nowIso(), id);
  await execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);

  const profile = await getProfileById(id);
  if (!profile) throw new AppError(404, 'User not found.');
  return profile;
}

export async function createNotification(
  userId,
  { type = 'system', title, message, channel = 'system' }
) {
  await execute(
    `INSERT INTO notifications (id, user_id, type, title, message, \`read\`, \`date\`, channel, created_at)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)`,
    [newId('ntf'), userId, type, title, message, today(), channel, nowIso()]
  );
}
