import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';

export default function NewCrew() {
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const submit = async () => {
    setError('');
    try {
      const { crew } = await api.createCrew(form);
      navigate(`/c/${crew.name}`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 520 }}>
      <div className="auth-card p-4 mt-4">
        <h3 className="heading">Found a New Crew</h3>
        <input
          className="form-control form-control-dark mb-2"
          placeholder="crew-name (letters and numbers)"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <textarea
          className="form-control form-control-dark mb-2"
          placeholder="What is this crew about?"
          rows={3}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
        {error && <div className="mb-2" style={{ color: '#e08a8a' }}>{error}</div>}
        <div className="d-flex gap-2">
          <button className="btn btn-gold" onClick={submit}>Found Crew</button>
          <button className="btn btn-outline-parchment" onClick={() => navigate('/')}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
