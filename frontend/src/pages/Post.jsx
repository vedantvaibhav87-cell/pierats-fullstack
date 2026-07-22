import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import VoteColumn from '../components/VoteColumn.jsx';
import { timeAgo } from '../utils/timeAgo.js';

export default function Post() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([api.getPost(id), api.getComments(id)])
      .then(([p, c]) => { setPost(p.post); setComments(c.comments); })
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const votePost = async (dir) => {
    const { post } = await api.votePost(id, dir);
    setPost(post);
    refreshUser();
  };

  const voteComment = async (commentId, dir) => {
    const { comment } = await api.voteComment(commentId, dir);
    setComments((prev) => prev.map((c) => (c.id === commentId ? comment : c)));
    refreshUser();
  };

  const addComment = async () => {
    if (!user) { navigate('/auth'); return; }
    const body = draft.trim();
    if (!body) return;
    const { comment } = await api.addComment(id, body);
    setComments((prev) => [comment, ...prev]);
    setDraft('');
  };

  if (loading) return null;
  if (!post) return <div className="container mt-4">Bounty not found.</div>;

  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <div className="card-parchment p-3 mb-3 d-flex flex-row gap-3">
        <VoteColumn votes={post.votes} myVote={post.myVote} onVote={votePost} />
        <div className="flex-fill">
          <div className="meta mb-1">
            <span className="crew-pill me-2">p/{post.crew_name}</span>
            posted by {post.author_name || 'unknown sailor'} · {timeAgo(post.created_at)}
          </div>
          <div className="fs-4 fw-bold mb-2" style={{ color: '#241d10' }}>{post.title}</div>
          {post.body && <div style={{ color: '#2e2515', whiteSpace: 'pre-wrap' }}>{post.body}</div>}
        </div>
      </div>

      <div className="sidebar-card p-3">
        <h4 className="heading fs-5">Chatter</h4>
        {user ? (
          <>
            <textarea
              className="form-control form-control-dark mb-2"
              placeholder="Add yer voice..."
              rows={2}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button className="btn btn-gold btn-sm mb-3" onClick={addComment}>Speak Up</button>
          </>
        ) : (
          <div className="text-secondary mb-3">Log in to join the chatter.</div>
        )}

        {!comments.length && <div className="text-secondary">No chatter yet. Break the silence.</div>}
        {comments.map((c) => (
          <div className="comment-box p-2 mb-2" key={c.id}>
            <div className="text-secondary" style={{ fontSize: '0.8rem' }}>
              {c.author_name || 'unknown'} · {timeAgo(c.created_at)}
            </div>
            <div className="mb-1">{c.body}</div>
            <div className="d-flex align-items-center gap-2">
              <button
                className={`btn btn-sm ${c.myVote === 1 ? 'btn-gold' : 'btn-outline-parchment'}`}
                onClick={() => (user ? voteComment(c.id, 1) : navigate('/auth'))}
              >
                ☠
              </button>
              <span>{c.votes || 0}</span>
              <button
                className={`btn btn-sm ${c.myVote === -1 ? 'btn-gold' : 'btn-outline-parchment'}`}
                onClick={() => (user ? voteComment(c.id, -1) : navigate('/auth'))}
              >
                ⚓
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
