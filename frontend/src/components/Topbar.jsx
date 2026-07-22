import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="topbar navbar navbar-expand px-4 py-3 mb-4">
      <div className="d-flex align-items-center justify-content-between w-100">
        <div
          className="d-flex align-items-center gap-2"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          <span className="brand-flag">🏴‍☠️</span>
          <span className="wordmark fs-3">PIERATS</span>
        </div>
        {user ? (
          <div className="d-flex align-items-center gap-3">
            <span className="doubloons">💰 {user.doubloons || 0} doubloons</span>
            <span>Ahoy, {user.name}</span>
            <button
              className="btn btn-outline-parchment btn-sm"
              onClick={async () => {
                await logout();
                navigate('/auth');
              }}
            >
              Abandon ship
            </button>
          </div>
        ) : (
          <span className="text-secondary">Not signed aboard</span>
        )}
      </div>
    </nav>
  );
}
