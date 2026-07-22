const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { sortByHot } = require('../utils/hotScore');

const router = express.Router();

const POST_SELECT = `
  SELECT
    p.id, p.title, p.body, p.votes, p.created_at,
    p.author_id, u.name AS author_name,
    c.id AS crew_id, c.name AS crew_name,
    (SELECT COUNT(*) FROM comments cm WHERE cm.post_id = p.id) AS comment_count
  FROM posts p
  LEFT JOIN users u ON u.id = p.author_id
  JOIN crews c ON c.id = p.crew_id
`;

async function attachMyVote(rows, userId) {
  if (!userId || !rows.length) return rows.map((r) => ({ ...r, myVote: 0 }));
  const ids = rows.map((r) => r.id);
  const { rows: votes } = await pool.query(
    'SELECT post_id, value FROM post_votes WHERE user_id = $1 AND post_id = ANY($2::uuid[])',
    [userId, ids]
  );
  const byId = Object.fromEntries(votes.map((v) => [v.post_id, v.value]));
  return rows.map((r) => ({ ...r, myVote: byId[r.id] || 0 }));
}

// GET /api/posts?crew=highseas  (omit crew for the sitewide "High Seas Feed")
router.get('/', async (req, res) => {
  const { crew } = req.query;
  let rows;
  if (crew) {
    ({ rows } = await pool.query(`${POST_SELECT} WHERE c.name = $1`, [crew]));
  } else {
    ({ rows } = await pool.query(POST_SELECT));
  }
  const withVotes = await attachMyVote(sortByHot(rows), req.user?.id);
  res.json({ posts: withVotes });
});

router.get('/:id', async (req, res) => {
  const { rows } = await pool.query(`${POST_SELECT} WHERE p.id = $1`, [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Bounty not found.' });
  const [withVote] = await attachMyVote(rows, req.user?.id);
  res.json({ post: withVote });
});

router.post('/', requireAuth, async (req, res) => {
  const { crewName, title, body } = req.body || {};
  if (!title?.trim()) return res.status(400).json({ error: 'Every bounty needs a title.' });

  const crewRes = await pool.query('SELECT id FROM crews WHERE name = $1', [crewName]);
  if (!crewRes.rows.length) return res.status(404).json({ error: 'That crew has sailed off the map.' });

  const { rows } = await pool.query(
    `INSERT INTO posts (crew_id, author_id, title, body)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [crewRes.rows[0].id, req.user.id, title.trim(), (body || '').trim()]
  );

  const full = await pool.query(`${POST_SELECT} WHERE p.id = $1`, [rows[0].id]);
  res.status(201).json({ post: { ...full.rows[0], myVote: 0 } });
});

// POST /api/posts/:id/vote  { dir: 1 | -1 }  -- voting again with the same dir un-votes it
router.post('/:id/vote', requireAuth, async (req, res) => {
  const dir = Number(req.body?.dir);
  if (![1, -1].includes(dir)) return res.status(400).json({ error: 'Invalid vote direction.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const postRes = await client.query('SELECT id, author_id FROM posts WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (!postRes.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Bounty not found.' });
    }
    const post = postRes.rows[0];

    const existing = await client.query(
      'SELECT value FROM post_votes WHERE post_id = $1 AND user_id = $2',
      [post.id, req.user.id]
    );
    const prev = existing.rows[0]?.value || 0;
    const next = prev === dir ? 0 : dir;
    const delta = next - prev;

    if (next === 0) {
      await client.query('DELETE FROM post_votes WHERE post_id = $1 AND user_id = $2', [post.id, req.user.id]);
    } else if (prev === 0) {
      await client.query('INSERT INTO post_votes (post_id, user_id, value) VALUES ($1, $2, $3)', [post.id, req.user.id, next]);
    } else {
      await client.query('UPDATE post_votes SET value = $3 WHERE post_id = $1 AND user_id = $2', [post.id, req.user.id, next]);
    }

    await client.query('UPDATE posts SET votes = votes + $2 WHERE id = $1', [post.id, delta]);
    if (post.author_id) {
      await client.query('UPDATE users SET doubloons = doubloons + $2 WHERE id = $1', [post.author_id, delta]);
    }

    await client.query('COMMIT');

    const full = await pool.query(`${POST_SELECT} WHERE p.id = $1`, [post.id]);
    const [withVote] = await attachMyVote(full.rows, req.user.id);
    res.json({ post: withVote });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Something went wrong at sea. Try again.' });
  } finally {
    client.release();
  }
});

module.exports = router;
