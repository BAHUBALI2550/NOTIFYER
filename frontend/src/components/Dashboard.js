import React, { useState } from 'react';

function Dashboard({
  user,
  notifications,
  pendingRequests,
  loading,
  onCreatePost,
  onSendFriendRequest,
  onAcceptRequest,
}) {
  const [postTitle, setPostTitle] = useState('');
  const [targetUserId, setTargetUserId] = useState('');

  const handleCreatePostSubmit = (e) => {
    e.preventDefault();
    onCreatePost(postTitle);
    setPostTitle('');
  };

  const handleFriendRequestSubmit = (e) => {
    e.preventDefault();
    onSendFriendRequest(targetUserId);
    setTargetUserId('');
  };

  return (
    <div className="dashboard">
      {/* Left column: actions */}
      <div className="column column-left">
        <section className="card">
          <h2>Quick actions</h2>
          <p className="card-subtitle">
            Use these actions to trigger email, in-app & push notifications.
          </p>

          <form className="stack gap-md" onSubmit={handleCreatePostSubmit}>
            <h3>Create a post</h3>
            <label className="field">
              <span>Post title</span>
              <input
                type="text"
                placeholder="Something interesting…"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
              />
            </label>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              Publish & notify followers
            </button>
          </form>

          <div className="divider" />

          <form
            className="stack gap-md"
            onSubmit={handleFriendRequestSubmit}
          >
            <h3>Send friend request</h3>
            <label className="field">
              <span>Target user ID</span>
              <input
                type="text"
                placeholder="Paste another user's id…"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
              />
            </label>
            <button
              className="btn btn-secondary"
              type="submit"
              disabled={loading}
            >
              Send request
            </button>
          </form>
        </section>

        <section className="card">
          <h2>Pending friend requests</h2>
          {pendingRequests.length === 0 ? (
            <p className="empty">No pending requests</p>
          ) : (
            <ul className="request-list">
              {pendingRequests.map((req) => (
                <li key={req.id} className="request-item">
                  <div className="request-meta">
                    <span className="badge badge-info">Pending</span>
                    <div className="request-from">
                      From:{' '}
                      <strong>
                        {req.fromUser?.name ||
                          req.fromUser?.email ||
                          req.fromUserId}
                      </strong>
                    </div>
                    <div className="request-id">
                      id: {req.fromUserId}
                    </div>
                  </div>
                  <button
                    className="btn btn-small btn-primary"
                    onClick={() => onAcceptRequest(req.id)}
                  >
                    Accept
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Right column: notifications feed */}
      <div className="column column-right">
        <section className="card">
          <h2>In-app notifications</h2>
          {notifications.length === 0 ? (
            <p className="empty">
              No notifications yet. Trigger an action on the left.
            </p>
          ) : (
            <ul className="notif-list">
              {notifications.map((n, idx) => (
                <NotificationItem key={idx} notif={n} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function NotificationItem({ notif }) {
  let badgeClass = 'badge-neutral';
  let label = 'Notification';

  if (notif.type === 'FRIEND_REQUEST') {
    badgeClass = 'badge-info';
    label = 'Friend Request';
  } else if (notif.type === 'POST_CREATED') {
    badgeClass = 'badge-success';
    label = 'New Post';
  }

  return (
    <li className="notif-item">
      <div className="notif-header">
        <span className={`badge ${badgeClass}`}>{label}</span>
        {notif.title && (
          <span className="notif-title">{notif.title}</span>
        )}
      </div>
      <div className="notif-body">
        {notif.message || 'New notification'}
      </div>
      <div className="notif-meta">
        {notif.friendRequestId && (
          <span>Request id: {notif.friendRequestId}</span>
        )}
        {notif.postId && <span>Post id: {notif.postId}</span>}
      </div>
    </li>
  );
}

export default Dashboard;
