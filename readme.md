
---

# 🚀 Notifyer — Event-Driven Real-Time Notification System

Notifyer is a **full-stack notification system** built to demonstrate a scalable, production-ready architecture supporting:

* Login / Signup
* Transactional Emails (Welcome / Welcome Back)
* Friend Requests (In-app + Push Notifications)
* Post Creation (Notifies followers)
* Web Push Notifications (FCM/VAPID)
* In-app real-time notifications (Redis Pub/Sub + WebSockets)
* Message Queues (Email Queue, Push Queue, In-App Queue)
* Presence Tracking using Redis Sets
* Exponential Backoff & Retry
* Chunked/batched notifications for high-load events
* Dockerized microservice setup

This system is a template for modern, reliable, and scalable real-time notification architectures.

---

## 📸 Screenshots

### 🔐 Auth Page

*(Place image here)*
`/screenshots/authpage.png`

### 🏠 Dashboard

*(Place image here)*
`/screenshots/dashboard.png`

### 🏗 High Level Architecture Diagram

*(Place architecture diagram here)*
`/screenshots/architecture.png`

---

# 📑 Table of Contents

* [Features](#-features)
* [Architecture Overview](#-architecture-overview)
* [Tech Stack](#-tech-stack)
* [System Flow](#-system-flow)
* [Directory Structure](#-directory-structure)
* [Setup Instructions](#-setup-instructions)
* [Environment Variables](#-environment-variables)
* [Running the System](#-running-the-system)
* [What Makes Notifyer Unique](#-what-makes-notifyer-unique)
* [Future Improvements](#-future-improvements)

---

# ✨ Features

### Authentication Flow

* Login triggers a Welcome Back Email
* Signup triggers a Welcome Email

### Event-Driven Notification System

* Every user action emits a domain event
* Event router assigns the event to proper queues:

  * Login → Email Queue
  * Signup → Email Queue
  * Friend Request Sent → In-App Queue + Push Queue
  * Post Created → Batch notify all followers

### Real-time Notifications

* Redis Pub/Sub handles fan-out across instances
* Redis Sets track active users
* Online users receive immediate notifications
* Offline users get queued fallback delivery

### Push Notifications

* Service Worker + VAPID + FCM
* Works even in background or other tabs
* Invalid subscriptions automatically removed

### Email Notifications

* Nodemailer + Gmail SMTP
* Fully asynchronous via BullMQ workers

### UI

* Clean and modern React UI
* Separate login/signup page
* Dashboard with in-app real-time updates

---

# 🏗 Architecture Overview

## High Level Design (HLD)

```
 ┌──────────┐      ┌──────────────────┐      ┌──────────────┐
 │ Frontend │ ---> │   Backend API    │ ---> │ Domain Events │
 └──────────┘      └──────────────────┘      └──────┬───────┘
                                                     │
                                       ┌─────────────┴─────────────┐
                                       │     Event Router          │
                                       └─────────────┬─────────────┘
                    ┌──────────────────────────────┬─┴─┬──────────────────────────────┐
                    │                              │   │                              │
           ┌────────▼─────────┐       ┌────────────▼─────┐               ┌────────────▼─────────┐
           │ Email Queue      │       │ Push Queue        │               │ In-App Queue         │
           └────────┬─────────┘       └────────┬──────────┘               └──────────┬──────────┘
                    │                          │                                   │
         ┌──────────▼──────────┐    ┌──────────▼──────────┐            ┌───────────▼───────────┐
         │ Email Worker        │    │ Push Worker          │            │ In-App Worker          │
         └──────────┬──────────┘    └──────────┬──────────┘            └───────────┬───────────┘
                    │                          │                                   │
            ┌───────▼────────┐          ┌──────▼──────────┐              ┌─────────▼─────────┐
            │ SMTP Provider   │          │ Web Push (FCM)   │              │ Redis Pub/Sub     │
            └─────────────────┘          └──────────────────┘              └─────────┬─────────┘
                                                                                      │
                                                                               ┌──────▼───────────┐
                                                                               │ Frontend Socket  │
                                                                               └──────────────────┘
```

---

# 🛠 Tech Stack

### Frontend

* React
* Socket.io Client
* Service Worker (Web Push)
* Custom UI (CSS)

### Backend

* Node.js / Express
* PostgreSQL + Prisma
* Redis
* BullMQ (Queues + Workers)
* Nodemailer
* web-push
* Socket.io

### Infrastructure

* Docker / Docker Compose
* Redis sets + pub/sub
* Gmail/SMTP
* VAPID Web Push

---

# 🔄 System Flow Example (Friend Request)

1. User A sends a friend request to User B
2. Backend stores request in Postgres
3. Backend emits `FRIEND_REQUEST_CREATED` event
4. Event Router pushes:

   * In-App Notification Job
   * Push Notification Job
5. In-App Worker:

   * Sends socket event if user online
   * Else queues a pending notification
6. Push Worker:

   * Sends push to all B’s subscriptions
7. User B receives:

   * Real-time in-app alert
   * Browser push notification
   * Pending request appears in dashboard

---

# 📁 Directory Structure

```
notifyer/
│
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   ├── prismaClient.js
│   │   ├── events/
│   │   ├── queues/
│   │   ├── workers/
│   │   ├── socket.js
│   │   └── email/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── public/sw.js
│   ├── src/
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── api.js
│   │   ├── push.js
│   │   ├── socket.js
│   │   └── components/
│   │       ├── AuthPage.js
│   │       └── Dashboard.js
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

---

# ⚙️ Setup Instructions

## 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/notifyer
cd notifyer
```

---

# 🌍 Environment Variables

## Backend `.env`

```
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/notifications?schema=public
REDIS_URL=redis://redis:6379

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
```

## Frontend `.env`

```
REACT_APP_API_URL=http://localhost:4000
REACT_APP_VAPID_PUBLIC_KEY=your-public-key
```

---

# 🔐 Generate VAPID Keys

```bash
npx web-push generate-vapid-keys
```

---

# 🐳 Running the System

```bash
docker compose build
docker compose up
```

Services:

* Frontend: [http://localhost:3000](http://localhost:3000)
* Backend: [http://localhost:4000](http://localhost:4000)
* PostgreSQL: port 5432
* Redis: port 6379

---

# 🌟 What Makes Notifyer Unique?

### 1. Fully Event-Driven Architecture

Notifications aren’t triggered directly. Everything flows through domain events → router → queues → workers.

### 2. Three Dedicated Queues

Email, Push, and In-App queues are isolated for scalability.

### 3. Presence-Aware Delivery

Redis Sets track online users
→ deliver instantly if online
→ queue fallback if offline.

### 4. Multi-instance WebSockets

Redis Pub/Sub ensures sockets work across multiple backend replicas.

### 5. Auto-Cleanup of Dead Push Subscriptions

FCM 410/404 responses instantly remove invalid endpoints.

### 6. Modern UI

Separate auth page + dashboard with live feed.

### 7. Chunked Notifications

Post broadcasts to large follower lists are batched for efficiency.

---

# 🚀 Future Improvements

* Notification read/unread tracking
* Threaded/grouped notifications
* Rate limiting per-user
* Role-based notifications
* Mobile app push support
* User profiles and avatars

---

# ❤️ Contributions

PRs and feature requests are welcome!

---

# 📄 License

MIT License © Himanshu Singh

---
