import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function VoteColumn({ votes, myVote, onVote }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const vote = (dir) => {
    if (!user) { navigate('/auth'); return; }
    onVote(dir);
  };

  return (
    <div className="d-flex flex-column align-items-center gap-1" style={{ minWidth: 56 }}>
      <button
        className={`seal-btn ${myVote === 1 ? 'active-up' : ''}`}
        title="Hoist the colors"
        onClick={() => vote(1)}
      >
        ☠
      </button>
      <div className="fw-bold" style={{ color: '#241d10' }}>{votes || 0}</div>
      <button
        className={`seal-btn ${myVote === -1 ? 'active-down' : ''}`}
        title="Send to Davy Jones"
        onClick={() => vote(-1)}
      >
        ⚓
      </button>
    </div>
  );
}
