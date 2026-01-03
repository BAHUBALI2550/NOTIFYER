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

const pushQueue = new Queue('push_queue', {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: 1000,
    removeOnFail: 1000,
  },
});

module.exports = { pushQueue };
