import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { getProfileById } from '../auth-service.js';
import { AppError, serializeUser } from '../lib/http.js';

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

export function requireAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return next(new AppError(401, 'Authentication is required.'));
  }

  const token = header.slice('Bearer '.length).trim();
  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    return next(new AppError(401, 'Your session has expired. Please sign in again.'));
  }

  getProfileById(payload.sub)
    .then((row) => {
      if (!row) return next(new AppError(401, 'This account no longer exists.'));
      if (row.status !== 'active') {
        return next(new AppError(403, 'This account is not active. Contact an administrator.'));
      }
      req.user = serializeUser(row);
      return next();
    })
    .catch(next);
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new AppError(401, 'Authentication is required.'));
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'You do not have permission to perform this action.'));
    }
    return next();
  };
}

export const canManageComplaints = (user) =>
  user && (user.role === 'government' || user.role === 'admin');

export const canManageEducation = (user) =>
  user && (user.role === 'teacher' || user.role === 'admin');

export const canManageBusiness = (user) =>
  user && (user.role === 'business' || user.role === 'admin');
