const jwt = require('jsonwebtoken');
require('dotenv').config();

function authMiddleware(req, res, next) {
  const header =req.headers.authorization;
  if (!header) return res.status(401).json({error: 'No token provided' });
  const parts = header.split(' ');
  if (parts.length !== 2) return res.status(401).json({ error: 'Bad token format' });
  const token = parts[1];
  try {
    const payload =jwt.verify(token, process.env.JWT_SECRET);
    req.user ={ id: payload.userId, role: payload.role, email: payload.email };
    next();
  } catch (e) {
    return res.status(401).json({error: 'Invalid or expired token' });
  }
}

function requireRole(...allowed) {
  return (req, res, next) =>{
    if (!req.user) return res.status(401).end();
    if (allowed.includes(req.user.role)) return next();
    return res.status(403).json({ error: 'Forbidden' });
  };
}

module.exports ={authMiddleware, requireRole };
