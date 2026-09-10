import jwt from 'jsonwebtoken';
import { logger } from './logger.js';

const secret = process.env.JWT_SECRET;
if (!secret || secret.length < 32) throw new Error('JWT_SECRET must be set and contain at least 32 characters');

export function signUser(user) {
  return jwt.sign(
    { id: user.id, role: user.role, studentId: user.student_id },
    secret,
    { expiresIn: '8h' },
  );
}

export function auth(req, res, next) {
  try {
    const token = req.cookies.ecard || req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
    req.user = jwt.verify(token, secret);
    next();
  } catch (error) {
    logger.error('Authentication failed', { code: 'AUTH_INVALID', reason: error.name });
    return res.status(401).json({ error: 'Authentication required', code: 'AUTH_INVALID' });
  }
}

export function admin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Administration access required', code: 'ADMIN_REQUIRED' });
  next();
}
