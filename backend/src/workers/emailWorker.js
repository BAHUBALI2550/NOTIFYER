// backend/src/workers/emailWorker.js
const { Worker } = require('bullmq');
const { sendWelcomeEmail, sendWelcomeBackEmail } = require('../emailService');

const connection = {
  host: process.env.REDIS_HOST || 'redis',
  port: Number(process.env.REDIS_PORT || 6379),
};

const emailWorker = new Worker(
  'email_queue',
  async (job) => {
    console.log('Email worker processing job:', job.name, job.data);
    const { email, name } = job.data;

    switch (job.name) {
      case 'WELCOME_EMAIL':
        await sendWelcomeEmail(email, name);
        break;
      case 'WELCOME_BACK_EMAIL':
        await sendWelcomeBackEmail(email, name);
        break;
      default:
        console.log('Unknown email job:', job.name);
    }
  },
  {
    connection,
    limiter: {
      max: 50,
      duration: 1000,
    },
  }
);

emailWorker.on('failed', (job, err) => {
  console.error('Email job failed', job.id, job.name, err.message);
});

module.exports = { emailWorker };
