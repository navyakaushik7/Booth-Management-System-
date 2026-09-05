import jwt from 'jsonwebtoken';

/** Verifies the Bearer JWT and attaches { id, phone, role, wardId } to req.user */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing authentication token' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, phone, role, wardId, name }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }
}

/** Restricts a route to admin accounts only (e.g. Staff & Access page). */
export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

/**
 * Ward data isolation: an MLA can only ever act on data in their own ward.
 * Admins may pass an explicit ?ward_id= to view any ward.
 * Returns the ward_id to scope the current request to, or null for
 * "no ward" (admin with no filter — caller decides whether that's allowed).
 */
export function resolveWardScope(req) {
  if (req.user.role === 'admin') {
    const requested = req.query.ward_id || req.body.ward_id;
    return requested ? parseInt(requested, 10) : null;
  }
  return req.user.wardId;
}
