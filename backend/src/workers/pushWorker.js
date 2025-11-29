const { Worker } = require('bullmq');
const webPush = require('web-push');
const { prisma } = require('../prismaClient');

const connection = {
  host: process.env.REDIS_HOST || 'redis',
  port: Number(process.env.REDIS_PORT || 6379),
};

// Configure web-push
webPush.setVapidDetails(
  'mailto:admin@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

async function sendPushToUser(userId, payload) {
  console.log('[PUSH] sendPushToUser', userId);

  const subs = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  console.log('[PUSH] found', subs.length, 'subscriptions for user', userId);

  const jsonPayload = JSON.stringify(payload);

  for (const sub of subs) {
    const pushSub = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    };

    try {
      await webPush.sendNotification(pushSub, jsonPayload);
      console.log('[PUSH] notification sent to', sub.endpoint);
    } catch (err) {
      console.error('[PUSH] error sending to', sub.endpoint, err.statusCode, err.body || err.message);

      // If subscription is gone/invalid, delete it (410 Gone)
      if (err.statusCode === 410 || err.statusCode === 404) {
        console.log('[PUSH] removing invalid subscription', sub.id);
        await prisma.pushSubscription.delete({ where: { id: sub.id } });
      }
    }
  }
}

const pushWorker = new Worker(
  'push_queue',
  async (job) => {
    console.log('[PUSH] worker received job:', job.name, job.data);

    switch (job.name) {
      case 'FRIEND_REQUEST_PUSH': {
        const { fromUserId, toUserId, friendRequestId } = job.data;
        const notification = {
          type: 'FRIEND_REQUEST',
          friendRequestId,
          fromUserId,
          message: `You have a new friend request from user ${fromUserId}`,
        };
        await sendPushToUser(toUserId, notification);
        break;
      }

      // later: POST_CREATED_PUSH, etc.
      default:
        console.log('[PUSH] unknown job name:', job.name);
    }
  },
  {
    connection,
    limiter: {
      max: 60,
      duration: 1000,
    },
  }
);

pushWorker.on('failed', (job, err) => {
  console.error('[PUSH] job failed', job?.id, job?.name, err.message);
});

module.exports = { pushWorker };
