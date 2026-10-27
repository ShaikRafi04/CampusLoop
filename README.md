# CampusLoop 🎓
> **Peer-to-Peer Campus Skill Sharing & Time-Banking Platform**

CampusLoop is a decentralized peer-to-peer campus learning web application built on the principle of a **virtual time-banking credit economy**. Rather than trading fiat currency, students exchange knowledge: teaching peers earns virtual credits, while booking mentors consumes them. The system guarantees financial and scheduling integrity through multi-document ACID transactions, rigorous state machines, and real-time ledger accounting.

---

## 🌟 Key Highlights & Core Architecture

- **ACID-Compliant Credit Ledger**: Every credit grant, reservation, settlement, and refund is recorded in an immutable double-entry style audit ledger (`CreditTransaction`) within MongoDB multi-document transactions.
- **Concurrency & Idempotency Safeguards**: Built-in exponential backoff retry loop for transactional `WriteConflict` (Mongo error 112) and unique idempotency constraints to eliminate double-booking and credit duplication bugs.
- **Dynamic Slot Generation**: Availability is evaluated against a 30-minute boundary grid, mentor blackout overrides, a strict 2-hour minimum notice requirement, and overlapping booking reservations.
- **Role-Based Access Control & Admin Operations**: Separate Student and Administrator roles. Admins have dedicated dashboards for platform analytics, user moderation (suspensions & audited credit adjustments), and dispute resolution.
- **72-Hour Auto-Confirmation Worker**: Automatically marks sessions as complete and settles mentor credits if the learner is inactive for 72 hours post-session without filing a dispute.
- **Modern Full-Stack Stack**: Node.js (ESM) + Express + MongoDB on the backend; React 19 + Vite 6 + Tailwind CSS v4 on the frontend.

---

## 📋 Feature Checklist

### 1. Identity & Profile Management
- [x] Secure authentication with bcrypt password hashing (12 rounds) and dual JWT tokens (short-lived access + rotated refresh cookie).
- [x] Onboarding credit grant (50 credits) automatically posted to the user wallet upon registration with an audited ledger row.
- [x] Campus profile with department, year of study, bio, interests, and profile avatars.
- [x] Client-side input validation and server-side request sanitization (stripping forbidden fields such as `role`, `wallet`, `isSuspended`).

### 2. Skill Offerings & Discovery
- [x] Create, edit, and toggle active state of teaching listings across 9 academic categories.
- [x] Full-text search on title and description, combined with filters for category, difficulty (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`), format (`ONLINE`, `IN_PERSON`), and max credit cost.
- [x] Public mentor profile previewing mentor rating distributions and student reviews.

### 3. Slot Availability & Booking Lifecycle
- [x] Recurring weekly availability schedules with custom 30-minute windows.
- [x] Date-specific blackout date overrides (e.g. exams, holidays).
- [x] Real-time slot availability generator enforcing:
  - 14-day advance booking horizon
  - 2-hour minimum notice cutoff
  - Immediate exclusion of booked slots
  - Prevention of self-booking
- [x] 6-stage booking state machine: `PENDING` ➔ `ACCEPTED` ➔ `COMPLETED` (or `REJECTED`, `CANCELLED`, `DISPUTED`).
- [x] Escrow reservation: Learner credits move from `available` to `reserved` upon mentor acceptance.
- [x] Cancellation policy: Full refund if cancelled >2h before start; 100% compensation to mentor if cancelled late by learner; penalty strike logged if mentor cancels.

### 4. Credit Wallet & Ledger
- [x] Real-time wallet overview: `available` balance, `reserved` in escrow, and lifetime earned/spent totals.
- [x] Paginated, filterable transaction ledger with direction badges, date stamps, and transaction IDs.
- [x] Strict overdraw prevention: Learners cannot request or accept bookings exceeding their available balance.

### 5. Verified Reviews & Goal Tracking
- [x] 5-star ratings and written feedback permitted only after verified session completion.
- [x] Mentor aggregate rating automatically recomputed with full star breakdown (1 to 5 stars).
- [x] Personal learning goals with progress bars tracking target completed sessions and deadlines.

### 6. Admin Control Center & Moderation
- [x] High-level metrics: total users, active offerings, completed sessions, and dispute counts.
- [x] User directory with search, filter by role/status, suspension modal with mandatory reasoning, and account reactivation.
- [x] Audited manual credit adjustments (e.g. dispute compensation).
- [x] Dispute queue with status updates (`UNDER_REVIEW`, `RESOLVED`, `DISMISSED`) and internal notes.
- [x] Tamper-evident `AuditLog` records for all administrative actions.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 6, Tailwind CSS v4, Lucide React, Axios, React Router v7 |
| **Backend** | Node.js v20+ (ES Modules), Express v4, Mongoose v8, Zod, Cookie-Parser, Helmet, Express-Rate-Limit |
| **Database** | MongoDB (Replica Set required for multi-document ACID transactions) |
| **Testing** | Jest 29, Supertest 7, Mongo-Memory-Server 10 (with Replica Set emulation) |

---

## ⚙️ Environment Variables

### Server (`server/.env`)

| Variable | Description | Example / Default |
|---|---|---|
| `NODE_ENV` | Application environment | `development` or `production` |
| `PORT` | HTTP server port | `5000` |
| `MONGODB_URI` | MongoDB connection URI with replica set | `mongodb://localhost:27017/campusloop?replicaSet=rs0` |
| `JWT_ACCESS_SECRET` | Secret key for signing access tokens (min 32 chars) | `your_access_secret_min_32_characters` |
| `JWT_REFRESH_SECRET` | Secret key for signing refresh tokens (min 32 chars) | `your_refresh_secret_min_32_characters` |
| `CLIENT_ORIGINS` | Comma-separated allowed frontend origins for CORS | `http://localhost:5173,https://campusloop.vercel.app` |
| `INITIAL_CREDIT_GRANT` | Default credits awarded on student signup | `50` |
| `DEFAULT_TIMEZONE` | Fallback campus timezone for slot scheduling | `Asia/Kolkata` |

### Client (`client/.env`)

| Variable | Description | Example / Default |
|---|---|---|
| `VITE_API_BASE_URL` | Base endpoint URL for the Express API | `/api/v1` (dev proxy) or `https://campusloop-api.onrender.com/api/v1` |

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js >= 20.x installed
- npm >= 10.x
- MongoDB with replica set enabled (or MongoDB Atlas free M0 cluster)

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/your-username/CampusLoop.git
cd CampusLoop

# Install root, server, and client dependencies
npm install
npm --prefix server install
npm --prefix client install
```

### 2. Configure Environment Files
```bash
# Setup backend environment
cp server/.env.example server/.env

# Setup frontend environment
cp client/.env.example client/.env
```

### 3. Seed Sample Data
Populates the database with an Administrator account, 2 students (Alice & Bob), sample skills, weekly availability windows, completed and pending bookings, a 5-star review, and learning goals:
```bash
npm run seed
```

**Seeded Test Credentials:**
- **Admin**: `admin@campusloop.internal` / `AdminPassword123!`
- **Student A (Mentor)**: `alice@campus.edu` / `StudentPass123!`
- **Student B (Learner)**: `bob@campus.edu` / `StudentPass123!`

### 4. Run Development Servers
In two separate terminals:
```bash
# Terminal 1: Backend API (runs on port 5000 with nodemon)
npm run dev:server

# Terminal 2: Frontend Client (runs on http://localhost:5173)
npm run dev:client
```

---

## 🧪 Automated Testing

The test suite runs against an isolated, in-memory MongoDB replica set via `mongodb-memory-server`. All transactions, rollbacks, and concurrent requests are tested without requiring a local MongoDB daemon:

```bash
# Run all automated test suites
npm test
```

### Included Test Coverage (19 Automated Tests):
1. **Milestone 1 (`milestone1.test.js`)**:
   - `I-01`: Registration awards 50 credits and logs transaction
   - `I-02`: Email uniqueness enforcement
   - `A-01`: Protected routes reject unauthenticated requests
   - `A-05`: Strict input sanitization strips prohibited client keys (`role`, `wallet`)
   - `I-03` / `A-03`: Password change requires valid current password and revokes old tokens
2. **Milestone 2 (`milestone2.test.js`)**:
   - `U-01`: Available slots generation matches weekly windows and excludes blackouts
   - `I-04`: Mentor accepting booking reserves credits and moves status to `ACCEPTED`
   - Overlap validation prevents double-booking the mentor at the same time
   - Self-booking rejection (`I-05`)
3. **Milestone 3 (`milestone3.test.js`)**:
   - `C-01`: Concurrent overdraw test: 5 simultaneous booking requests cannot overdraw a wallet
   - `C-02`: Concurrent double-booking test: simultaneous accepts for the same slot result in exactly one winner
   - `C-03`: Concurrent settlement test: multiple confirmation calls process idempotently
   - `I-09`: Review constraints (only participants, after completion, exactly once)
4. **Milestone 4 (`milestone4.test.js`)**:
   - `A-02`: Regular students cannot access `/api/v1/admin/*` (returns 403 FORBIDDEN)
   - `I-11`: Admin account suspension, reactivations, and audit logging
   - Manual audited credit adjustment
   - 72-hour auto-confirm worker settlement
5. **Seed Verification (`seed.test.js`)**:
   - Validates referential integrity, availability models, and seed correctness.

---

## ☁️ Production Deployment Guide

### A. Deploy Backend to Render

1. Create a free **Web Service** on [Render.com](https://render.com).
2. Connect your Git repository.
3. Configure the service settings:
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
4. Set Environment Variables in Render Dashboard:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `MONGODB_URI`: Your MongoDB Atlas connection URI (e.g. `mongodb+srv://<user>:<password>@cluster.mongodb.net/campusloop?retryWrites=true&w=majority`)
   - `JWT_ACCESS_SECRET`: 64-character random string
   - `JWT_REFRESH_SECRET`: 64-character random string
   - `CLIENT_ORIGINS`: Your Vercel frontend URL (e.g. `https://campusloop.vercel.app`)
   - `INITIAL_CREDIT_GRANT`: `50`
   - `DEFAULT_TIMEZONE`: `Asia/Kolkata`

### B. Deploy Frontend to Vercel

1. Import your Git repository into [Vercel](https://vercel.com).
2. Configure project settings:
   - **Root Directory**: `client`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Configure Environment Variables in Vercel:
   - `VITE_API_BASE_URL`: `https://your-render-service.onrender.com/api/v1`
4. Deploy! The included `client/vercel.json` ensures client-side routing works for all deep URLs.

---

## 🔒 Security & Policy Defaults

- **Transaction Atomicity**: All balance operations take place in MongoDB sessions. If any step fails, the entire transaction rolls back.
- **Rate Limiting**: Auth endpoints are limited to 10 requests per 15-minute window; standard API endpoints are limited to 100 requests per 15-minute window.
- **Zero Client Trust**: Balances and roles are never accepted from HTTP bodies. All credit arithmetic is calculated server-side from previous balances.
- **Sanitization**: `express-mongo-sanitize` strips `$` and `.` operators from client inputs to prevent NoSQL injection attacks.

---

## 📄 License
ISC License © 2026 CampusLoop Team.
