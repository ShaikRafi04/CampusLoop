# CampusLoop: Agent-Ready Product Requirements Document

**Version:** 1.1 (revision of v1.0, October 27, 2026)
**Project type:** Full-stack MERN web application (end-term project)
**Primary consumer of this document:** An AI coding agent (Antigravity) and the student developer supervising it

---

## 0. How to Use This Document (Read First)

This section is the operating contract for the coding agent. Follow it before writing any code.

### 0.1 Agent operating rules

1. **Read the whole PRD before starting.** Then confirm your understanding in a short plan: milestone, tasks, files you will create, and open questions.
2. **Build in milestone order (Section 13).** Do not start a milestone until the previous one passes its acceptance tests.
3. **P0 first.** Priorities are defined in Section 1.5. Never implement P2 features while any P0 item is incomplete.
4. **Do not invent product rules.** If something is ambiguous, use the default in Section 15 (Assumed Defaults) and record the decision in `docs/DECISIONS.md` with the date and reason.
5. **Business logic lives in services.** Controllers stay thin. Route handlers never implement credit or booking rules directly.
6. **Never trust the client** for: user role, wallet balance, credit amounts, booking status, reviewer identity, or mentor identity. Derive these from the authenticated session and the database.
7. **Never commit secrets.** Use environment variables. Only variable *names* go in the README, and an `.env.example` file with placeholder values is allowed.
8. **Every task is done only when** its code compiles, its linked tests pass, and it has no lint errors. Report what you changed, which tests ran, and their results.
9. **Do not weaken tests to make them pass.** If a test conflicts with this PRD, stop and report the conflict.

### 0.2 Definition of Done (applies to every feature)

- [ ] Backend endpoint validates body, params, and query (Zod or equivalent)
- [ ] Authentication and authorization enforced on the server
- [ ] Errors return the standard envelope (Section 7.1) with a correct HTTP status
- [ ] Unit tests for business rules and integration tests for the endpoint exist and pass
- [ ] Frontend shows loading, empty, error, and success states for the feature
- [ ] Layout works at mobile (375px), tablet (768px), and desktop (1280px) widths
- [ ] No password hashes, secrets, or internal fields appear in any response

---

## 1. Product Overview

### 1.1 Name
**CampusLoop**: *Learn From Each Other. Grow Together.*

### 1.2 Summary
CampusLoop is a peer-to-peer learning platform where college students publish skills they can teach, discover peers who can teach skills they want, book sessions, and exchange **virtual learning credits**. Credits are platform points. They are not money and cannot be withdrawn, purchased, or transferred between users directly.

### 1.3 Problem
Students have useful skills but struggle to find trustworthy peers who teach complementary skills. Group chats and social networks do not manage listings, availability, bookings, completions, reputation, or reciprocal exchange.

### 1.4 Differentiator
Reciprocal learning backed by a server-enforced credit ledger, structured booking workflows, and trust signals (completed-session history, reviews, reports, and moderation).

### 1.5 Priority definitions
- **P0:** Required for a complete MVP. Must be fully working and tested.
- **P1:** High-value enhancement. Build after all P0 items pass.
- **P2:** Optional advanced feature. Build only if P0 and P1 are stable and time remains.

### 1.6 Goals and success criteria
| # | Goal | Measurable success criterion |
|---|------|------------------------------|
| G1 | Skill discovery | A learner can find an offering by title, category, or tag and filter it by level, format, cost, rating, and availability |
| G2 | Structured exchange | Request, accept, reject, cancel, and complete transitions all work and reject invalid transitions |
| G3 | Trust | Public profiles show completed-session count and average rating computed from real records |
| G4 | Credit integrity | No user can spend credits they do not have, including under concurrent requests |
| G5 | Engineering quality | Authentication, authorization, data modeling, transactions, tests, and deployment all demonstrable |

### 1.7 Out of scope (initial release)
- Real-money payments, withdrawals, or credit purchases
- Native iOS or Android apps
- Identity verification beyond what is actually implemented
- Paid AI APIs or trained recommendation models
- Built-in video calls (sessions use an external meeting link stored on the booking)
- Email delivery (in-app notifications only)

---

## 2. Locked Technology Decisions

The agent must use these choices. Do not substitute alternatives without a documented reason in `docs/DECISIONS.md`.

| Layer | Decision | Notes |
|-------|----------|-------|
| Frontend | React (Vite) + JavaScript | Vite for fast dev builds |
| Routing | React Router v6+ | Protected route wrapper for authenticated pages |
| Styling | Tailwind CSS | Use only core utility classes |
| Client state | Context API for auth and toasts; local state elsewhere | No Redux |
| HTTP client | A single `api` service wrapper (e.g., Axios or fetch) | Sends cookies (`credentials: 'include'`) |
| Backend | Node.js (LTS) + Express | ES modules |
| Database | MongoDB Atlas (replica set) + Mongoose | Transactions require a replica set; local dev uses a single-node replica set |
| Validation | Zod | Shared schema pattern per module |
| Auth | Access JWT (15 min) in an HTTP-only, Secure, SameSite cookie + rotating refresh token (7 days) in an HTTP-only cookie; refresh token stored **hashed** in the DB | Never use localStorage for tokens |
| Password hashing | bcrypt, cost factor 12 | |
| Security middleware | helmet, cors (allow-list), express-rate-limit, request body size limit (100 KB) | |
| Real-time | Socket.IO (P2 only) | REST messaging is the P1 baseline |
| Charts | Recharts (P1, optional) | |
| Testing | Jest + Supertest (backend), Vitest + React Testing Library (frontend), mongodb-memory-server with replica set for integration tests | |
| Images | Cloudinary (upload via signed request) or store URL only in MVP | Profile image is P1 if time is short |
| Hosting | Frontend on Vercel, backend on Render, database on MongoDB Atlas | Verify free-tier cold start behavior before the demo |

### 2.1 Resolved design decisions (replacing ambiguities in v1.0)

| Topic | Decision |
|-------|----------|
| Time storage | All instants stored as UTC `Date`. Availability rules store `HH:mm` local times plus an IANA `timezone` on the mentor's user record (default `Asia/Kolkata`, configurable via env). |
| Slot model | Bookings must start on a fixed grid of **30-minute** boundaries and fit entirely inside one availability window. Duration equals the offering's `durationMinutes`. |
| Credit grant | `INITIAL_GRANT` of **50 credits** on registration (configurable via `INITIAL_CREDIT_GRANT`). |
| Credit cost | Set by the mentor per offering, allowed range **5 to 50** credits, in multiples of 5. |
| Mentor reward | Mentor receives **exactly the credit cost** that the learner paid. No platform fee in MVP. |
| Credit check timing | Request creation checks the learner has at least `creditCost` **available** (soft check). **Reservation happens at acceptance** (authoritative check). |
| Completion | Mentor requests completion after `scheduledEnd`. Learner confirms or disputes. Settlement happens only on confirmation or after the 72-hour auto-confirm window (Section 4.4). |
| Disputes | Disputes are `Report` records with `type: "DISPUTE"` tied to a booking. A disputed booking moves to `DISPUTED` status. |
| Dispute window | 72 hours after completion request. |
| Socket.IO | P2. Messages are REST-first and polled at 10-second intervals in P1. |
| Analytics | Basic admin counts and aggregations are **P1**. Charts and advanced analytics are P2. |

---

## 3. Roles and Permissions

### 3.1 Roles
- **STUDENT:** Every registered user. Can act as learner and mentor.
- **ADMIN:** Created only through a seed script or a CLI command. **Never** assignable through registration, profile update, or any API.
- **MODERATOR (optional, P2):** Not required for MVP.

### 3.2 Permission matrix
| Action | Guest | Student (owner) | Student (other) | Admin |
|--------|:---:|:---:|:---:|:---:|
| View landing, login, register | ✔ | ✔ | ✔ | ✔ |
| View public profile and public offerings | ✔ | ✔ | ✔ | ✔ |
| Create/edit/deactivate own offering | ✘ | ✔ | ✘ | ✘ |
| Request session | ✘ | ✔ (as learner) | ✔ | ✔ |
| Accept/reject/complete a booking | ✘ | ✔ only if mentor on that booking | ✘ | ✘ |
| Cancel a booking | ✘ | ✔ only if participant | ✘ | ✘ |
| Confirm/dispute completion | ✘ | ✔ only if learner on that booking | ✘ | ✘ |
| Read/send messages | ✘ | ✔ only if conversation participant | ✘ | ✘ (read via audit only) |
| Review a booking | ✘ | ✔ only if participant of a COMPLETED booking | ✘ | ✘ |
| Create report/dispute | ✘ | ✔ | ✔ | ✘ |
| Admin routes (`/api/v1/admin/*`) | ✘ | ✘ | ✘ | ✔ |
| Suspend/reactivate user | ✘ | ✘ | ✘ | ✔ |
| Credit adjustment | ✘ | ✘ | ✘ | ✔ (audited) |

**Rule:** The `role` field is **never** accepted from request bodies. Any client attempt to send `role`, `wallet`, `isSuspended`, `status`, or `creditBalance` is stripped by the validator and logged as a warning.

---

## 4. Core Domain Rules (Single Source of Truth)

### 4.1 Booking state machine

```
PENDING ──accept──▶ ACCEPTED ──mentor requests completion──▶ ACCEPTED (completionRequestedAt set)
   │                   │                                          │
   │reject             │cancel                                    │learner confirm ──▶ COMPLETED (settled)
   ▼                   ▼                                          │learner dispute ──▶ DISPUTED
REJECTED           CANCELLED ◀──cancel (before completion)        │auto-confirm (72h) ─▶ COMPLETED (settled)
   ▲
PENDING ──cancel──▶ CANCELLED
```

| From | To | Actor | Allowed when |
|------|----|-------|--------------|
| — | PENDING | Learner | Offering active, learner ≠ mentor, learner not suspended, slot valid (4.2), learner has ≥ creditCost available |
| PENDING | ACCEPTED | Mentor | Reservation succeeds (4.3) and no overlapping ACCEPTED booking for mentor |
| PENDING | REJECTED | Mentor | Always |
| PENDING | CANCELLED | Learner or mentor | Before acceptance |
| ACCEPTED | CANCELLED | Learner or mentor | `scheduledStart` not yet passed (policy in 4.5) |
| ACCEPTED | ACCEPTED + `completionRequestedAt` | Mentor | `now ≥ scheduledEnd` |
| ACCEPTED (completion requested) | COMPLETED | Learner (confirm) or system (auto-confirm after 72h) | Not disputed |
| ACCEPTED (completion requested) | DISPUTED | Learner | Within 72h of `completionRequestedAt` |
| DISPUTED | COMPLETED or CANCELLED | Admin | Via resolution (FR-35) |

**Rules:**
- Any transition not listed above returns `INVALID_STATE_TRANSITION` (HTTP 409).
- Transitions are implemented as **conditional updates**: `updateOne({ _id, status: <expected> }, { $set: { status: <new> } })`. If `matchedCount === 0`, the transition failed because state changed concurrently. Return 409.
- There is **no** generic `PATCH /bookings/:id/status` endpoint.

### 4.2 Slot validity (checked on request and on accept)
A booking is valid when **all** of the following hold:
1. `scheduledStart` is in the future (at least 2 hours from now).
2. `scheduledStart` falls on a 30-minute boundary.
3. `scheduledEnd = scheduledStart + offering.durationMinutes`.
4. The interval `[start, end)` lies entirely inside one mentor availability window (WEEKLY or DATE_OVERRIDE with `isAvailable: true`), evaluated in the mentor's timezone. A DATE_OVERRIDE with `isAvailable: false` removes that date's weekly windows.
5. No booking for the **mentor** with status in `{PENDING, ACCEPTED, DISPUTED}` overlaps `[start, end)` (for PENDING, this is advisory; for ACCEPTED, it is enforced, see 4.3).
6. No booking for the **learner** with status in `{PENDING, ACCEPTED, DISPUTED}` overlaps `[start, end)`.

### 4.3 Concurrency-safe acceptance (critical)
Accepting a booking must run in a MongoDB transaction:
1. Lock the mentor: `Users.updateOne({ _id: mentorId }, { $inc: { scheduleVersion: 1 } }, { session })`. This serializes concurrent accepts for the same mentor.
2. Re-check overlap against all ACCEPTED and DISPUTED bookings for the mentor. If overlap exists, abort with `BOOKING_OVERLAP` (409).
3. Reserve learner credits (atomic conditional update, Section 5.3). If insufficient, abort with `INSUFFICIENT_CREDITS` (422). The booking stays PENDING.
4. Set booking `status: ACCEPTED`, record the RESERVATION transaction, and create a notification for the learner. All in the same session.
5. Commit. Notification delivery failure after commit must not roll back the booking (Section 11, edge cases).

### 4.4 Completion, confirmation, and auto-confirm
- Mentor calls `PATCH /bookings/:id/complete` after `scheduledEnd`. This sets `completionRequestedAt` and notifies the learner. It does **not** settle credits.
- Learner calls `PATCH /bookings/:id/confirm`, which settles credits (5.4) and sets status COMPLETED.
- Learner calls `PATCH /bookings/:id/dispute` within 72 hours, which sets status DISPUTED and creates a Report of type DISPUTE. Settlement is paused.
- A scheduled job (runs every 15 minutes; or on server start if cron is not practical) auto-confirms requests older than 72 hours that are not disputed, using the same settlement function.
- Settlement is idempotent (Section 5.5). Calling confirm twice, or the job racing a manual confirm, must settle once.

### 4.5 Cancellation policy (published to users)
| Who cancels | When | Learner reservation | Mentor reward |
|-------------|------|---------------------|---------------|
| Learner | PENDING (any time) | Nothing reserved; no change | None |
| Learner | ACCEPTED, ≥ 24h before start | Released to available | None |
| Learner | ACCEPTED, < 24h before start | Forfeited: debited to mentor as reward | Receives `creditCost` (late-cancel compensation) |
| Mentor | PENDING or ACCEPTED (any time before start) | Released to available | None; mentor's cancellation count increments (visible to admins) |
| Either | After `scheduledStart` | Not allowed; use dispute/no-show flow | — |

No-show handling (MVP): a no-show is raised as a DISPUTE by the affected party. **No automatic penalty.** An admin decides based on evidence and records the resolution (FR-35).

### 4.6 Suspension
- Suspended users cannot create bookings, accept/reject, send messages, create offerings, or create reviews. They can still log in, view their own history, and view notifications.
- Upcoming ACCEPTED bookings involving a suspended user are **flagged** (`flags: ["PARTICIPANT_SUSPENDED"]`) for admin review. They are not auto-cancelled.

### 4.7 Reviews
- Allowed only when the booking status is COMPLETED and the reviewer is learner or mentor on it.
- One review per reviewer per booking (unique index).
- Rating integer 1 to 5; comment up to 500 characters.
- Reviews are immutable after creation. Admins can hide a review (`isHidden: true`), which excludes it from averages.
- `User.ratingSummary = { average, count }` is recomputed inside the same transaction that creates or hides a review.

### 4.8 Learning goals and session history
- `completedSessions` on a goal increments when a COMPLETED booking has the matching `skillId` (or `skillName`) and the user is the learner. This runs inside the settlement transaction.
- Goal status becomes COMPLETED automatically when `completedSessions ≥ targetSessions`.

---

## 5. Virtual Credit System

### 5.1 Principles
1. Credits are integers. No decimals.
2. Balances are never negative.
3. Every balance change has a transaction record.
4. Amounts are computed on the server from the booking snapshot, never from request bodies.

### 5.2 Wallet model
Each user has a `wallet` summary: `{ available: Number, reserved: Number }`, both ≥ 0.
The `CreditTransaction` ledger is the audit source. The wallet is a read-optimized summary updated in the same transaction as each ledger entry.

### 5.3 Atomic reservation (the key anti-overdraw mechanism)
```js
// Inside a transaction session
const res = await User.updateOne(
  { _id: learnerId, 'wallet.available': { $gte: cost }, isSuspended: false },
  { $inc: { 'wallet.available': -cost, 'wallet.reserved': cost } },
  { session }
);
if (res.matchedCount === 0) throw new AppError('INSUFFICIENT_CREDITS', 422);
```
This conditional update is the core guarantee. Two concurrent 10-credit reservations against a balance of 10 cannot both succeed, because the second update's filter no longer matches.

### 5.4 Settlement (on confirm or auto-confirm)
Inside one transaction:
1. Verify booking status is ACCEPTED with `completionRequestedAt` set, and not DISPUTED.
2. Learner: `wallet.reserved -= cost` (no change to `available`). Insert DEBIT transaction `SESSION_DEBIT` … see note below.
3. Mentor: `wallet.available += cost`. Insert CREDIT transaction `SESSION_REWARD`.
4. Set booking `status: COMPLETED`, `completedAt: now`.
5. Update learner's goal progress (4.8) and mentor/learner session counters.

> **Ledger type note:** Use `RESERVATION` (learner, available→reserved), `RELEASE` (reserved→available), `SESSION_REWARD` (mentor credit), and `SESSION_SETTLEMENT` (learner reserved debit on completion). `INITIAL_GRANT` and `ADMIN_ADJUSTMENT` complete the set. Each entry stores `direction: "CREDIT" | "DEBIT"` relative to the user's **available** balance, except RESERVATION and RELEASE which move between available and reserved (see 6.5).

### 5.5 Idempotency keys
| Operation | Key format |
|-----------|-----------|
| Initial grant | `grant:<userId>` |
| Reservation | `reserve:<bookingId>` |
| Release | `release:<bookingId>` |
| Learner settlement | `settle-learner:<bookingId>` |
| Mentor reward | `settle-mentor:<bookingId>` |
| Admin adjustment | `admin-adj:<adminActionId>` (client-supplied UUID also accepted) |

The `idempotencyKey` field has a **unique index**. If insert fails with duplicate key during settlement, treat the operation as already applied and return success without changing balances (but only if the existing transaction matches the booking). Otherwise return 409.

### 5.6 Release
Release moves `reserved → available` for the learner. Triggered by: learner or mentor cancellation under policy 4.5, mentor rejection of a PENDING booking (no reservation exists, so no action), admin resolution. Idempotent via `release:<bookingId>`.

### 5.7 Admin adjustment
- `POST /api/v1/admin/users/:id/credit-adjustments` with `{ amount (non-zero integer, ±), reason (required, ≤ 300 chars), idempotencyKey }`.
- Creates an `ADMIN_ADJUSTMENT` transaction and an `AuditLog` entry with admin ID, target, amount, reason, and timestamp.
- Negative adjustments cannot push `available` below zero; if they would, the request fails with `INSUFFICIENT_CREDITS`.

---

## 6. Functional Requirements

Requirement IDs match v1.0 for traceability. New or changed items are marked **[CHANGED]** or **[NEW]**.

### Module 1: Authentication and Authorization

**FR-01 Registration (P0)**
- Input: `name, email, password, college, department, academicYear`.
- Email normalized (trim, lowercase). Unique index.
- Password: min 8 chars, at least one letter and one digit, max 72 bytes (bcrypt limit).
- On success: create user with `role: STUDENT`, `wallet.available = INITIAL_CREDIT_GRANT`, record INITIAL_GRANT transaction, return user (no hash) and set auth cookies. Single transaction.
- Duplicate email → 409 `EMAIL_TAKEN` (generic message: "Unable to register with these details" is acceptable if you prefer to avoid account enumeration; document the choice).
- **[CHANGED]** Institution email verification moved to P2.

**FR-02 Login, logout, refresh (P0)**
- Login: rate-limited (10 attempts / 15 min / IP+email). Invalid credentials → 401 `INVALID_CREDENTIALS` with identical message for wrong email and wrong password.
- Suspended users can log in but receive a `isSuspended: true` flag and read-only restrictions.
- Logout: clears cookies and revokes the refresh token record.
- Refresh: `POST /auth/refresh` rotates the refresh token. Reuse of an old refresh token revokes all sessions for that user.

**FR-03 Role-based access control (P0)**
- Middleware `authenticate` (verifies access JWT, loads user, checks suspension on write routes).
- Middleware `requireRole('ADMIN')`.
- Ownership checks in services, not in middleware alone.

### Module 2: Student Profiles

**FR-04 Create and edit profile (P0)**
- Editable fields: `name, bio (≤ 500), college, department, academicYear (1–8), timezone, skillsWanted (≤ 15 tags), interests (≤ 15 tags), profileImage (URL, P1)`.
- **[NEW]** `interests` added to the model (v1.0 listed it in FR-04 but omitted it from the schema).
- Learning goals are managed through Module 9, not profile PATCH.
- Forbidden fields in PATCH: `role, email, passwordHash, wallet, isSuspended, ratingSummary, scheduleVersion`.

**FR-05 Public profile (P0)**
- Shows: name, college, department, academicYear, bio, skillsWanted, interests, public offerings (active only), `ratingSummary`, `completedSessionsAsMentor`, `completedSessionsAsLearner`, visible reviews (non-hidden, paginated).
- Never shows: email, passwordHash, wallet, timezone exact value (may show), suspension details, report data.

**FR-06 Profile completion (P1)**
- Score = completed fields / total, where the checklist is: name, bio, college, department, academicYear, ≥1 active offering, ≥1 skillsWanted, availability ≥1 window, profileImage.
- Displayed as a percentage with a progress bar.

### Module 3: Skill Management

**FR-07 Create offering (P0)**
- Fields: `title (3–80), description (≤ 1000), category (enum, Section 6.1), difficulty (BEGINNER|INTERMEDIATE|ADVANCED), experienceYears (0–50), durationMinutes (30, 60, 90, or 120), creditCost (5–50, multiple of 5), format (ONLINE|IN_PERSON), tags (≤ 8, each ≤ 24 chars), meetingLink (optional URL, shown only to booking participants)`.
- **[CHANGED]** `experience` (free text) → `experienceYears` (number), so recommendation scoring can use it.
- **[CHANGED]** `durationMinutes` restricted to 30-minute multiples to match the slot model.
- Example: "Java Data Structures", INTERMEDIATE, 60 min, 10 credits, ONLINE.

**FR-08 Edit and deactivate (P0)**
- Only the owner (or admin for moderation) can edit or deactivate.
- `DELETE /skills/:id` sets `isActive: false`. Hard delete is not supported.
- Editing an offering never changes existing bookings (they snapshot `creditCost` and `durationMinutes` at request time).
- Deactivation does not cancel existing bookings. It prevents new bookings.

**FR-09 Learning interests (P0)**
- Covered by `skillsWanted` and `interests` on the user (FR-04). Used by recommendations.

### Module 4: Discovery and Recommendations

**FR-10 Browse offerings (P0)**
- Card shows: title, mentor name and avatar, category, difficulty, creditCost, average rating (or "New"), format, and next available slot (computed; "No upcoming slots" if none within 14 days).

**FR-11 Search (P0)**
- `q` matches title, tags, category, and mentor name (case-insensitive). Implementation: text index on `title, tags, category`; mentor name matched via a `$lookup` aggregation or a denormalized `mentorName` field updated on profile change (choose and document).
- `q` max length 100. Results paginated.

**FR-12 Filters and sorting (P0)**
- Filters: `category, difficulty, format, minCredits, maxCredits, minRating, availableWithin (days: 1|7|14)`.
- Sort: `rating_desc | cost_asc | experience_desc | newest` (default `newest`).
- **[CHANGED]** query parameter names align with the data model (`difficulty`, not `level`).

**FR-13 Mentor recommendations (P1)**
- Score per offering for a learner, all components normalized to [0, 1]:
  - `skillMatch` (0.40): 1.0 if offering category or any tag is in learner's `skillsWanted`; 0.5 if it matches `interests`; else 0.
  - `availabilityMatch` (0.25): 1.0 if mentor has a bookable slot in the next 7 days, 0.5 if within 14 days, else 0.
  - `rating` (0.20): `average / 5`; if `count === 0`, use neutral 0.5.
  - `experience` (0.15): `min(experienceYears / 5, 1)`.
- `score = Σ weight × component`. Return the top 10 with an `explanation` array (e.g., `["Matches your wanted skill: Java", "Rated 4.6 from 12 reviews"]`).
- Weights are constants in `server/src/config/recommendation.js`, not hardcoded in logic.
- Implemented as a pure function with unit tests.

### Module 5: Booking and Scheduling

**FR-14 Request a session (P0)**
- Body: `skillId, scheduledStart (ISO 8601 UTC), learningObjective (≤ 300), message (≤ 500, optional)`.
- The server derives `mentorId` from the offering, `durationMinutes` and `creditCost` from the offering, `scheduledEnd` from both. Client-supplied values for these are rejected.
- Validations: Section 4.2. Duplicate check: an existing PENDING or ACCEPTED booking by the same learner for the same skill and start returns 409 `DUPLICATE_BOOKING`.
- Creates booking PENDING and notifies the mentor.

**FR-15 Booking lifecycle (P0)**
- Implements Section 4.1 exactly. Each endpoint checks actor role on the booking and the current status.

**FR-16 Availability (P0)**
- Mentor manages `WEEKLY` windows (dayOfWeek 0–6, startTime, endTime) and `DATE_OVERRIDE` entries (date `YYYY-MM-DD`, startTime, endTime, isAvailable).
- Validations: startTime < endTime; no overlapping windows of the same type and day; no windows in the past (for DATE_OVERRIDE); times on 30-minute boundaries.
- Slot computation (`GET /skills/:id/slots?from=&to=`): generates bookable starts from the mentor's windows minus existing PENDING/ACCEPTED bookings. Used for both UI and validation.

**FR-17 Booking dashboard (P0)**
- Tabs: Upcoming (ACCEPTED, future), Awaiting response (PENDING; mentor view shows incoming requests), Needs action (completion requested, confirm/dispute), Completed, Rejected, Cancelled, Disputed.

### Module 6: Virtual Learning Credits

**FR-18 Credit system (P0)**
- Initial grant on registration (50 by default).
- Learners spend credits on accepted bookings; mentors earn credits on settlement.
- Credits are non-transferable and non-withdrawable. No endpoint lets a user send credits to another user directly.

**FR-19 Reservation and settlement (P0)**
- Implements Sections 4.3, 4.4, 4.5, 5.3–5.6.

**FR-20 Transaction history (P0)**
- Each ledger entry: `userId, bookingId (optional), type, direction, amount (positive integer), balanceAfter: { available, reserved }, status, idempotencyKey, description, createdAt`.
- **[NEW]** `balanceAfter` snapshot enables auditing and debugging.
- Paginated: `GET /wallet/transactions?page&limit&type`.

**FR-21 Credit integrity (P0)**
- Client cannot set balances (enforced by validators and absence of endpoints).
- Repeated completion requests cannot award credits twice (idempotency + conditional status transition).
- Amounts computed from booking snapshot.
- Use transactions (requires replica set). If the deployment lacks transaction support, the app must refuse to start with a clear error. Do not silently fall back.

### Module 7: Messaging (P1 REST baseline)

**FR-22 Private conversations (P1)**
- A conversation is created only for a booking. Participants: learner and mentor. Created automatically on booking request, or via `POST /conversations` with `bookingId`.
- Eligible while the booking is PENDING, ACCEPTED, DISPUTED, or COMPLETED (within 7 days). Otherwise sending returns 403 `CONVERSATION_CLOSED`.
- Messages: `text` (1–1000 chars, trimmed), `createdAt`, `readBy`.
- Unread count per conversation = messages where current user not in `readBy`.

**FR-23 Conversation authorization (P0)**
- Every read or send checks `conversation.participants.includes(req.user.id)`. Non-members receive 404 (not 403) to avoid confirming existence.

**FR-24 Message history (P1)**
- Cursor pagination by `createdAt` descending: `GET /conversations/:id/messages?before=<ISO>&limit=20`.
- Index `conversationId + createdAt`.
- Client polls every 10 seconds when the conversation is open. Socket.IO is P2.

### Module 8: Notifications

**FR-25 Notification events (P0)**
Types (enum): `BOOKING_REQUESTED, BOOKING_ACCEPTED, BOOKING_REJECTED, BOOKING_CANCELLED, COMPLETION_REQUESTED, BOOKING_COMPLETED, BOOKING_DISPUTED, SESSION_REMINDER, NEW_MESSAGE, CREDITS_RECEIVED, CREDITS_RESERVED, CREDITS_RELEASED, REVIEW_RECEIVED, REPORT_RESOLVED, ACCOUNT_SUSPENDED`.
- Notifications are created in the same transaction as the event where practical. If creation fails after commit, log it and continue (edge case, Section 11).
- `SESSION_REMINDER` is generated by the scheduler 60 minutes before start (P1).

**FR-26 Notification center (P0)**
- `GET /notifications?unread=true&page&limit`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`, plus `GET /notifications/unread-count` for the navbar badge.
- Each notification has `relatedResourceType` and `relatedResourceId` for navigation.

### Module 9: Learning Progress

**FR-27 Learning goals (P1)**
- Fields: `title (≤ 100), description (≤ 500), skillName, targetSessions (1–50), deadline (optional, future at creation), status`.
- `completedSessions` is system-maintained (4.8); users cannot set it.
- Users can cancel a goal (status CANCELLED). Deleting is soft.

**FR-28 Session history (P1)**
- `GET /history?role=learner|mentor&page&limit` returns COMPLETED bookings with skill, counterpart name, date, duration, credits (earned or spent), and whether the user has reviewed it.

**FR-29 Learning dashboard (P1)**
- Metrics from DB aggregation: learning sessions (count), teaching sessions (count), credits earned, credits spent, goals completed, sessions per week for the last 8 weeks.

### Module 10: Ratings and Reviews

**FR-30 Review a session (P1)**
- `POST /reviews` with `bookingId, rating (1–5), comment (≤ 500, optional)`. The server sets `reviewerId` from the session and derives `revieweeId` from the booking.

**FR-31 Review validation (P1)**
- Booking must be COMPLETED; reviewer must be a participant; unique per reviewer and booking.
- Reviews cannot be edited by anyone except the reviewer within 24 hours (optional; default: no edits).
- Admin may hide a review.

**FR-32 Mentor rating (P1)**
- `ratingSummary` updated in the same transaction as review creation or hide. Recomputation fallback script provided to verify consistency.

### Module 11: Reports and Disputes

**FR-33 Report (P1)**
- `POST /reports` with `type: "REPORT"`, `category` (enum: `HARASSMENT, MISLEADING_LISTING, NO_SHOW, CREDIT_PROBLEM, INAPPROPRIATE_CONTENT, OTHER`), `reportedUserId`, optional `bookingId`, `description` (10–1000 chars).
- Rate limit: 5 reports per user per day.

**FR-34 Dispute a session (P1)**
- Only via `PATCH /bookings/:id/dispute` (Section 4.4), which creates a Report with `type: "DISPUTE"`, `bookingId`, and `category` (`NO_SHOW | INCORRECT_COMPLETION | CREDIT_RELEASE_PROBLEM | OTHER`). Preserves status history (`statusHistory` array on booking).

**FR-35 Admin resolution (P1)**
- Admin actions: add internal note, change status (`UNDER_REVIEW → RESOLVED | DISMISSED`), suspend or reactivate reporter/reported user, trigger credit adjustment (5.7), resolve a disputed booking to COMPLETED (settle) or CANCELLED (release or forfeit per resolution).
- Every action writes an `AuditLog` entry.
- Resolving a DISPUTE notifies both participants.

### Module 12: Admin Dashboard

**FR-36 Overview (P1)**
- Counts: total users, active users (logged in within 30 days), active offerings, bookings by status, completed sessions, open reports and disputes, last 10 audit log entries.

**FR-37 User management (P1)**
- Search users by name or email (email search is admin-only), inspect profile, activity summary, suspend/reactivate with mandatory reason (written to AuditLog).

**FR-38 Analytics (P1, basic)**
- Registrations per week (last 12 weeks), bookings per week, completion rate (`COMPLETED / (COMPLETED + CANCELLED + DISPUTED)` over last 30 days), top 5 categories by offering count, active students (completed or requested a booking in last 30 days).
- Implemented as MongoDB aggregation pipelines. Charts are P2.

---

## 7. Data Model

### 7.1 Conventions
- Collections are named in plural, lowercase (`users`, `skills`, …).
- All documents have `createdAt` and `updatedAt` (Mongoose `timestamps: true`).
- Enums are defined once in `server/src/config/enums.js` and reused in models and validators.
- Mongoose schemas use `strict: true`. Never pass raw `req.body` to `Model.create` or `updateOne`.
- `toJSON` transform removes `passwordHash`, `refreshTokens`, `scheduleVersion`, and any internal field.

### 7.2 Users
```js
{
  _id: ObjectId,
  name: String,                       // 2–60
  email: String,                      // lowercase, trimmed, unique
  passwordHash: String,               // select: false
  role: { type: String, enum: ['STUDENT', 'ADMIN'], default: 'STUDENT' },
  college: String,
  department: String,
  academicYear: Number,               // 1–8
  bio: String,                        // ≤ 500
  profileImage: String,               // URL, optional
  timezone: { type: String, default: 'Asia/Kolkata' },
  skillsWanted: [String],             // ≤ 15
  interests: [String],                // ≤ 15
  wallet: { available: { type: Number, min: 0, default: 0 },
            reserved:  { type: Number, min: 0, default: 0 } },
  ratingSummary: { average: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
  completedSessionsAsMentor: { type: Number, default: 0 },
  completedSessionsAsLearner: { type: Number, default: 0 },
  mentorCancellations: { type: Number, default: 0 },
  scheduleVersion: { type: Number, default: 0 },   // concurrency lock for accepts
  isSuspended: { type: Boolean, default: false },
  suspensionReason: String,           // admin-only projection
  refreshTokens: [{ tokenHash: String, expiresAt: Date, createdAt: Date }],  // select: false
  lastLoginAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```
Note: `wallet` min 0 is a last-line guard; the conditional updates in 5.3 are the primary guard.

### 7.3 Skills (offerings)
```js
{
  _id, ownerId: ObjectId (ref users),
  title: String, description: String,
  category: String (enum, see 7.3.1),
  difficulty: { type: String, enum: ['BEGINNER','INTERMEDIATE','ADVANCED'] },
  experienceYears: { type: Number, min: 0, max: 50 },
  durationMinutes: { type: Number, enum: [30, 60, 90, 120] },
  creditCost: { type: Number, min: 5, max: 50 },   // multiple of 5 enforced by validator
  format: { type: String, enum: ['ONLINE','IN_PERSON'] },
  tags: [String],                    // ≤ 8
  meetingLink: String,               // shown to participants only
  isActive: { type: Boolean, default: true },
  ratingSummary: { average: Number, count: Number },   // cached, same rules as user
  mentorName: String,                // denormalized for search (updated on profile name change)
  createdAt, updatedAt
}
```
**7.3.1 Categories (enum):** Programming, Design, Mathematics, Languages, Music, Writing, Data Science, Career Skills, Other.

### 7.4 Availability
```js
{
  _id, mentorId: ObjectId,
  type: { type: String, enum: ['WEEKLY','DATE_OVERRIDE'] },
  dayOfWeek: Number,       // 0–6, required when WEEKLY
  date: String,            // 'YYYY-MM-DD' in mentor timezone, required when DATE_OVERRIDE
  startTime: String,       // 'HH:mm'
  endTime: String,         // 'HH:mm'
  isAvailable: { type: Boolean, default: true },   // false for blackout overrides
  createdAt, updatedAt
}
```
Use a Mongoose pre-validate hook to enforce that exactly one of `dayOfWeek` or `date` is present according to `type`.

### 7.5 Bookings
```js
{
  _id,
  learnerId: ObjectId, mentorId: ObjectId, skillId: ObjectId,
  scheduledStart: Date, scheduledEnd: Date,
  status: { type: String, enum: ['PENDING','ACCEPTED','REJECTED','COMPLETED','CANCELLED','DISPUTED'] },
  learningObjective: String,
  message: String,
  creditCost: Number,              // snapshot
  durationMinutes: Number,         // snapshot
  skillTitle: String,              // snapshot for history readability
  completionRequestedAt: Date,
  completedAt: Date,
  cancelledBy: ObjectId,
  cancellationReason: String,
  cancelledAt: Date,
  flags: [String],                 // e.g., PARTICIPANT_SUSPENDED
  statusHistory: [{ from: String, to: String, actorId: ObjectId, at: Date, note: String }],
  createdAt, updatedAt
}
```
Notes: `statusHistory` is bounded (≤ 20 entries in practice) so embedding is acceptable. `skillTitle` and `creditCost` are snapshots.

### 7.6 Credit transactions (ledger)
```js
{
  _id,
  userId: ObjectId,
  bookingId: ObjectId,               // optional
  type: { type: String, enum: ['INITIAL_GRANT','RESERVATION','RELEASE','SESSION_SETTLEMENT','SESSION_REWARD','ADMIN_ADJUSTMENT'] },
  direction: { type: String, enum: ['CREDIT','DEBIT'] },
  amount: { type: Number, min: 1 },  // positive integer; direction carries sign
  balanceAfter: { available: Number, reserved: Number },
  status: { type: String, enum: ['COMPLETED','FAILED'], default: 'COMPLETED' },
  idempotencyKey: { type: String, required: true },
  description: String,
  createdBy: ObjectId,               // admin for ADMIN_ADJUSTMENT, else null
  createdAt: Date                    // immutable; no updatedAt
}
```
Ledger rows are **append-only**. Corrections are new rows (ADMIN_ADJUSTMENT), never edits.

### 7.7 Conversations
```js
{ _id, bookingId: ObjectId (unique), participants: [ObjectId] (length 2),
  lastMessageAt: Date, lastMessagePreview: String, createdAt, updatedAt }
```

### 7.8 Messages
```js
{ _id, conversationId: ObjectId, senderId: ObjectId,
  text: { type: String, minlength: 1, maxlength: 1000 },
  readBy: [ObjectId], createdAt }
```

### 7.9 Notifications
```js
{ _id, userId: ObjectId,
  type: { type: String, enum: [/* see FR-25 */] },
  title: String, message: String,
  relatedResourceType: { type: String, enum: ['BOOKING','CONVERSATION','REVIEW','REPORT','USER'] },
  relatedResourceId: ObjectId,
  isRead: { type: Boolean, default: false },
  createdAt: Date }
```

### 7.10 Reviews
```js
{ _id, bookingId: ObjectId, reviewerId: ObjectId, revieweeId: ObjectId,
  rating: { type: Number, min: 1, max: 5 },
  comment: { type: String, maxlength: 500 },
  isHidden: { type: Boolean, default: false },
  createdAt, updatedAt }
```

### 7.11 Learning goals
```js
{ _id, userId: ObjectId, title: String, description: String, skillName: String,
  targetSessions: { type: Number, min: 1, max: 50 },
  completedSessions: { type: Number, default: 0 },
  deadline: Date,
  status: { type: String, enum: ['IN_PROGRESS','COMPLETED','CANCELLED'], default: 'IN_PROGRESS' },
  createdAt, updatedAt }
```

### 7.12 Reports (includes disputes)
```js
{ _id, type: { type: String, enum: ['REPORT','DISPUTE'] },
  reporterId: ObjectId, reportedUserId: ObjectId, bookingId: ObjectId,
  category: String,
  description: { type: String, minlength: 10, maxlength: 1000 },
  status: { type: String, enum: ['OPEN','UNDER_REVIEW','RESOLVED','DISMISSED'], default: 'OPEN' },
  adminNotes: [{ adminId: ObjectId, note: String, at: Date }],   // internal only
  resolution: String,
  resolvedBy: ObjectId, resolvedAt: Date,
  createdAt, updatedAt }
```

### 7.13 Audit log (new)
```js
{ _id, actorId: ObjectId, action: String,        // e.g., USER_SUSPENDED, CREDIT_ADJUSTED, REPORT_RESOLVED
  targetType: String, targetId: ObjectId,
  details: Object,                               // small, validated JSON
  createdAt: Date }                              // append-only
```

### 7.14 Indexes (required)
| Collection | Index | Purpose / note |
|-----------|-------|----------------|
| users | `{ email: 1 }` unique | Duplicate accounts |
| users | `{ role: 1 }` | Admin lookups |
| skills | `{ ownerId: 1, isActive: 1 }` | My offerings |
| skills | `{ category: 1, isActive: 1 }` | Discovery filter |
| skills | text `{ title: 'text', tags: 'text', category: 'text' }` | Search |
| availability | `{ mentorId: 1, type: 1, dayOfWeek: 1 }` | Slot computation |
| availability | `{ mentorId: 1, date: 1 }` | Overrides |
| bookings | `{ mentorId: 1, scheduledStart: 1 }` | Mentor overlap checks |
| bookings | `{ learnerId: 1, scheduledStart: 1 }` | Learner overlap checks |
| bookings | `{ status: 1, completionRequestedAt: 1 }` | Auto-confirm job |
| creditTransactions | `{ userId: 1, createdAt: -1 }` | History |
| creditTransactions | `{ idempotencyKey: 1 }` unique | Idempotency |
| conversations | `{ bookingId: 1 }` unique; `{ participants: 1 }` | Lookup |
| messages | `{ conversationId: 1, createdAt: -1 }` | Pagination |
| notifications | `{ userId: 1, isRead: 1, createdAt: -1 }` | Unread lists |
| reviews | `{ bookingId: 1, reviewerId: 1 }` unique | One review per reviewer |
| reviews | `{ revieweeId: 1, isHidden: 1 }` | Public list |
| reports | `{ status: 1, createdAt: -1 }` | Admin queue |
| auditLogs | `{ targetId: 1, createdAt: -1 }` | Audit trail |

---

## 8. API Specification

### 8.1 Base and conventions
- Base path: `/api/v1`. JSON only. Request body max 100 KB.
- Auth: access token cookie (`cl_access`) and refresh token cookie (`cl_refresh`, path-scoped to `/api/v1/auth`).
- IDs: validate every `:id` as a 24-hex ObjectId; invalid → 400 `VALIDATION_ERROR`.
- Pagination: `?page=1&limit=12` (limit max 50). Response `meta`: `{ page, limit, total, totalPages }`.

### 8.2 Response envelope
Success:
```json
{ "success": true, "message": "Booking requested", "data": { "id": "…", "status": "PENDING" } }
```
Paginated success:
```json
{ "success": true, "message": "OK", "data": [ … ], "meta": { "page": 1, "limit": 12, "total": 40, "totalPages": 4 } }
```
Error:
```json
{ "success": false, "message": "Insufficient credits", "code": "INSUFFICIENT_CREDITS", "details": [ ] }
```
`details` is present only for validation errors (`[{ "field": "creditCost", "message": "..." }]`). Stack traces are never returned in production.

### 8.3 Error codes and statuses
| Code | HTTP | When |
|------|------|------|
| VALIDATION_ERROR | 400 | Input fails schema |
| INVALID_CREDENTIALS | 401 | Login failure |
| UNAUTHENTICATED | 401 | Missing or invalid access token |
| TOKEN_EXPIRED | 401 | Access token expired (client should refresh) |
| FORBIDDEN | 403 | Authenticated but not permitted (role, ownership, participant) |
| ACCOUNT_SUSPENDED | 403 | Restricted action by suspended user |
| CONVERSATION_CLOSED | 403 | Messaging after eligibility window |
| NOT_FOUND | 404 | Resource missing or hidden from requester |
| EMAIL_TAKEN | 409 | Duplicate registration |
| INVALID_STATE_TRANSITION | 409 | Disallowed booking transition or concurrent change |
| BOOKING_OVERLAP | 409 | Mentor or learner overlap |
| DUPLICATE_BOOKING | 409 | Same learner, skill, and start already active |
| SLOT_UNAVAILABLE | 409 | Outside mentor availability |
| INSUFFICIENT_CREDITS | 422 | Balance too low for reservation or adjustment |
| BUSINESS_RULE_VIOLATION | 422 | Other domain rule (e.g., own offering, review before completion) |
| RATE_LIMITED | 429 | Throttled |
| INTERNAL_ERROR | 500 | Unexpected; logged server-side with request ID |

### 8.4 Endpoints

**Auth**
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | /auth/register | Public | FR-01 |
| POST | /auth/login | Public | Rate-limited |
| POST | /auth/logout | Authenticated | Revokes refresh token |
| GET | /auth/me | Authenticated | Current user (sanitized) |
| POST | /auth/refresh | Refresh cookie | Rotates tokens |

**Users and profiles**
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | /users/me | Auth | Own full profile |
| PATCH | /users/me | Auth | FR-04 whitelist |
| GET | /users/:id | Public | Public profile (FR-05) |
| GET | /users/:id/skills | Public | Active offerings only |
| GET | /users/:id/reviews | Public | Paginated, non-hidden |
| GET | /users/me/profile-completion | Auth | FR-06 |

**Skills**
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | /skills | Public | FR-10–12; query: `q, category, difficulty, format, minCredits, maxCredits, minRating, availableWithin, sort, page, limit` |
| GET | /skills/categories | Public | Enum list |
| POST | /skills | Auth (student) | FR-07 |
| GET | /skills/:id | Public | Detail; `meetingLink` hidden from non-participants |
| GET | /skills/:id/slots | Public | `from, to` (max 14 days span); returns bookable starts |
| PATCH | /skills/:id | Owner | FR-08 whitelist |
| DELETE | /skills/:id | Owner | Soft deactivate |
| GET | /skills/recommendations | Auth | FR-13; top 10 |

**Availability**
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | /availability/me | Auth | Own windows |
| GET | /availability/:mentorId | Public | Mentor's windows |
| POST | /availability | Auth | Create WEEKLY or DATE_OVERRIDE; validated |
| PATCH | /availability/:id | Owner | |
| DELETE | /availability/:id | Owner | |

**Bookings**
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | /bookings | Auth | FR-14 (learner) |
| GET | /bookings/me | Auth | Query: `role=learner\|mentor`, `status`, `page`, `limit` |
| GET | /bookings/:id | Participant or admin | |
| PATCH | /bookings/:id/accept | Mentor | 4.3 |
| PATCH | /bookings/:id/reject | Mentor | PENDING only |
| PATCH | /bookings/:id/cancel | Participant | Body: `reason` (≤ 300). Policy 4.5 |
| PATCH | /bookings/:id/complete | Mentor | Sets `completionRequestedAt`; `now ≥ scheduledEnd` |
| PATCH | /bookings/:id/confirm | Learner | Settles (5.4) |
| PATCH | /bookings/:id/dispute | Learner | Body: `category, description`; creates DISPUTE |

No `PATCH /bookings/:id/status` endpoint exists.

**Wallet**
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | /wallet | Auth | `{ available, reserved }` |
| GET | /wallet/transactions | Auth | Paginated; query `type` |
| GET | /wallet/summary | Auth | Totals earned, spent, reserved (aggregation) |

No endpoint accepts a balance value.

**Messaging**
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | /conversations | Auth | Own conversations, with unread count |
| POST | /conversations | Auth | Body: `bookingId`; participant-only |
| GET | /conversations/:id/messages | Participant | `before, limit` (cursor) |
| POST | /conversations/:id/messages | Participant | Eligibility check (FR-22) |
| PATCH | /conversations/:id/read | Participant | Marks all as read |

**Notifications**
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | /notifications | Auth | `unread, page, limit` |
| GET | /notifications/unread-count | Auth | For navbar |
| PATCH | /notifications/:id/read | Owner | |
| PATCH | /notifications/read-all | Auth | |

**Goals, history, dashboard**
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | /goals | Auth | FR-27 |
| GET | /goals | Auth | Own goals |
| PATCH | /goals/:id | Owner | Title, description, targetSessions, deadline, status→CANCELLED only |
| DELETE | /goals/:id | Owner | Soft cancel |
| GET | /history | Auth | FR-28; `role` query |
| GET | /dashboard/learning | Auth | FR-29 metrics |

**Reviews and reports**
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | /reviews | Participant of COMPLETED booking | FR-30–31 |
| POST | /reports | Auth | FR-33; `type` forced to REPORT |
| GET | /reports/me | Auth | Own reports and disputes (status only; no admin notes) |

**Admin (all require role ADMIN)**
| Method | Path | Notes |
|--------|------|-------|
| GET | /admin/overview | FR-36 |
| GET | /admin/analytics | FR-38 |
| GET | /admin/users | Search: `q, role, isSuspended, page, limit` |
| GET | /admin/users/:id | Inspect (includes activity counts, not hashes) |
| PATCH | /admin/users/:id/suspend | Body: `reason` (required) |
| PATCH | /admin/users/:id/reactivate | Body: `reason` (required) |
| POST | /admin/users/:id/credit-adjustments | 5.7 |
| GET | /admin/reports | Query: `type, status` |
| GET | /admin/reports/:id | Includes linked booking and ledger entries |
| PATCH | /admin/reports/:id | Body: `status, resolution, note`; resolution actions per FR-35 |
| GET | /admin/transactions | Audit ledger query; `userId, type, from, to` |
| GET | /admin/audit-logs | Append-only log view |

---

## 9. Frontend Requirements

### 9.1 Global
- Responsive navigation: top bar on desktop, bottom or hamburger on mobile.
- Components to build: `Button, Input, Select, Textarea, Card, Badge (status colors), Modal (focus trap, Esc to close), Toast, Skeleton, EmptyState, Pagination, Avatar, ProgressBar, ProtectedRoute, AdminRoute`.
- Status badge colors: PENDING amber, ACCEPTED indigo, COMPLETED green, REJECTED red, CANCELLED slate, DISPUTED red-outline.
- Design tokens: primary indigo (`indigo-600`), secondary teal (`teal-500`), neutral backgrounds (`slate-50`), text `slate-800`.
- All user-generated text rendered as text nodes, never via `dangerouslySetInnerHTML`.
- Every form validates client-side with the same rules as the server (shared constants), and displays server `details` field errors.
- Keyboard navigable; visible focus ring (`focus-visible:ring-2`); labels on all inputs; `aria-live` for toasts.

### 9.2 Public pages
| Route | Content |
|-------|---------|
| `/` | Hero ("Your Campus Is Full of People Who Can Teach You Something"), how it works (3 steps), popular categories (from data), featured mentors (highest rated, ≥ 1 review), benefits, CTAs, footer |
| `/login` | Email, password with visibility toggle, loading state, error state (generic), link to register |
| `/register` | Full form (FR-01), password strength hint, terms/privacy notice, success redirects to onboarding |
| `/discover` | Public listing with filters and sort (FR-10–12); logged-out users see results but booking actions prompt login |
| `/skills/:id` | Offering detail, mentor summary, slot picker, request form (learning objective, message), login prompt if logged out |
| `/users/:id` | Public profile (FR-05) |

### 9.3 Student pages (authenticated)
| Route | Content |
|-------|---------|
| `/dashboard` | Welcome, credit balance card, upcoming sessions, recommendations (P1), profile completion (P1), quick actions |
| `/my-skills` | Own offerings with active toggle, edit link |
| `/my-skills/new` and `/my-skills/:id/edit` | Offering form (FR-07) |
| `/settings/profile` | Profile form (FR-04) |
| `/settings/availability` | Weekly windows and date overrides |
| `/bookings` | Dashboard tabs (FR-17) |
| `/bookings/:id` | Booking details, timeline (statusHistory), actions by role (accept/reject, complete, confirm/dispute, cancel), meeting link (participants only), linked conversation |
| `/wallet` | Available and reserved balances, transactions table with filters, pagination |
| `/messages` | Conversation list and thread (P1) |
| `/notifications` | List with read/unread, mark-all-read |
| `/goals` | Goal cards with progress bar (P1) |
| `/history` | Completed sessions with review action (P1) |
| `/reviews/new?booking=:id` | Review form (P1) |

### 9.4 Admin pages (role ADMIN; non-admins redirected to `/dashboard` with a toast)
| Route | Content |
|-------|---------|
| `/admin` | Overview counts and recent audit entries |
| `/admin/users` | Search, inspect, suspend/reactivate with reason modal, credit adjustment modal |
| `/admin/reports` | Queue with status filter; detail view with linked booking and ledger |
| `/admin/transactions` | Ledger search (type, user, date range) |
| `/admin/analytics` | Basic metrics (FR-38); charts P2 |

### 9.5 UX states (required on every data view)
Loading (skeleton), empty (message + next action), error (message + retry button), success (toast for mutations).

---

## 10. Key End-to-End Workflows

### 10.1 Onboarding
1. Register → server creates user, grants 50 credits, sets auth cookies.
2. Redirect to `/settings/profile` with progress indicator.
3. Add interests and skillsWanted; optionally publish an offering and add availability.
4. Dashboard shows recommendations (P1) or discovery prompt.

### 10.2 Booking (learner side)
1. Search or browse on `/discover`; apply filters.
2. Open `/skills/:id`; choose a slot from `GET /skills/:id/slots`.
3. Submit request → `POST /bookings`. Booking PENDING; mentor notified.
4. Learner sees "Awaiting mentor" in `/bookings`.

### 10.3 Accepting (mentor side)
1. Mentor opens booking; sees learner's objective and message.
2. Accept → transaction (4.3): lock mentor, check overlap, reserve learner credits, set ACCEPTED, notify.
3. If credits are insufficient, mentor sees a clear message: "The learner no longer has enough credits for this session." Booking remains PENDING; mentor may reject.
4. Reject → PENDING to REJECTED; no credit change.

### 10.4 Completion and settlement
1. After `scheduledEnd`, mentor clicks "Mark session complete" → `PATCH /complete`.
2. Learner receives COMPLETION_REQUESTED notification and sees "Confirm" or "Report a problem".
3. Confirm → settlement transaction (5.4). Both users notified. Histories and goals update.
4. Dispute → status DISPUTED; admin resolves (10.5).
5. No action for 72 hours → scheduled job auto-confirms (4.4).

### 10.5 Dispute resolution
1. Learner files dispute with category and description.
2. Admin opens `/admin/reports`, reviews booking and ledger entries.
3. Admin chooses: complete (settle), cancel with release, or cancel with forfeit. Each writes ledger entries and an audit log.
4. Report marked RESOLVED with resolution text. Both parties notified.

### 10.6 Review
1. After COMPLETED, both participants see "Leave a review" in history.
2. Submit → review created, `ratingSummary` updated transactionally, reviewee notified.

---

## 11. Business Rules and Edge Cases

| Scenario | Required behavior |
|----------|-------------------|
| Book own offering | 422 BUSINESS_RULE_VIOLATION |
| Insufficient credits at request | 422 INSUFFICIENT_CREDITS (soft check; no booking created) |
| Insufficient credits at acceptance (race) | 422; booking stays PENDING; no partial reservation |
| Mentor unavailable at requested time | 409 SLOT_UNAVAILABLE |
| Overlapping booking (mentor or learner) | 409 BOOKING_OVERLAP |
| Duplicate request (same learner, skill, start) | 409 DUPLICATE_BOOKING |
| Two learners accept overlapping requests concurrently | Exactly one succeeds (4.3 lock) |
| Reject after accepted | 409 INVALID_STATE_TRANSITION |
| Cancel after COMPLETED or DISPUTED | 409 INVALID_STATE_TRANSITION |
| Rejected request | No reservation exists; nothing to release |
| Eligible cancellation | Policy 4.5 |
| Duplicate completion confirm | Settles once; second call returns current booking (200, no balance change) |
| Mentor completes before `scheduledEnd` | 422 BUSINESS_RULE_VIOLATION |
| Review before completion | 422 BUSINESS_RULE_VIOLATION |
| Duplicate review | 409 CONFLICT (use `DUPLICATE_REVIEW`) |
| Unauthorized conversation access | 404 NOT_FOUND |
| Client sends `role` or `wallet` | Stripped by validator; logged; no error |
| Edit another user's offering | 403 FORBIDDEN |
| Suspend user with upcoming bookings | Restricted; bookings flagged; not auto-cancelled |
| Partial transaction failure | Whole transaction aborted; no partial state |
| Notification creation fails after commit | Log error; underlying change remains |
| Change offering price after acceptance | Booking keeps snapshot price |
| Deactivate offering with bookings | Bookings remain readable; new requests blocked |
| Replica set unavailable | Startup fails with clear message; no silent non-transactional mode |
| Mentor deletes account (not supported) | Account deletion is out of MVP scope; suspension is the mechanism |

**No-show:** Handled only through dispute (4.5). No automatic penalties in MVP.

---

## 12. Security Requirements

### 12.1 Authentication
- bcrypt cost 12. Never log passwords or tokens.
- Access token: 15 minutes. Refresh token: 7 days, rotated on each use, stored hashed, revoked on logout and on reuse detection.
- Cookies: `httpOnly: true`, `secure: true` in production, `sameSite: 'strict'` for access, `'lax'` acceptable for refresh if the flow requires it (document choice).
- Login and register rate limits (express-rate-limit): 10 login attempts per 15 minutes per IP+email; 5 registrations per hour per IP.

### 12.2 Authorization
- Central `authenticate` and `requireRole` middleware.
- Ownership and participation checks in services (e.g., `assertBookingParticipant(booking, userId)`).
- Suspension check on all write routes via `requireActiveAccount`.
- Admin routes mounted under `/api/v1/admin` with `requireRole('ADMIN')` applied at the router level.

### 12.3 Input and API protection
- Zod validation for body, query, and params on every route.
- Strip unknown keys (`.strict()` or `.strip()` per module, consistently).
- Reject any `$` or `.` prefixed keys in input (sanitization middleware or `express-mongo-sanitize`).
- Never pass client objects directly to queries: build explicit filter objects.
- Message max 1000 chars, description max 1000, comment max 500, bio max 500.
- CORS allow-list from env `CLIENT_ORIGINS` (comma-separated). No wildcard with credentials.
- Security headers via helmet. Request body limit 100 KB.
- Generic 500 responses in production; detailed logs server-side with request ID.

### 12.4 XSS and content
- React escapes text by default. Forbid `dangerouslySetInnerHTML` via ESLint rule.
- Sanitize rich-text fields if added (not in MVP: plain text only).

### 12.5 Secrets and database
- Secrets via environment variables only. `.env` in `.gitignore`. Provide `.env.example` with placeholder values.
- Least-privilege Atlas user (readWrite on the app database only). IP access list restricted (Render egress or documented range).
- Never return `passwordHash`, `refreshTokens`, `scheduleVersion`, `suspensionReason` (non-admin).

### 12.6 Concurrency
- Credits: conditional updates (5.3) and idempotency keys (5.5).
- Bookings: mentor version lock (4.3) and conditional status transitions (4.1).
- Critical test scenario is specified in Section 13.4.

---

## 13. Testing Strategy and Delivery Plan

### 13.1 Test levels and tools
| Level | Tool | Scope |
|-------|------|-------|
| Unit | Jest | Pure functions: slot generation, state transitions, recommendation scoring, credit math, review eligibility, Zod schemas |
| Integration (API) | Jest + Supertest + mongodb-memory-server (replica set) | Each endpoint's happy path and failure modes |
| Concurrency | Jest with `Promise.all` on parallel requests | Credit overdraw, double booking, double settlement |
| Frontend unit/component | Vitest + React Testing Library | Forms, states, guards, booking action visibility by role |
| Manual E2E | Checklist (Section 13.6) | Full three-account flows |

### 13.2 Required automated tests (must exist and pass)
**Unit**
- U-01 Slot generation respects weekly and override windows, timezone, and 30-min grid.
- U-02 Booking transition table: every allowed transition succeeds, every disallowed one throws `INVALID_STATE_TRANSITION`.
- U-03 Recommendation score: weights sum to 1; components clamp to [0, 1]; neutral rating when no reviews.
- U-04 Review eligibility: only participants of COMPLETED bookings; not twice.
- U-05 Cancellation policy: correct release/forfeit at boundaries (23h59m vs 24h01m before start).
- U-06 Profile validation rejects forbidden fields (`role`, `wallet`).

**Integration**
- I-01 Register → login → `/auth/me` works; duplicate email rejected (409).
- I-02 Login with wrong password returns 401 with identical message for unknown email.
- I-03 Create offering; edit own; edit other's → 403.
- I-04 Search and filters return only active offerings, paginated, with validated params.
- I-05 Request and accept a booking; credits reserved; balances correct.
- I-06 Reject a PENDING booking; no ledger change.
- I-07 Mentor completes; learner confirms; credits settle; history and goal update.
- I-08 Dispute path pauses settlement; auto-confirm job does not settle disputed bookings.
- I-09 Review after COMPLETED succeeds; before completion fails; duplicate fails.
- I-10 Suspended user cannot create booking (403 ACCOUNT_SUSPENDED).
- I-11 Admin suspend writes AuditLog; non-admin gets 403 on every `/admin/*` route.

**Authorization**
- A-01 Unauthenticated request to protected route → 401.
- A-02 Student calling any admin route → 403.
- A-03 Student editing another's offering → 403.
- A-04 Non-participant reading messages → 404.
- A-05 Client body with `role: "ADMIN"` on register or PATCH → field ignored; role remains STUDENT.
- A-06 Learner trying to accept own request (as mentor) → 403.
- A-07 Mentor trying to confirm completion → 403.

**Concurrency (critical)**
- C-01 **Overdraw test:** learner with 10 available credits and two PENDING bookings of 10 credits each. Fire both accept requests in parallel. Exactly one succeeds. Final `available = 0`, `reserved = 10`, no negative values.
- C-02 **Double booking test:** two learners request the same mentor slot; mentor accepts both in parallel. Exactly one ACCEPTED.
- C-03 **Duplicate settlement test:** fire 5 parallel `PATCH /confirm` calls. Exactly one settlement: learner reserved decreased once, mentor credited once, one SESSION_REWARD row.
- C-04 **Duplicate completion test:** repeated `PATCH /complete` does not create extra ledger rows.

**Frontend**
- F-01 Login form shows validation errors and disables submit while loading.
- F-02 Booking action buttons render per role and status.
- F-03 Protected route redirects anonymous users to `/login`.
- F-04 Admin route redirects students.
- F-05 Empty state renders for zero bookings.

### 13.3 Manual acceptance checklist
Use three accounts: **Student A** (mentor), **Student B** (learner), **Administrator** (seeded).
- [ ] A creates offering; B finds it via search and filters
- [ ] B requests a slot; A sees request and accepts; B's available credits drop and reserved rise
- [ ] A marks complete after end time; B confirms; B debited, A credited; both see history
- [ ] Second booking is disputed by B; Admin resolves; ledger and audit log updated
- [ ] B leaves a review; A's rating average updates on public profile
- [ ] Admin suspends B; B cannot create a booking; reactivation restores access
- [ ] Notifications appear for each step and mark-as-read works

### 13.4 Milestone plan (4 weeks; reduce P1 items before reducing P0 quality)

**Milestone 1 (Week 1): Foundation and identity**
- T-01 Monorepo setup: `client/` (Vite) and `server/` (Express), ESLint, Prettier, `.env.example`, README skeleton.
- T-02 Express app: helmet, cors allow-list, JSON limit, error middleware, request ID, health route `GET /api/v1/health`.
- T-03 Mongo connection with replica set check; fail fast if transactions unsupported.
- T-04 User model, enums config, toJSON sanitizer.
- T-05 Auth: register, login, logout, refresh (rotation), me; cookies; rate limiting.
- T-06 Auth UI: login, register, protected route, auth context.
- T-07 Profile API and UI (FR-04–05), profile completion (FR-06 P1).
- T-08 Skill offering CRUD API and UI (FR-07–08).
- **Exit gate:** I-01, I-02, I-03, A-01, A-03, A-05 pass.

**Milestone 2 (Week 2): Discovery and booking**
- T-09 Availability models, endpoints, UI (FR-16).
- T-10 Slot computation service with U-01.
- T-11 Search, filters, sort, pagination (FR-10–12).
- T-12 Booking request and lifecycle endpoints without credits (FR-14, FR-15) with U-02, I-04.
- T-13 Booking pages and dashboard (FR-17).
- **Exit gate:** Overlap and duplicate tests pass; B can request and A can accept/reject in the UI.

**Milestone 3 (Week 3): Credits, settlement, reviews, goals**
- T-14 Wallet model, ledger, initial grant (FR-18, FR-20).
- T-15 Reservation on accept with conditional update (5.3); release logic (5.6).
- T-16 Completion request, confirm, dispute, auto-confirm job (4.4).
- T-17 Settlement with idempotency (5.4–5.5).
- T-18 Wallet UI (`/wallet`), history (`/history`).
- T-19 Reviews API and UI (P1).
- T-20 Learning goals API and UI (P1).
- **Exit gate:** C-01 through C-04, I-05 through I-09 pass.

**Milestone 4 (Week 4): Notifications, admin, hardening, deployment**
- T-21 Notifications model, events, endpoints, navbar badge (FR-25–26).
- T-22 Messaging REST (P1) if time; otherwise defer and mark in README.
- T-23 Admin routes: overview, users, reports, transactions, audit log (FR-35–38).
- T-24 Security review against Section 12 checklist; fix findings.
- T-25 Full test run; coverage report for `services/`.
- T-26 Deploy backend (Render) and frontend (Vercel); verify cookies over HTTPS and CORS.
- T-27 Seed script: create admin, two sample students, sample offerings and availability.
- T-28 README (Section 14) and screenshots.
- **Exit gate:** Section 13.3 checklist passes on the deployed URL.

### 13.5 Priority cuts if time runs short
Cut in this order, never cutting P0 integrity: (1) analytics charts, (2) recommendations, (3) profile completion, (4) learning dashboard metrics, (5) messaging, (6) goal pages, (7) reviews UI polish, (8) auto-confirm job (replace with manual admin resolution and document it). **Do not cut:** auth, authorization, booking overlap checks, reservation/settlement idempotency, or the concurrency tests.

---

## 14. Deployment and Environment

### 14.1 Environment variable names (values never committed)
| Variable | Used by | Example format |
|----------|---------|----------------|
| `NODE_ENV` | server | `development` / `production` |
| `PORT` | server | `5000` |
| `MONGODB_URI` | server | `mongodb+srv://…` (replica set required) |
| `JWT_ACCESS_SECRET` | server | 64+ random chars |
| `JWT_REFRESH_SECRET` | server | 64+ random chars |
| `CLIENT_ORIGINS` | server (CORS) | `https://app.example.vercel.app` |
| `INITIAL_CREDIT_GRANT` | server | `50` |
| `DEFAULT_TIMEZONE` | server | `Asia/Kolkata` |
| `CLOUDINARY_*` | server (P1) | names only |
| `VITE_API_BASE_URL` | client | `https://api.example.onrender.com/api/v1` |

### 14.2 Deployment checklist
1. Atlas cluster is a replica set; database user least-privilege; IP access list restricted.
2. Render service: build `npm ci`, start `node src/server.js`; env vars set in dashboard.
3. CORS set to deployed frontend origin only; cookies `secure: true`; `trust proxy` set so secure cookies work behind Render's proxy.
4. Vercel project: root `client/`, build `npm run build`; `VITE_API_BASE_URL` set.
5. Run seed script once against production (admin credentials stored in a password manager, not in the repo).
6. Indexes created (Mongoose `autoIndex` in dev; explicit `syncIndexes` script in production).
7. Smoke test with the three accounts from 13.3.
8. Check Render cold-start behavior; warm the service before the demo; keep a local demo fallback.

---

## 15. Assumed Defaults (used where the original PRD was silent)

The agent uses these unless the student overrides them in `docs/DECISIONS.md`:

| Topic | Default |
|-------|---------|
| Initial credit grant | 50 |
| Credit cost range | 5–50, multiples of 5 |
| Mentor reward | Equal to cost; no platform fee |
| Slot granularity | 30 minutes; durations 30/60/90/120 |
| Minimum notice | 2 hours |
| Completion confirmation window | 72 hours, then auto-confirm |
| Late cancel window | 24 hours |
| Messaging | REST polling every 10 seconds; closes 7 days after completion |
| Admin creation | Seed script only |
| Email notifications | Not implemented |
| Real-time | Not implemented in P0/P1 |
| Time zone | `Asia/Kolkata` default, per-mentor override |
| Password policy | 8+ chars, letter and digit |

---

## 16. Acceptance Checklist (Final Demo Gate)

| Area | Criteria | Status |
|------|----------|:---:|
| Authentication | Register and login work; duplicates rejected; protected routes require auth; roles enforced server-side | ☐ |
| Profiles | Edit profile; forbidden fields ignored; public profile hides sensitive data | ☐ |
| Skills | Create, edit, deactivate own offerings; others' edits rejected | ☐ |
| Discovery | Search, filters, sort, pagination with validated params | ☐ |
| Availability | Weekly and override windows; past and overlapping windows rejected | ☐ |
| Bookings | Request, accept, reject, cancel, complete, confirm, dispute all work; invalid transitions rejected | ☐ |
| Overlaps | Mentor and learner double-booking prevented under concurrency | ☐ |
| Credits | No overdraw under concurrency (C-01); settlement exactly once (C-03); ledger auditable | ☐ |
| Reviews | Only after COMPLETED; one per reviewer per booking; rating summary consistent | ☐ |
| Goals and history | Goals progress from settled sessions; history accurate | ☐ |
| Notifications | Events created; list, read, read-all, unread count work | ☐ |
| Admin | Admin-only access; suspend, reactivate, adjust credits, resolve reports; all audited | ☐ |
| Quality | Responsive UI; loading/empty/error states; validation on both sides; critical tests pass | ☐ |
| Deployment | Deployed URL works with separate student and admin accounts; HTTPS cookies; CORS restricted | ☐ |
| Documentation | README complete (Section 17); limitations documented honestly | ☐ |

---

## 17. README Requirements

1. Title and one-paragraph description
2. Problem statement and intended users
3. Feature list (marked implemented / partial / not implemented)
4. Tech stack
5. Architecture diagram (from Section 4 of v1.0, updated)
6. Screenshots of real workflows (student booking, mentor acceptance, wallet ledger, admin reports)
7. Database design overview (collections and key indexes)
8. Local setup: prerequisites, Atlas or local replica set, install, seed, run
9. Environment variable names (Section 14.1), never values
10. API documentation (summary table or link to Section 8)
11. Testing instructions: commands and what each suite covers
12. Deployed URLs and demo account descriptions (passwords shared privately, not in the README)
13. Known limitations and future work (messaging polish, email, Socket.IO, analytics charts, no-show automation, real identity verification)

---

## 18. Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Scope grows beyond schedule | Milestone exit gates; priority cuts (13.5) |
| Credit inconsistency | Conditional updates, idempotency keys, append-only ledger, concurrency tests |
| Double booking | Mentor version lock in transaction, server-side overlap checks, concurrency tests |
| Unauthorized access | Central middleware, ownership checks in services, authorization test suite |
| Transactions unavailable in deployment | Verify replica set in Milestone 1; fail fast |
| Hosting cold starts or free-tier limits | Warm before demo; local fallback; document limits |
| Agent makes unreviewed rule changes | Decisions logged in `docs/DECISIONS.md`; supervisor reviews diffs at each milestone exit |

---

## 19. Open Questions for the Student (answer before Milestone 1)

1. What is the exact submission deadline?
2. Are you building alone or with teammates? (Affects task split and git workflow.)
3. Has the professor specified required features, technologies, or report formatting?
4. Is deployment required, or is a local demonstration acceptable?
5. Confirm or change the assumed defaults in Section 15.

---

## 20. Recommended Build Sequence for the Agent (Summary)

1. Read Sections 0–4 and confirm understanding.
2. Build Milestone 1 (Section 13.4). Run tests. Stop at the exit gate and report.
3. Repeat for Milestones 2, 3, and 4.
4. Never begin P2 work while any P0 item or exit-gate test is failing.

**Core principle:** A reliable, tested application with fewer features is stronger than a broad, fragile one. Protect authentication, bookings, and credits above everything else.

---

## Appendix A. Changes from v1.0

| Area | Change |
|------|--------|
| Credit rules | Defined grant amount, cost range, mentor reward, reservation timing, cancellation policy, completion and confirmation flow |
| Booking model | Added explicit transition rules, slot validity rules, concurrency lock, completion confirmation, statusHistory |
| Data model | Fixed field mismatches (`level` vs `difficulty`, `experience` vs `experienceYears`); added `interests`, `timezone`, `balanceAfter`, `AuditLog`, `scheduleVersion`, `flags`, dispute fields on Reports |
| API | Fixed query-string typos; added missing endpoints (`/skills/:id/slots`, `/bookings/:id/confirm`, `/bookings/:id/dispute`, admin credit adjustments, audit logs, unread count, dashboard); added standard error codes and pagination meta |
| Priorities | Resolved contradictions (messaging and analytics priorities; dispute and reports timing) |
| Security | Added rate limits, cookie details, refresh-token rotation, sanitization, CORS config, forbidden-field policy |
| Testing | Named test IDs, concurrency scenarios matched to PRD critical test, frontend and authorization suites |
| Delivery | Converted into four milestone gates with task IDs and exit criteria |
| Agent guidance | Added operating rules, definition of done, and assumed-defaults table |
| Removed | Vague phrases such as "explainable" without a method, and "institution email verification" as a P0 consideration |
