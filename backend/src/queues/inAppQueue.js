const { Queue } = require('bullmq');

// for docker
const connection = {
  host: process.env.REDIS_HOST || 'redis',
  port: Number(process.env.REDIS_PORT || 6379),
};

// for render
// const connection = {
//   url: process.env.REDIS_URL,
// };

const inAppQueue = new Queue('inapp_queue', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 500,
    },
    removeOnComplete: 1000,
    removeOnFail: 1000,
  },
});

module.exports = { inAppQueue };
