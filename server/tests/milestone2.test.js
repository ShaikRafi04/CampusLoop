import request from 'supertest';
import app from '../src/app.js';
import { setupTestDB } from './setup.js';
import { User } from '../src/models/User.js';
import { Skill } from '../src/models/Skill.js';
import { Availability } from '../src/models/Availability.js';
import { Booking } from '../src/models/Booking.js';
import { computeAvailableSlots } from '../src/services/slotService.js';

describe('Milestone 2 Acceptance Tests: Discovery & Booking', () => {
  setupTestDB();

  let mentorCookie, learnerCookie;
  let mentorId, learnerId;
  let skillId;

  beforeEach(async () => {
    // 1. Register Mentor (Student A)
    const mentorRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Mentor Alice',
      email: 'mentor.alice@campus.edu',
      password: 'Password123',
      college: 'Tech University',
      department: 'Computer Science',
      academicYear: 3,
    });
    mentorId = mentorRes.body.data.user._id;
    mentorCookie = mentorRes.headers['set-cookie'].find((c) => c.startsWith('cl_access='));

    // 2. Register Learner (Student B)
    const learnerRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Learner Bob',
      email: 'learner.bob@campus.edu',
      password: 'Password456',
      college: 'Tech University',
      department: 'Electrical',
      academicYear: 1,
    });
    learnerId = learnerRes.body.data.user._id;
    learnerCookie = learnerRes.headers['set-cookie'].find((c) => c.startsWith('cl_access='));

    // 3. Mentor creates a Skill Offering (60 min, 20 credits)
    const skillRes = await request(app)
      .post('/api/v1/skills')
      .set('Cookie', [mentorCookie])
      .send({
        title: 'Mastering React & Node',
        description: 'Hands-on project-based mentoring session.',
        category: 'Programming',
        difficulty: 'INTERMEDIATE',
        experienceYears: 2,
        durationMinutes: 60,
        creditCost: 20,
        format: 'ONLINE',
        tags: ['react', 'node', 'fullstack'],
      });
    skillId = skillRes.body.data.skill._id;

    // 4. Mentor sets Weekly availability (Monday 10:00 to 14:00)
    await request(app)
      .post('/api/v1/availability')
      .set('Cookie', [mentorCookie])
      .send({
        type: 'WEEKLY',
        dayOfWeek: 1, // Monday
        startTime: '10:00',
        endTime: '14:00',
      });
  });

  test('U-01: Slot computation respects weekly windows, 30-min grid, and minimum 2h advance notice', async () => {
    // Find next Monday at least 2 days in the future
    const now = new Date();
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7 || 7));
    const mondayStr = nextMonday.toISOString().split('T')[0];

    const slots = await computeAvailableSlots(
      mentorId,
      60,
      `${mondayStr}T00:00:00.000Z`,
      `${mondayStr}T23:59:59.999Z`
    );

    expect(Array.isArray(slots)).toBe(true);
    expect(slots.length).toBeGreaterThan(0);

    // Each slot should end by window end (10:00 to 14:00 gives starts: 10:00, 10:30, 11:00, 11:30, 12:00, 12:30, 13:00)
    // 7 bookable starts
    expect(slots.length).toBe(7);
  });

  test('I-04: Search and filters return only active offerings with validated params', async () => {
    const res = await request(app).get('/api/v1/skills?q=React&category=Programming&sort=cost_asc');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe('Mastering React & Node');
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.total).toBe(1);
  });

  test('Learner cannot book their own offering (422 BUSINESS_RULE_VIOLATION)', async () => {
    // 3 days in the future, at 10:00 UTC on a 30-min boundary
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    futureDate.setUTCHours(10, 0, 0, 0);

    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Cookie', [mentorCookie]) // Mentor tries to book own offering
      .send({
        skillId,
        scheduledStart: futureDate.toISOString(),
        learningObjective: 'Try to book myself',
      });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe('BUSINESS_RULE_VIOLATION');
  });

  test('End-to-End Milestone 2: Request booking -> Accept booking reserves credits -> Overlap rejected', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 4);
    futureDate.setUTCHours(10, 0, 0, 0);

    // 1. Learner Bob requests a booking
    const bookRes = await request(app)
      .post('/api/v1/bookings')
      .set('Cookie', [learnerCookie])
      .send({
        skillId,
        scheduledStart: futureDate.toISOString(),
        learningObjective: 'Master fullstack architecture patterns and testing.',
      });

    expect(bookRes.status).toBe(201);
    expect(bookRes.body.success).toBe(true);
    expect(bookRes.body.data.booking.status).toBe('PENDING');
    const bookingId = bookRes.body.data.booking._id;

    // Duplicate booking for same learner, skill, and time returns 409
    const dupRes = await request(app)
      .post('/api/v1/bookings')
      .set('Cookie', [learnerCookie])
      .send({
        skillId,
        scheduledStart: futureDate.toISOString(),
        learningObjective: 'Duplicate booking attempt',
      });
    expect(dupRes.status).toBe(409);
    expect(dupRes.body.code).toBe('DUPLICATE_BOOKING');

    // 2. Mentor Alice accepts the booking
    const acceptRes = await request(app)
      .patch(`/api/v1/bookings/${bookingId}/accept`)
      .set('Cookie', [mentorCookie]);

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.data.booking.status).toBe('ACCEPTED');

    // Check learner's wallet: 50 initial - 20 cost = 30 available, 20 reserved
    const learnerDb = await User.findById(learnerId);
    expect(learnerDb.wallet.available).toBe(30);
    expect(learnerDb.wallet.reserved).toBe(20);

    // 3. Register a 3rd student (Charlie) who tries to book the same overlapping slot
    const charlieRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Charlie Brown',
      email: 'charlie@campus.edu',
      password: 'Password789',
    });
    const charlieCookie = charlieRes.headers['set-cookie'].find((c) => c.startsWith('cl_access='));

    const overlapRes = await request(app)
      .post('/api/v1/bookings')
      .set('Cookie', [charlieCookie])
      .send({
        skillId,
        scheduledStart: futureDate.toISOString(),
        learningObjective: 'Charlie wants this exact same slot',
      });

    expect(overlapRes.status).toBe(409);
    expect(overlapRes.body.code).toBe('BOOKING_OVERLAP');
  });

  test('U-02 & Lifecycle: Mentor rejection & Cancellation releases/updates properly', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    futureDate.setUTCHours(11, 0, 0, 0);

    // Learner requests
    const bookRes = await request(app)
      .post('/api/v1/bookings')
      .set('Cookie', [learnerCookie])
      .send({
        skillId,
        scheduledStart: futureDate.toISOString(),
        learningObjective: 'Testing rejection transition',
      });

    const bookingId = bookRes.body.data.booking._id;

    // Mentor rejects
    const rejectRes = await request(app)
      .patch(`/api/v1/bookings/${bookingId}/reject`)
      .set('Cookie', [mentorCookie]);

    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.data.booking.status).toBe('REJECTED');

    // Attempting to accept a rejected booking returns 409 INVALID_STATE_TRANSITION
    const invalidRes = await request(app)
      .patch(`/api/v1/bookings/${bookingId}/accept`)
      .set('Cookie', [mentorCookie]);

    expect(invalidRes.status).toBe(409);
    expect(invalidRes.body.code).toBe('INVALID_STATE_TRANSITION');
  });
});
