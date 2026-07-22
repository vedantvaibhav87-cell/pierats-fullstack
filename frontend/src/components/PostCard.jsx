import React from 'react';
import { useNavigate } from 'react-router-dom';
import VoteColumn from './VoteColumn.jsx';
import { timeAgo } from '../utils/timeAgo.js';

export default function PostCard({ post, onVote }) {
  const navigate = useNavigate();
  const preview = post.body && post.body.length > 220 ? `${post.body.slice(0, 220)}…` : post.body;

  return (
    <div className="card-parchment p-3 mb-3 d-flex flex-row gap-3">
      <VoteColumn votes={post.votes} myVote={post.myVote} onVote={(dir) => onVote(post.id, dir)} />
      <div className="flex-fill">
        <div className="meta mb-1">
          <span className="crew-pill me-2">p/{post.crew_name}</span>
          posted by {post.author_name || 'unknown sailor'} · {timeAgo(post.created_at)}
        </div>
        <a
          href={`/post/${post.id}`}
          className="post-title fs-5"
          onClick={(e) => { e.preventDefault(); navigate(`/post/${post.id}`); }}
        >
          {post.title}
        </a>
        {post.body && <div className="mt-1 post-body-preview">{preview}</div>}
        <div className="mt-2">
          <span className="link-teal" onClick={() => navigate(`/post/${post.id}`)}>
            💬 {post.comment_count} chatter
          </span>
        </div>
      </div>
    </div>
  );
}
