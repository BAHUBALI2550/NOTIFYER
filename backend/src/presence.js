// const { redis } = require('./config/redis');

// const IS_ONLINE = 'online_users';

// async function setUserOnline(userId, instanceId) {
//     await redis.sAdd(IS_ONLINE, userId);

//     await redis.hSet(`presence:${userId}`, 'instanceId', instanceId);
//     await redis.expire(`presence:${userId}`, 60 * 5);
// }

// async function setUserOffline(userId) {
//     await redis.sRem(IS_ONLINE, userId);
//     await redis.del(`presence:${userId}`);
// }

// async function isUserOnline(userId) {
//     return (await redis.sIsMember(IS_ONLINE, userId)) === 1;
// }

// module.exports = {
//     setUserOnline,
//     setUserOffline,
//     isUserOnline,
//     IS_ONLINE,
// };


// backend/src/presence.js
const { redis } = require('./config/redis');

// Single global set for online users (good enough for 1 instance;
// we can extend to multi-instance later if needed)
const ONLINE_USERS_SET = 'online_users';

async function setUserOnline(userId) {
  await redis.sAdd(ONLINE_USERS_SET, userId);
  console.log('[PRESENCE] setUserOnline', userId);
}

async function setUserOffline(userId) {
  await redis.sRem(ONLINE_USERS_SET, userId);
  console.log('[PRESENCE] setUserOffline', userId);
}

async function isUserOnline(userId) {
  const isMember = await redis.sIsMember(ONLINE_USERS_SET, userId);
  const online = !!isMember;
  console.log('[PRESENCE] isUserOnline?', userId, online);
  return online;
}

module.exports = {
  setUserOnline,
  setUserOffline,
  isUserOnline,
};
