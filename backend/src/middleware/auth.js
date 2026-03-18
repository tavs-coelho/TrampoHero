import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * authenticate – verifies a Bearer access token.
 * Attaches the decoded payload to req.user.
 */
export const authenticate = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};

/**
 * authorize – RBAC guard.
 * Must be used after authenticate.
 * Usage: authorize('admin'), authorize('employer', 'admin')
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Access forbidden' });
    }
    next();
  };
};
