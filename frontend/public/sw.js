// frontend/public/sw.js

// Listen for push events from web-push
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received');

  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.error('[SW] Failed to parse push data as JSON, using text()', e);
      data = { body: event.data.text() };
    }
  }

  // Derive title/body from payload
  const type = data.type || 'GENERIC';
  let title = data.title;
  let body = data.message || data.body || 'You have a new notification';

  if (!title) {
    if (type === 'FRIEND_REQUEST') {
      title = 'New friend request';
    } else if (type === 'POST_CREATED') {
      title = 'New post';
    } else {
      title = 'Notification';
    }
  }

  const options = {
    body,
    data, // keep full payload for click handling
    // icon and badge are optional; you can add real icons here
    // icon: '/icons/icon-192.png',
    // badge: '/icons/badge-72.png',
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
  console.log('gg');
});



// Optional: when user clicks the notification, focus or open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
