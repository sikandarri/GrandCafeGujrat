import jwt from 'jsonwebtoken';

function jwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV !== 'production') {
    return 'grand-cafe-local-dev-secret-change-before-production';
  }
  throw new Error('JWT_SECRET is required in production.');
}

function bearer(req) {
  const auth = req.headers.authorization || '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : null;
}

function adminDeploymentId() {
  return String(process.env.ADMIN_DEPLOYMENT_ID || 'untracked-deployment');
}

export function signAdmin(admin) {
  return jwt.sign(
    { id: admin.id, email: admin.email, role: 'admin', deployment: adminDeploymentId() },
    jwtSecret(),
    { expiresIn: '12h' }
  );
}

export function signCustomer(customer) {
  return jwt.sign({ id: customer.id, email: customer.email, role: 'customer' }, jwtSecret(), { expiresIn: '14d' });
}

export function requireAdmin(req, res, next) {
  const token = bearer(req);
  if (!token) return res.status(401).json({ message: 'Admin authentication required.' });
  try {
    const payload = jwt.verify(token, jwtSecret());
    if (payload.role !== 'admin') throw new Error('Wrong role');
    if (payload.deployment !== adminDeploymentId()) throw new Error('Previous deployment session');
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ message: 'Session expired. Please sign in again.' });
  }
}

export function requireCustomer(req, res, next) {
  const token = bearer(req);
  if (!token) return res.status(401).json({ message: 'Please sign in to continue.' });
  try {
    const payload = jwt.verify(token, jwtSecret());
    if (payload.role !== 'customer') throw new Error('Wrong role');
    req.customer = payload;
    next();
  } catch {
    return res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
  }
}

export function optionalCustomer(req, _res, next) {
  const token = bearer(req);
  if (!token) return next();
  try {
    const payload = jwt.verify(token, jwtSecret());
    if (payload.role === 'customer') req.customer = payload;
  } catch {
    // Guest checkout still works when a stale customer token is present.
  }
  next();
}
