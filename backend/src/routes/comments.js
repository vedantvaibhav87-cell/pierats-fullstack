const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const COMMENT_SELECT = `
  SELECT c.id, c.post_id, c.body, c.votes, c.created_at, c.author_id, u.name AS author_name
  FROM comments c
  LEFT JOIN users u ON u.id = c.author_id
`;

async function attachMyVote(rows, userId) {
  if (!userId || !rows.length) return rows.map((r) => ({ ...r, myVote: 0 }));
  const ids = rows.map((r) => r.id);
  const { rows: votes } = await pool.query(
    'SELECT comment_id, value FROM comment_votes WHERE user_id = $1 AND comment_id = ANY($2::uuid[])',
    [userId, ids]
  );
  const byId = Object.fromEntries(votes.map((v) => [v.comment_id, v.value]));
  return rows.map((r) => ({ ...r, myVote: byId[r.id] || 0 }));
}

// GET /api/posts/:postId/comments
router.get('/post/:postId', async (req, res) => {
  const { rows } = await pool.query(
    `${COMMENT_SELECT} WHERE c.post_id = $1 ORDER BY c.created_at DESC`,
    [req.params.postId]
  );
  const withVotes = await attachMyVote(rows, req.user?.id);
  res.json({ comments: withVotes });
});

router.post('/post/:postId', requireAuth, async (req, res) => {
  const body = (req.body?.body || '').trim();
  if (!body) return res.status(400).json({ error: 'Say something before ye speak up.' });

  const postExists = await pool.query('SELECT id FROM posts WHERE id = $1', [req.params.postId]);
  if (!postExists.rows.length) return res.status(404).json({ error: 'Bounty not found.' });

  const { rows } = await pool.query(
    `INSERT INTO comments (post_id, author_id, body) VALUES ($1, $2, $3) RETURNING id`,
    [req.params.postId, req.user.id, body]
  );
  const full = await pool.query(`${COMMENT_SELECT} WHERE c.id = $1`, [rows[0].id]);
  res.status(201).json({ comment: { ...full.rows[0], myVote: 0 } });
});

router.post('/:id/vote', requireAuth, async (req, res) => {
  const dir = Number(req.body?.dir);
  if (![1, -1].includes(dir)) return res.status(400).json({ error: 'Invalid vote direction.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const cRes = await client.query('SELECT id, author_id FROM comments WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (!cRes.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Comment not found.' });
    }
    const comment = cRes.rows[0];

    const existing = await client.query(
      'SELECT value FROM comment_votes WHERE comment_id = $1 AND user_id = $2',
      [comment.id, req.user.id]
    );
    const prev = existing.rows[0]?.value || 0;
    const next = prev === dir ? 0 : dir;
    const delta = next - prev;

    if (next === 0) {
      await client.query('DELETE FROM comment_votes WHERE comment_id = $1 AND user_id = $2', [comment.id, req.user.id]);
    } else if (prev === 0) {
      await client.query('INSERT INTO comment_votes (comment_id, user_id, value) VALUES ($1, $2, $3)', [comment.id, req.user.id, next]);
    } else {
      await client.query('UPDATE comment_votes SET value = $3 WHERE comment_id = $1 AND user_id = $2', [comment.id, req.user.id, next]);
    }

    await client.query('UPDATE comments SET votes = votes + $2 WHERE id = $1', [comment.id, delta]);
    if (comment.author_id) {
      await client.query('UPDATE users SET doubloons = doubloons + $2 WHERE id = $1', [comment.author_id, delta]);
    }

    await client.query('COMMIT');

    const full = await pool.query(`${COMMENT_SELECT} WHERE c.id = $1`, [comment.id]);
    const [withVote] = await attachMyVote(full.rows, req.user.id);
    res.json({ comment: withVote });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Something went wrong at sea. Try again.' });
  } finally {
    client.release();
  }
});

module.exports = router;
