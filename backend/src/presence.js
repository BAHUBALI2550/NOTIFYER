const { redis } = require('./config/redis');

// Single global set for online users 
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
