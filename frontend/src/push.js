import { savePushSubscription } from './api';

const PUBLIC_VAPID_KEY =
  process.env.REACT_APP_VAPID_PUBLIC_KEY || 'PUBLIC_KEY_HERE';

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) { 
      console.log('Service worker not suport');
      return null;
  }
  const registration = await navigator.serviceWorker.register('/sw.js');
  console.log('Service worked registered:', registration);
  return registration;
}

export async function subscribeUserToPush(userId) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push not supported');
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.log('Notification permission denied');
    return;
  }

  await registerServiceWorker();

  const registration = await navigator.serviceWorker.ready;
  console.log('Service worker ready:', registration);

  // if (!registration) return;

  const existingSub = await registration.pushManager.getSubscription();
  if (existingSub) {
    console.log('Existing push subscription found');
    await savePushSubscription(userId, existingSub.toJSON());
    return;
  }

  const convertedKey = urlBase64ToUint8Array(PUBLIC_VAPID_KEY);
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: convertedKey,
  });
  console.log('New push subscription created');
  await savePushSubscription(userId, subscription.toJSON());
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
