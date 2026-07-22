import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import PostCard from '../components/PostCard.jsx';
import Sidebar from '../components/Sidebar.jsx';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { refreshUser } = useAuth();

  useEffect(() => {
    api.getPosts().then(({ posts }) => setPosts(posts)).finally(() => setLoading(false));
  }, []);

  const handleVote = async (postId, dir) => {
    const { post } = await api.votePost(postId, dir);
    setPosts((prev) => prev.map((p) => (p.id === postId ? post : p)));
    refreshUser();
  };

  return (
    <div className="container">
      <div className="row">
        <div className="col-md-8">
          <h2 className="heading mb-3">📜 The High Seas Feed</h2>
          {!loading && !posts.length && (
            <div className="text-secondary">No bounties posted yet. Be the first to claim the board.</div>
          )}
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
