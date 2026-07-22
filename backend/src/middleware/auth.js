const { verifyToken } = require('../utils/jwt');
const pool = require('../db/pool');

// Attaches req.user if a valid session cookie is present; does not block the request.
async function attachUser(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return next();
  try {
    const payload = verifyToken(token);
    const { rows } = await pool.query(
      'SELECT id, email, name, doubloons, created_at FROM users WHERE id = $1',
      [payload.sub]
    );
    req.user = rows[0] || null;
  } catch (err) {
    req.user = null; // expired/invalid token — treat as logged out
  }
  next();
}

// Blocks the request unless attachUser found a valid user.
function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'You must be logged in, matey.' });
  next();
}

module.exports = { attachUser, requireAuth };
