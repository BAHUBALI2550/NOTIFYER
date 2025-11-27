const { redis } = require('../config/redis');

const EVENTS_CHANNEL = 'domain_events';

async function publishEvent(type, payload) {
    const event = {
        type,
        payload,
        timestamp: Date.now(),
    };
    await redis.publish(EVENTS_CHANNEL, JSON.stringify(event));
}

module.exports = {
    publishEvent,
    EVENTS_CHANNEL,
};