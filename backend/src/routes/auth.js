import { randomUUID } from 'node:crypto';
import express from 'express';
import { z } from 'zod';
import { config, PUBLIC_ROLES, ROLES } from '../config.js';
import { audit } from '../lib/audit.js';
import { AppError, asyncHandler, parseBody, serializeUser } from '../lib/http.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import {
  createAuthAccount,
  createNotification,
  ensureProfileForAuthUser,
  findAuthUserByEmail,
  getProfileByEmail,
  getProfileById,
  setPassword,
  updateProfile,
  verifyPassword,
} from '../auth-service.js';

const router = express.Router();

const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email address.').max(254);
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(128, 'Password is too long.');

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name.').max(80),
  email: emailSchema,
  password: passwordSchema,
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  role: z.enum(PUBLIC_ROLES).optional().default('citizen'),
  language: z.enum(['en', 'rw', 'fr']).optional().default('en'),
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password.').max(128),
});

const googleSchema = z.object({
  credential: z.string().trim().min(20, 'Google sign-in token is missing.'),
});

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name.').max(80).optional(),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  language: z.enum(['en', 'rw', 'fr']).optional(),
});

const passwordSchemaBody = z.object({
  currentPassword: z.string().min(1, 'Enter your current password.'),
  newPassword: passwordSchema,
});

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const data = parseBody(registerSchema, req.body);

    if (await getProfileByEmail(data.email)) {
      throw new AppError(409, 'An account with this email already exists.');
    }
    if (await findAuthUserByEmail(data.email)) {
      throw new AppError(409, 'An account with this email already exists.');
    }

    const { profile } = await createAuthAccount({
      name: data.name,
      email: data.email,
      password: data.password,
      phone: data.phone || null,
      role: data.role,
      language: data.language,
      status: 'active',
    });

    await createNotification(profile.id, {
      type: 'system',
      title: 'Welcome to IHURIRO Rwanda',
      message:
        'Your account has been created. Explore government, education, health and business services from one place.',
    });

    req.user = serializeUser(profile);
    audit(req, 'auth.register', 'user', profile.id, { role: profile.role });

    res.status(201).json({
      token: signToken(profile),
      user: req.user,
    });
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const data = parseBody(loginSchema, req.body);

    const authUser = await verifyPassword(data.email, data.password);
    if (!authUser) {
      throw new AppError(401, 'Email or password is incorrect.');
    }

    let profile = await getProfileById(authUser.id);
    if (!profile) profile = await ensureProfileForAuthUser(authUser);

    if (profile.status !== 'active') {
      throw new AppError(403, 'This account is suspended. Contact an administrator.');
    }

    req.user = serializeUser(profile);
    audit(req, 'auth.login', 'user', profile.id);

    res.json({
      token: signToken(profile),
      user: req.user,
    });
  })
);

router.get('/google/config', (_req, res) => {
  res.json({ enabled: Boolean(config.googleClientId), clientId: config.googleClientId || null });
});

router.post(
  '/google',
  asyncHandler(async (req, res) => {
    if (!config.googleClientId) {
      throw new AppError(503, 'Google sign-in is not configured on this server.');
    }

    const { credential } = parseBody(googleSchema, req.body);
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    );
    if (!response.ok) {
      throw new AppError(401, 'Google could not verify this sign-in. Please try again.');
    }

    const token = await response.json();
    if (token.aud !== config.googleClientId) {
      throw new AppError(401, 'This Google sign-in was issued for a different application.');
    }
    if (String(token.email_verified) !== 'true' || !token.email) {
      throw new AppError(401, 'Your Google account email is not verified.');
    }

    const email = String(token.email).toLowerCase();
    const name = String(token.name || token.given_name || email.split('@')[0]).slice(0, 80);

    let profile = await getProfileByEmail(email);
    let isNew = false;

    if (!profile) {
      const created = await createAuthAccount({
        name,
        email,
        password: `${randomUUID()}${randomUUID()}`,
        phone: null,
        role: 'citizen',
        language: 'en',
        status: 'active',
      });
      profile = created.profile;
      isNew = true;
      await createNotification(profile.id, {
        type: 'system',
        title: 'Welcome to IHURIRO Rwanda',
        message:
          'Your account was created with Google. Explore government, education, health and business services from one place.',
      });
    }

    if (profile.status !== 'active') {
      throw new AppError(403, 'This account is suspended. Contact an administrator.');
    }

    req.user = serializeUser(profile);
    audit(req, isNew ? 'auth.google.register' : 'auth.google.login', 'user', profile.id);

    res.status(isNew ? 201 : 200).json({
      token: signToken(profile),
      user: req.user,
      isNew,
    });
  })
);

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

router.patch(
  '/profile',
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = parseBody(profileSchema, req.body);
    const changes = {};

    if (data.name !== undefined) changes.name = data.name;
    if (data.phone !== undefined) changes.phone = data.phone || null;
    if (data.language !== undefined) changes.language = data.language;

    if (Object.keys(changes).length === 0) {
      throw new AppError(400, 'No profile changes were submitted.');
    }

    const profile = await updateProfile(req.user.id, changes);
    audit(req, 'auth.profile.update', 'user', req.user.id, Object.keys(data));

    res.json({ user: serializeUser(profile) });
  })
);

router.post(
  '/password',
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = parseBody(passwordSchemaBody, req.body);
    const authUser = await verifyPassword(req.user.email, data.currentPassword);
    if (!authUser) {
      throw new AppError(401, 'Your current password is incorrect.');
    }

    await setPassword(req.user.id, data.newPassword);
    audit(req, 'auth.password.change', 'user', req.user.id);

    res.json({ ok: true });
  })
);

router.post('/logout', requireAuth, (req, res) => {
  audit(req, 'auth.logout', 'user', req.user.id);
  res.json({ ok: true });
});

router.get('/roles', (_req, res) => {
  res.json({ roles: ROLES });
});

export default router;
