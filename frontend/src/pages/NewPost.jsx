import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';

export default function NewPost() {
  const { name } = useParams();
  const [form, setForm] = useState({ title: '', body: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const submit = async () => {
    setError('');
    try {
      const { post } = await api.createPost({ crewName: name, title: form.title, body: form.body });
      navigate(`/post/${post.id}`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 600 }}>
      <div className="auth-card p-4 mt-4">
        <h3 className="heading">Post a Bounty to p/{name}</h3>
        <input
          className="form-control form-control-dark mb-2"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
        <textarea
          className="form-control form-control-dark mb-2"
          placeholder="Tell yer tale..."
          rows={5}
          value={form.body}
          onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
        />
        {error && <div className="mb-2" style={{ color: '#e08a8a' }}>{error}</div>}
        <div className="d-flex gap-2">
          <button className="btn btn-gold" onClick={submit}>Post Bounty</button>
          <button className="btn btn-outline-parchment" onClick={() => navigate(`/c/${name}`)}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
