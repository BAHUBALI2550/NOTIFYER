const { redis } = require('../config/redis');
const { EVENTS_CHANNEL } = require('./eventPublisher');
const { emailQueue } = require('../queues/emailQueue');
const { pushQueue } = require('../queues/pushQueue');
const { inAppQueue } = require('../queues/inAppQueue');

function chunkArray(arr, size) {
    const chunks = [];
    for(let  i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i,i+size));
    }
    return chunks;
}

async function startEventRouter() {
    const sub = redis.duplicate();
    await sub.connect();

    await sub.subscribe(EVENTS_CHANNEL, async (message) => {
        let event;
        try {
            event = JSON.parse(message);
        } catch (e) {
            console.error('INVALID event message', message);
            return;
        }

        const { type, payload } = event;
        console.log('Event router received:', type, payload);

        switch (type) {
            case 'USER_SIGNED_UP':
                console.log('Queueing WELCOME_EMAIL job');
                await emailQueue.add('WELCOME_EMAIL', {
                    email: payload.email,
                    name: payload.name,
                });
                break;
            case 'USER_LOGGED_IN':
                console.log('Queueing WELCOME_BACK_EMAIL job');
                await emailQueue.add('WELCOME_BACK_EMAIL', {
                    email: payload.email,
                    name: payload.name,
                });
                break;
            case 'FRIEND_REQUEST_CREATED':
                console.log('Queueing friend request jobs');
                await pushQueue.add('FRIEND_REQUEST_PUSH', {
                    friendRequestId: payload.friendRequestId,
                    fromUserId: payload.fromUserId,
                    toUserId: payload.toUserId,
                    highPriority: true,
                });

                await inAppQueue.add('FRIEND_REQUEST_INAPP', {
                    friendRequestId: payload.friendRequestId,
                    fromUserId: payload.fromUserId,
                    toUserId: payload.toUserId,
                });
                break;
            case 'POST_CREATED': {
                const { postId, authorId, followerIds = [], postTitle } = payload;
                const CHUNK_SIZE = 100;
                const chunks = chunkArray(followerIds, CHUNK_SIZE);

                for (const chunk of chunks) {
                await inAppQueue.add('BATCH_POST_CREATED_INAPP', {
                    postId,
                    authorId,
                    postTitle,
                    followerIds: chunk,
                });
                }
                break;
            }

            default:
                console.log('Unhandled event type:', type);
        }
    });
    console.log('Event router subscribed on channel', EVENTS_CHANNEL);
}

module.exports = { startEventRouter };