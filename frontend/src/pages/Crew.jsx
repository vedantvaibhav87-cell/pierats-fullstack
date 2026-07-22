import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import PostCard from '../components/PostCard.jsx';
import Sidebar from '../components/Sidebar.jsx';

export default function Crew() {
  const { name } = useParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [crew, setCrew] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    Promise.all([api.getCrew(name), api.getPosts(name)])
      .then(([crewRes, postsRes]) => {
        setCrew(crewRes.crew);
        setPosts(postsRes.posts);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [name]);

  const handleVote = async (postId, dir) => {
    const { post } = await api.votePost(postId, dir);
    setPosts((prev) => prev.map((p) => (p.id === postId ? post : p)));
    refreshUser();
  };

  if (loading) return null;
  if (notFound || !crew) {
    return <div className="container text-secondary mt-4">That crew has sailed off the map.</div>;
  }

  return (
    <div className="container">
      <div className="row">
        <div className="col-md-8">
          <h2 className="heading mb-1">⚓ p/{crew.name}</h2>
          <div className="text-secondary mb-3">{crew.description}</div>
          {user && (
            <button className="btn btn-gold mb-3" onClick={() => navigate(`/c/${crew.name}/submit`)}>
              + Post a Bounty
            </button>
          )}
          {!posts.length && <div className="text-secondary">No bounties in this crew yet.</div>}
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onVote={handleVote} />
          ))}
        </div>
        <div className="col-md-4">
          <Sidebar />
        </div>
      </div>
    </div>
  );
}
