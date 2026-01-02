const { Worker } = require('bullmq');
const { redis } = require('../config/redis');
const {isUserOnline } = require('../presence');
const { on } = require('nodemailer/lib/xoauth2');

// for docker
// const connection = {
//   host: process.env.REDIS_HOST || 'redis',
//   port: Number(process.env.REDIS_PORT || 6379),
// };

// for render
const connection = {
  url: process.env.REDIS_URL,
};

const INAPP_CHANNEL = 'inapp_notifications';

async function publishInApp(userId, notification) {
    console.log('Publishing in-app notification to Redis for user:', userId);
    await redis.publish(
        INAPP_CHANNEL,
        JSON.stringify({ userId, notification})
    );
}

const inAppWorker = new Worker(
    'inapp_queue',
    async (job) => {
        switch (job.name) {
            case 'FRIEND_REQUEST_INAPP': {
                console.log('Inapp worker job:', job.name, job.data);
                const { fromUserId, toUserId, friendRequestId } = job.data;
                const notification = {
                    type: 'FRIEND_REQUEST',
                    friendRequestId,
                    fromUserId,
                    message: `${fromUserId} send you a friend request`,
                };
                // const online = await isUserOnline(toUserId);
                // if(online) {
                    await publishInApp(toUserId, notification);
                // } else {
                    // console.log(`User ${toUserId} offline: skipping in-app`);
                // }
                break;
            }

            case 'BATCH_POST_CREATED_INAPP': {
                const {postId, authorId, followerIds = [], postTitle } = job.data;
                console.log('[INAPP] BATCH_POST_CREATED_INAPP for followers:',
                            followerIds.length);

                for(const followerId of followerIds) {
                    const online = await isUserOnline(followerId);
                    console.log('[INAPP] follower', followerId, 'online?', online);
                    
                    const notification = {
                        type: 'POST_CREATED',
                        postId,
                        authorId,
                        title: postTitle,
                        message: `New post from user ${authorId}: ${postTitle}`,
                    };
                    if (online) {
                        await publishInApp(followerId, notification);
                    } else {
                        console.log(`User ${followerId} offline: could queue digest later`);
                    }
                }
                break;
            }
            default:
                console.log('Unknown in-app job:', job.name);
        }
    },
    {
        connection,
        limiter :{
            max: 400,
            duration: 1000,
        },
    }
);

inAppWorker.on('failed', (job,err) => {
    console.error('In-app job failed', job?.id, job?.name, err.message);
});

module.exports = { inAppWorker, INAPP_CHANNEL };