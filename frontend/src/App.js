import React, { useState, useEffect } from 'react';
import {
  signup,
  login,
  createPost,
  sendFriendRequest,
  getFriendRequests,
  acceptFriendRequest,
} from './api';
import { subscribeUserToPush } from './push';
import { initSocket } from './socket';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [user, setUser] = useState(null);

  const [notifications, setNotifications] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadPendingRequests = async (userId) => {
    try {
      const res = await getFriendRequests(userId);
      setPendingRequests(res.requests || []);
    } catch (e) {
      console.error('Error loading pending requests:', e);
    }
  };

  // Socket.io: listen to in-app notification when logged in
  useEffect(() => {
    if (!user) return;

    const socket = initSocket(user.id);

    socket.on('notification', async (notif) => {
      console.log('Frontend received notification:', notif);
      setNotifications((prev) => [notif, ...prev]);

      if (notif.type === 'FRIEND_REQUEST') {
        await loadPendingRequests(user.id);
      }
    });

    return () => {
      socket.off('notification');
    };
  }, [user]);

  // Auth handlers

  const handleSignup = async ({ email, name }) => {
    setLoading(true);
    try {
      const res = await signup(email, name);
      setUser(res.user);
      await subscribeUserToPush(res.user.id);
      await loadPendingRequests(res.user.id);
      showToast('Signed up successfully 🎉', 'success');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Signup failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async ({ email }) => {
    setLoading(true);
    try {
      const res = await login(email);
      setUser(res.user);
      await subscribeUserToPush(res.user.id);
      await loadPendingRequests(res.user.id);
      showToast('Welcome back 👋', 'success');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setNotifications([]);
    setPendingRequests([]);
    showToast('Logged out', 'info');
  };

  // Dashboard handlers

  const handleCreatePost = async (title) => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      await createPost(user.id, title.trim());
      showToast('Post created & followers notified 🚀', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to create post', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async (targetUserId) => {
    if (!targetUserId.trim()) return;
    setLoading(true);
    try {
      await sendFriendRequest(user.id, targetUserId.trim());
      showToast('Friend request sent ✅', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to send friend request', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await acceptFriendRequest(requestId);
      setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
      showToast('Friend request accepted 🤝', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to accept friend request', 'error');
    }
  };

  return (
    <div className="app-root">
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.msg}
        </div>
      )}

      <header className="app-header">
        <div className="app-logo">Notifyer</div>
        <div className="app-header-right">
          {user && (
            <>
              <div className="user-chip">
                <span className="user-avatar">
                  {user.name?.[0]?.toUpperCase() ||
                    user.email?.[0]?.toUpperCase() ||
                    'U'}
                </span>
                <div className="user-meta">
                  <span className="user-name">{user.name || 'Anonymous'}</span>
                  <span className="user-email">{user.email}</span>
                  <span className="user-id">id: {user.id}</span>
                </div>
              </div>
              <button className="btn btn-ghost" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
        </div>
      </header>

      <div className="app-body">
        {!user ? (
          <AuthPage
            loading={loading}
            onSignup={handleSignup}
            onLogin={handleLogin}
          />
        ) : (
          <Dashboard
            user={user}
            notifications={notifications}
            pendingRequests={pendingRequests}
            loading={loading}
            onCreatePost={handleCreatePost}
            onSendFriendRequest={handleSendFriendRequest}
            onAcceptRequest={handleAcceptRequest}
          />
        )}
      </div>
    </div>
  );
}

export default App;
