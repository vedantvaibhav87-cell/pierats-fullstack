import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Auth() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async () => {
    setError('');
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password);
      }
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 460 }}>
      <div className="auth-card p-4 mt-5">
        <div className="text-center mb-3">
          <div className="brand-flag">🏴‍☠️</div>
          <h2 className="wordmark mt-2">PIERATS</h2>
          <div className="text-secondary">Sail the threads. Claim yer bounty.</div>
        </div>

        <div className="d-flex mb-3 gap-2">
          <button
            className={`btn btn-sm flex-fill ${mode === 'login' ? 'btn-gold' : 'btn-outline-parchment'}`}
            onClick={() => { setMode('login'); setError(''); }}
          >
            Log In
          </button>
          <button
            className={`btn btn-sm flex-fill ${mode === 'register' ? 'btn-gold' : 'btn-outline-parchment'}`}
            onClick={() => { setMode('register'); setError(''); }}
          >
            Join the Crew
          </button>
        </div>

        {mode === 'register' && (
          <input
            className="form-control form-control-dark mb-2"
            placeholder="Pirate name"
            value={form.name}
            onChange={update('name')}
          />
        )}
        <input
          className="form-control form-control-dark mb-2"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={update('email')}
        />
        <input
          className="form-control form-control-dark mb-3"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={update('password')}
        />

        {error && <div className="mb-2" style={{ color: '#e08a8a' }}>{error}</div>}

        <button className="btn btn-gold w-100" onClick={submit}>
          {mode === 'login' ? 'Log In' : 'Create Account'}
        </button>

        <div className="text-secondary text-center mt-3" style={{ fontSize: '0.75rem' }}>
          Passwords are hashed with bcrypt and never stored in plain text.
        </div>
      </div>
    </div>
  );
}
