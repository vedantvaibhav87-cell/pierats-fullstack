const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM crews ORDER BY created_at ASC');
  res.json({ crews: rows });
});

router.get('/:name', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM crews WHERE name = $1', [req.params.name]);
  if (!rows.length) return res.status(404).json({ error: 'That crew has sailed off the map.' });
  res.json({ crew: rows[0] });
});

router.post('/', requireAuth, async (req, res) => {
  const { name, description } = req.body || {};
  const clean = (name || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!clean) return res.status(400).json({ error: 'Give yer crew a name.' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO crews (name, description, created_by)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [clean, (description || '').trim() || 'No description yet.', req.user.id]
    );
    res.status(201).json({ crew: rows[0] });
  } catch (err) {
    if (err.code === '23505') { // unique_violation
      return res.status(409).json({ error: 'That crew already exists.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Something went wrong at sea. Try again.' });
  }
});

module.exports = router;
