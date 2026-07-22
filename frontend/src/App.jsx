import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Topbar from './components/Topbar.jsx';
import Auth from './pages/Auth.jsx';
import Home from './pages/Home.jsx';
import Crew from './pages/Crew.jsx';
import NewCrew from './pages/NewCrew.jsx';
import NewPost from './pages/NewPost.jsx';
import Post from './pages/Post.jsx';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}

export default function App() {
  const { loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="container text-center mt-5">🏴‍☠️ Loading the ship...</div>;
  }

  const showTopbar = location.pathname !== '/auth';

  return (
    <>
      {showTopbar && <Topbar />}
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<Home />} />
        <Route path="/c/:name" element={<Crew />} />
        <Route path="/crews/new" element={<RequireAuth><NewCrew /></RequireAuth>} />
        <Route path="/c/:name/submit" element={<RequireAuth><NewPost /></RequireAuth>} />
        <Route path="/post/:id" element={<Post />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <div style={{ height: 60 }} />
    </>
  );
}
