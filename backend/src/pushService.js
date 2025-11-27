const webPush = require('web-push');
const { prisma } = require('./prismaClient');

webPush.setVapidDetails(
    'mailto:dinesh967070.ds@gmail.com',
    process.env.VAPID_PUBLIC_KEY || 'PUBLIC_KEY',
    process.env.VAPID_PRIVATE_KEY || 'PRIVATE_KEY'
);

function validateSubscriptionShape(sub) {
    return (
        sub && 
        typeof sub.endpoint === 'string' &&
        sub.keys &&
        typeof sub.keys.p256dh === 'string' &&
        typeof sub.keys.auth === 'string'
    );
}

async function saveSubscription(userId, subscription) {
    if (!validateSubscriptionShape(subscription)) {
        throw new Error('Invalid push subscription shape');
    }

    const { endpoint } = subscription;
    const { p256dh, auth } = subscription.keys;

    await prisma.pushSubscription.upsert({
        where: {
            userId_endpoint: {
                userId,
                endpoint,
            },
        },
        update: {
            p256dh,
            auth,
        },
        create: {
            userId,
            endpoint,
            p256dh,
            auth,
        },
    });
}

async function deleteSubscriptionById(id) {
    try {
        await prisma.pushSubscription.delete({ where: { id }});
    } catch {

    }
}

async function sendPushToUser(userId, payload) {
    const subs = await prisma.pushSubscription.findMany({ where: { userId}});
    if(subs.length === 0) return;

    const promises = subs.map((s) => {
        const sub = {
            endpoint: s.endpoint,
            keys: {
                p256dh: s.p256dh,
                auth: s.auth,
            },
        };
        return webPush
        .sendNotification(sub, JSON.stringify(payload))
        .catch((err) => {
            if(err.statusCode === 410) {
                return deleteSubscriptionById(s.id);
            } else {
                console.error('Push Error', err.statusCode, err.body);
            }
        });
    });

    await Promise.all(promises);
}

module.exports = {
    saveSubscription,
    sendPushToUser,
    validateSubscriptionShape,
};