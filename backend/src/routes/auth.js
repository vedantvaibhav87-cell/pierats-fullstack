const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db/pool');
const { signToken } = require('../utils/jwt');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const SALT_ROUNDS = 12;

const isProd = process.env.NODE_ENV === 'production';
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: isProd ? 'none' : 'lax',
  secure: isProd,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function publicUser(u) {
  return { id: u.id, email: u.email, name: u.name, doubloons: u.doubloons, createdAt: u.created_at };
}

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ error: 'Fill in all fields, matey.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }
  const emailKey = email.trim().toLowerCase();

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [emailKey]);
    if (existing.rows.length) {
      return res.status(409).json({ error: 'That email already sails with us. Try logging in.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const { rows } = await pool.query(
      `INSERT INTO users (email, name, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, email, name, doubloons, created_at`,
      [emailKey, name.trim(), passwordHash]
    );
    const user = rows[0];
    const token = signToken(user);
    res.cookie('token', token, COOKIE_OPTS);
    res.status(201).json({ user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong at sea. Try again.' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  const emailKey = (email || '').trim().toLowerCase();

  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [emailKey]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Wrong email or password, ye scallywag.' });

    const ok = await bcrypt.compare(password || '', user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Wrong email or password, ye scallywag.' });

    const token = signToken(user);
    res.cookie('token', token, COOKIE_OPTS);
    res.json({ user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong at sea. Try again.' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', { ...COOKIE_OPTS, maxAge: undefined });
  res.status(204).end();
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

module.exports = router;
