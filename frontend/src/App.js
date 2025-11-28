// import React, { useState, useEffect } from 'react';
// import {
//   signup,
//   login,
//   createPost,
//   sendFriendRequest,
//   getFriendRequests,
//   acceptFriendRequest,
// } from './api';
// import { initSocket } from './socket';
// import { subscribeUserToPush } from './push';

// function App() {
//   const [user, setUser] = useState(null);
//   const [email, setEmail] = useState('');
//   const [name, setName] = useState('');
//   const [postTitle, setPostTitle] = useState('');
//   const [friendTargetId, setFriendTargetId] = useState('');
//   const [notifications, setNotifications] = useState([]);
//   const [pendingRequests, setPendingRequests] = useState([]);

//   useEffect(() => {
//     if (!user) return;
//     const socket = initSocket(user.id);
//     socket.on('notification', async (notif) => {
//       console.log('Frontend received notification:', notif);
//       setNotifications((prev) => [notif, ...prev]);

//       if(notif.type === 'FRIEND_REQUEST') {
//         await loadPendingRequests(user.id);
//       }
//     });
//     return () => {
//       socket.off('notification');
//     };
//   }, [user]);

//   const loadPendingRequests = async (userId) => {
//     try {
//       const res = await getFriendRequests(userId);
//       setPendingRequests(res.requests || []);
//     } catch (e) {
//       console.error(e);
//     }
//   };

//   const handleSignup = async () => {
//     try {
//       const res = await signup(email, name);
//       setUser(res.user);
//       await subscribeUserToPush(res.user.id);
//       await loadPendingRequests(res.user.id);
//     } catch (e) {
//       alert(e.message);
//     }
//   };

//   const handleLogin = async () => {
//     try {
//       const res = await login(email);
//       setUser(res.user);
//       await subscribeUserToPush(res.user.id);
//       await loadPendingRequests(res.user.id);
//     } catch (e) {
//       alert(e.message);
//     }
//   };

//   const handleAcceptRequest = async (requestId) => {
//   try {
//     await acceptFriendRequest(requestId);
//     // Remove from local list
//     setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
//     alert('Friend request accepted. You are now mutual followers.');
//   } catch (e) {
//     alert(e.message);
//   }
// };


//   const handlePost = async () => {
//     if (!user) return alert('Login first');
//     try {
//       await createPost(user.id, postTitle);
//       setPostTitle('');
//     } catch (e) {
//       alert(e.message);
//     }
//   };

//   const handleFriendRequest = async () => {
//     if (!user) return alert('Login first');
//     if (!friendTargetId) return;
//     try {
//       await sendFriendRequest(user.id, friendTargetId);
//       setFriendTargetId('');
//     } catch (e) {
//       alert(e.message);
//     }
//   };

//   return (
//     <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
//       <h1>Notification System Demo</h1>

//       <section style={{ marginBottom: 20 }}>
//         <h2>Auth</h2>
//         <input
//           placeholder="Email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           style={{ marginRight: 8 }}
//         />
//         <input
//           placeholder="Name (for signup)"
//           value={name}
//           onChange={(e) => setName(e.target.value)}
//           style={{ marginRight: 8 }}
//         />
//         <button onClick={handleSignup} style={{ marginRight: 8 }}>
//           Signup
//         </button>
//         <button onClick={handleLogin}>Login</button>
//         {user && (
//           <div>
//             Logged in as: {user.name} (id: {user.id})
//           </div>
//         )}
//       </section>

//       <section style={{ marginBottom: 20 }}>
//         <h2>Create Post (in-app notifications to followers)</h2>
//         <input
//           placeholder="Post title"
//           value={postTitle}
//           onChange={(e) => setPostTitle(e.target.value)}
//           style={{ marginRight: 8 }}
//         />
//         <button onClick={handlePost}>Post</button>
//       </section>

//       <section style={{ marginBottom: 20 }}>
//         <h2>Send Friend Request (push + in-app)</h2>
//         <input
//           placeholder="Target user ID (e.g., some UUID)"
//           value={friendTargetId}
//           onChange={(e) => setFriendTargetId(e.target.value)}
//           style={{ marginRight: 8 }}
//         />
//         <button onClick={handleFriendRequest}>Send Friend Request</button>
//       </section>

//       <section style={{ marginBottom: 20 }}>
//         <h2>Pending Friend Requests (for you)</h2>
//         {!user && <div>Login to see your friend requests</div>}
//         {user && pendingRequests.length === 0 && (
//           <div>No pending friend requests</div>
//         )}
//         {user && pendingRequests.length > 0 && (
//           <ul>
//             {pendingRequests.map((req) => (
//               <li key={req.id} style={{ marginBottom: 8 }}>
//                 From: {req.fromUser?.name || req.fromUser?.email || req.fromUserId}{' '}
//                 (id: {req.fromUserId})
//                 <button
//                   style={{ marginLeft: 8 }}
//                   onClick={() => handleAcceptRequest(req.id)}
//                 >
//                   Accept
//                 </button>
//               </li>
//             ))}
//           </ul>
//         )}
//       </section>


//       <section>
//         <h2>In-App Notifications</h2>
//         {notifications.length === 0 && <div>No notifications yet</div>}
//         <ul>
//           {notifications.map((n, idx) => (
//             <li key={idx}>
//               <strong>{n.type}</strong>: {n.message}
//             </li>
//           ))}
//         </ul>
//       </section>
//     </div>
//   );
// }

// export default App;






// frontend/src/App.js
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

  // Socket.io: listen to in-app notifications when logged in
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

  // --- Auth handlers ---

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

  // --- Dashboard handlers ---

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
