import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';

export default function Sidebar() {
  const [crews, setCrews] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.getCrews().then(({ crews }) => setCrews(crews)).catch(() => setCrews([]));
  }, []);

  return (
    <div className="sidebar-card p-3">
      <h3 className="heading fs-5">Crews</h3>
      <div className="divider-rope mb-2" />
      {crews.map((crew) => (
        <div className="mb-2" key={crew.id}>
          <a
            href={`/c/${crew.name}`}
            className="crew-link"
            onClick={(e) => { e.preventDefault(); navigate(`/c/${crew.name}`); }}
          >
            ⚓ p/{crew.name}
          </a>
        </div>
      ))}
      <button className="btn btn-outline-parchment btn-sm mt-2 w-100" onClick={() => navigate('/crews/new')}>
        + Found a Crew
      </button>
    </div>
  );
}
