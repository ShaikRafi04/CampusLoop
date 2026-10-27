# CampusLoop Architectural & Product Decisions

This document records architectural, product, and configuration decisions adopted for CampusLoop per PRD Section 0.1 and Section 15.

---

### Date: 2026-10-27

#### 1. Assumed Defaults Adopted (Section 15)
- **Initial Credit Grant**: 50 credits automatically granted to every registered student upon successful account creation.
- **Credit Cost Range**: Allowed offering cost between 5 and 50 credits, constrained to multiples of 5 (e.g. 5, 10, 15, ..., 50).
- **Mentor Reward**: Mentors receive 100% of the booking credit cost upon session settlement. No platform fee in MVP.
- **Slot Granularity**: Bookings align to strict 30-minute boundaries (`:00` or `:30`). Duration options: 30, 60, 90, or 120 minutes.
- **Minimum Advance Notice**: Bookings must be scheduled at least 2 hours in advance of the current UTC time.
- **Completion Confirmation Window**: Learners have 72 hours from mentor completion request to confirm or dispute. After 72 hours, an automated worker/cron settles the booking.
- **Cancellation Policy**: Cancellations ≥ 24 hours prior to scheduled start release the learner's reserved credits back to available balance. Cancellations < 24 hours forfeit credits to the mentor as late cancellation compensation.
- **Default Timezone**: `Asia/Kolkata` (stored per user with user override capability).
- **Password Complexity**: Minimum 8 characters, at least one letter and one number, maximum 72 bytes (bcrypt limit).
- **Admin Assignment**: Admin accounts are created strictly via database seed script or CLI command. The API rejects client requests with role modifications.
- **Messaging Protocol**: REST-based messaging with client polling (10-second intervals) for P1. Socket.IO is reserved for P2.

#### 2. Architecture & Tech Stack (Locked in Section 2)
- **Backend**: Node.js (LTS/v24), Express (ES Modules), Mongoose, Zod schema validation.
- **Database**: MongoDB with replica set (required for transactions; in-memory replica set for automated tests).
- **Frontend**: React (Vite) + Tailwind CSS + React Router v6 + Context API + Axios wrapper with HTTP-only cookies (`credentials: 'include'`).
- **Security**: JWT dual-cookie strategy (`cl_access` 15 min, `cl_refresh` 7 days rotated and stored hashed in DB), bcrypt cost 12, helmet, rate limiting.
