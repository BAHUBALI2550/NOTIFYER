require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Server } = require('socket.io');

const { initRedis, redis } = require('./config/redis');
const { prisma} = require('./prismaClient');
const { setUserOnline, setUserOffline } = require('./presence');
const { saveSubscription, validateSubscriptionShape } = require('./pushService');

const { INAPP_CHANNEL } = require('./workers/inAppWorker');
const { publishEvent } = require('./events/eventPublisher');
const { startEventRouter } = require('./events/eventRouter');
const { error } = require('console');
const { use } = require('react');

const { sendWelcomeEmail, sendWelcomeBackEmail } = require('./emailService');

// starting workers
require('./workers/emailWorker');
require('./workers/pushWorker');
require('./workers/inAppWorker');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {origin: '*', methods: ['GET', 'POST']},
});

app.use(cors());
app.use(bodyParser.json());

const INSTANCE_ID = `instance-${Math.random().toString(36).slice(2)}`;

const userSockets = new Map(); // mapping userId to Set<socket>

io.on('connection', (socket) => {
  console.log('Socket connected', socket.id);

  let currentUserId = null;

  socket.on('auth', async ({ userId }) => {
    if (!userId) return;

    currentUserId = userId;

    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket);

    await setUserOnline(userId);
    console.log(`User ${userId} online on socket ${socket.id}`);
  });

  socket.on('disconnect', async () => {
    console.log('Socket disconnected', socket.id);

    if (currentUserId) {
      const set = userSockets.get(currentUserId);
      if (set) {
        set.delete(socket);
        if (set.size === 0) {
          userSockets.delete(currentUserId);
          await setUserOffline(currentUserId);
        }
      }
    }
  });
});


// to in-app noti and forward via socket.io
const sub = redis.duplicate();
sub.connect().then(() => {
    sub.subscribe(INAPP_CHANNEL, (message) => {
        const { userId, notification } = JSON.parse(message);
        console.log('Server received in-app message for user:', userId, notification);

        const sockets = userSockets.get(userId);
        if(!sockets || sockets.size === 0) 
        {
          console.log('No sockets for user', userId);
          return;
        }
        for(const sock of sockets) {
          console.log('Emitting notification to socket', sock.id);
            sock.emit('notification', notification);
        }
    });
});

// API Routes

//Signup
app.post('/signup', async (req, res) => {
    try {
        const { email, name } = req.body;
        if (!email || !name) return res.status(400).json({ error: 'Missing fields'});

        const existing = await prisma.user.findUnique({ where: { email}});
        if (existing) return res.status(400).json({ error: 'User already exists'});

        const user = await prisma.user.create({ data: { email, name}});

        await publishEvent('USER_SIGNED_UP', {
            userId: user.id,
            email: user.email,
            name: user.name,
        });
        res.json({user});
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Signup failed'});
    }
});

//Login
app.post('/login', async (req, res) => {
    try {
        const { email} = req.body;
        if (!email) return res.status(400).json({ error: 'Missing email'});

        const user = await prisma.user.findUnique({ where: { email}});
        if(!user) return res.status(404).json({ error: 'User not found'});

        await publishEvent('USER_LOGGED_IN', {
            userId: user.id,
            email: user.email,
            name: user.name,
        });

        // await sendWelcomeBackEmail(user.email, user.name);

        res.json({ user});
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Login failed'});
    }
});

//Follow
app.post('/follow', async (req, res) => {
  try {
    const { followerId, followingId } = req.body;
    if (!followerId || !followingId) {
      return res.status(400).json({ error: 'Missing followerId or followingId' });
    }
    if (followerId === followingId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    await prisma.follow.upsert({
      where: {
        followerId_followingId: { followerId, followingId },
      },
      update: {},
      create: { followerId, followingId },
    });

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Follow failed' });
  }
});

// Create Post
app.post('/posts', async (req, res) => {
  try {
    const { authorId, title } = req.body;
    if (!authorId || !title) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const post = await prisma.post.create({
      data: { authorId, title },
    });

    const follows = await prisma.follow.findMany({
      where: { followingId: authorId },
      select: { followerId: true },
    });
    const followerIds = follows.map((f) => f.followerId);

    await publishEvent('POST_CREATED', {
      postId: post.id,
      authorId,
      postTitle: post.title,
      followerIds,
    });

    res.json({ post });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Post creation failed' });
  }
});

// Friend Request (push + in app)
app.post('/friend-request', async (req, res) => {
  try {
    const { fromUserId, toUserId } = req.body;
    if (!fromUserId || !toUserId) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const fr = await prisma.friendRequest.create({
      data: { fromUserId, toUserId },
    });

    await publishEvent('FRIEND_REQUEST_CREATED', {
      friendRequestId: fr.id,
      fromUserId,
      toUserId,
    });

    res.json({ friendRequest: fr });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Friend request failed' });
  }
});

// Get pending friend requests *for* a user
app.get('/friend-requests', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const requests = await prisma.friendRequest.findMany({
      where: {
        toUserId: String(userId),
        status: 'PENDING',
      },
      include: {
        fromUser: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ requests });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch friend requests' });
  }
});

// Accept Friend Request => creates mutual follows and marks request as ACCEPTED
app.post('/friend-request/:id/accept', async (req, res) => {
  try {
    const { id } = req.params;

    // Mark as accepted
    const fr = await prisma.friendRequest.update({
      where: { id },
      data: { status: 'ACCEPTED' },
    });

    // A = fromUser, B = toUser
    const fromUserId = fr.fromUserId;
    const toUserId = fr.toUserId;

    // A follows B
    await prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId: fromUserId,
          followingId: toUserId,
        },
      },
      update: {},
      create: {
        followerId: fromUserId,
        followingId: toUserId,
      },
    });

    // B follows A
    await prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId: toUserId,
          followingId: fromUserId,
        },
      },
      update: {},
      create: {
        followerId: toUserId,
        followingId: fromUserId,
      },
    });

    res.json({ friendRequest: fr });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Accept friend request failed' });
  }
});

//Save push subscription
app.post('/push/subscribe', async (req, res) => {
    try {
        const { userId, subscription} = req.body;
        if (!userId || !subscription) {
            return res.status(400).json({ error: 'Missing userId or subscription'});
        }
        if(!validateSubscriptionShape(subscription)) {
            return res.status(400).json({ error: 'Invalid subscription'});
        }

        await saveSubscription(userId, subscription);
        res.json({ success: true});
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to save subscription'});
    }
});

const PORT = process.env.PORT || 4000;

initRedis()
.then(async () => {
    await startEventRouter();
    server.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });
})
.catch((err) => {
    console.error('Failed to init redis', err);
    process.exit(1);
});