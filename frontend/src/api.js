const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

export async function signup(email, name) {
  const res = await fetch(`${API_URL}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name }),
  });
  if (!res.ok) throw new Error('Signup failed');
  return res.json();
}

export async function login(email) {
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error('Login failed');
  return res.json();
}

export async function createPost(authorId, title) {
  const res = await fetch(`${API_URL}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authorId, title }),
  });
  if (!res.ok) throw new Error('Post failed');
  return res.json();
}

export async function sendFriendRequest(fromUserId, toUserId) {
  const res = await fetch(`${API_URL}/friend-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fromUserId, toUserId }),
  });
  if (!res.ok) throw new Error('Friend request failed');
  return res.json();
}

export async function getFriendRequests(userId) {
  const res = await fetch(`${API_URL}/friend-requests?userId=${encodeURIComponent(userId)}`);
  if(!res.ok) throw new Error('Failed to fetch friend requests');
  return res.json();
}

export async function acceptFriendRequest(requestId) {
  const res = await fetch(`${API_URL}/friend-request/${requestId}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to acccept friend request');
  return res.json();
}

export async function savePushSubscription(userId, subscription) {
  const res = await fetch(`${API_URL}/push/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, subscription }),
  });
  if (!res.ok) throw new Error('Subscription save failed');
  return res.json();
}
