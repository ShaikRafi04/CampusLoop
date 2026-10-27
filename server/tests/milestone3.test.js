import request from 'supertest';
import app from '../src/app.js';
import { setupTestDB } from './setup.js';
import { User } from '../src/models/User.js';
import { CreditTransaction } from '../src/models/CreditTransaction.js';
import { Booking } from '../src/models/Booking.js';

describe('Milestone 3 Concurrency & Credit Settlement Tests', () => {
  setupTestDB();

  test('C-01: Overdraw test - concurrent accepts against limited credits: exactly one succeeds', async () => {
    // 1. Register Learner with initial grant
    const learnerRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Thrifty Learner',
      email: 'thrifty@campus.edu',
      password: 'Password123',
    });
    const learnerId = learnerRes.body.data.user._id;
    const learnerCookie = learnerRes.headers['set-cookie'].find((c) => c.startsWith('cl_access='));

    // Set learner available credits to exactly 10
    await User.updateOne({ _id: learnerId }, { $set: { 'wallet.available': 10 } });

    // 2. Register Mentor 1
    const m1Res = await request(app).post('/api/v1/auth/register').send({
      name: 'Mentor One',
      email: 'm1@campus.edu',
      password: 'Password123',
    });
    const m1Cookie = m1Res.headers['set-cookie'].find((c) => c.startsWith('cl_access='));

    // Mentor 1 creates offering for 10 credits
    const s1Res = await request(app).post('/api/v1/skills').set('Cookie', [m1Cookie]).send({
      title: 'Python Fast Track',
      description: 'Learn fast Python concepts',
      category: 'Programming',
      difficulty: 'BEGINNER',
      experienceYears: 1,
      durationMinutes: 30,
      creditCost: 10,
      format: 'ONLINE',
    });
    const s1Id = s1Res.body.data.skill._id;

    // 3. Register Mentor 2
    const m2Res = await request(app).post('/api/v1/auth/register').send({
      name: 'Mentor Two',
      email: 'm2@campus.edu',
      password: 'Password123',
    });
    const m2Cookie = m2Res.headers['set-cookie'].find((c) => c.startsWith('cl_access='));

    // Mentor 2 creates offering for 10 credits
    const s2Res = await request(app).post('/api/v1/skills').set('Cookie', [m2Cookie]).send({
      title: 'Java Fast Track',
      description: 'Learn fast Java concepts',
      category: 'Programming',
      difficulty: 'BEGINNER',
      experienceYears: 1,
      durationMinutes: 30,
      creditCost: 10,
      format: 'ONLINE',
    });
    const s2Id = s2Res.body.data.skill._id;

    // Learner creates two pending requests (at different times so no learner slot overlap)
    const time1 = new Date();
    time1.setDate(time1.getDate() + 3);
    time1.setUTCHours(10, 0, 0, 0);

    const time2 = new Date();
    time2.setDate(time2.getDate() + 3);
    time2.setUTCHours(14, 0, 0, 0);

    const b1Res = await request(app).post('/api/v1/bookings').set('Cookie', [learnerCookie]).send({
      skillId: s1Id,
      scheduledStart: time1.toISOString(),
      learningObjective: 'Python fundamentals',
    });
    const b1Id = b1Res.body.data.booking._id;

    const b2Res = await request(app).post('/api/v1/bookings').set('Cookie', [learnerCookie]).send({
      skillId: s2Id,
      scheduledStart: time2.toISOString(),
      learningObjective: 'Java fundamentals',
    });
    const b2Id = b2Res.body.data.booking._id;

    // 4. Concurrently accept both bookings
    const [res1, res2] = await Promise.all([
      request(app).patch(`/api/v1/bookings/${b1Id}/accept`).set('Cookie', [m1Cookie]),
      request(app).patch(`/api/v1/bookings/${b2Id}/accept`).set('Cookie', [m2Cookie]),
    ]);

    const successes = [res1, res2].filter((r) => r.status === 200);
    const failures = [res1, res2].filter((r) => r.status === 422);

    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);
    expect(failures[0].body.code).toBe('INSUFFICIENT_CREDITS');

    // Verify wallet: exactly 0 available, exactly 10 reserved
    const dbLearner = await User.findById(learnerId);
    expect(dbLearner.wallet.available).toBe(0);
    expect(dbLearner.wallet.reserved).toBe(10);
  });

  test('C-02: Double booking test - two learners request same slot, mentor accepts concurrently', async () => {
    // Mentor Alice
    const mRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Mentor Popular',
      email: 'popular@campus.edu',
      password: 'Password123',
    });
    const mentorId = mRes.body.data.user._id;
    const mentorCookie = mRes.headers['set-cookie'].find((c) => c.startsWith('cl_access='));

    const sRes = await request(app).post('/api/v1/skills').set('Cookie', [mentorCookie]).send({
      title: 'Competitive Coding',
      description: 'Intense algorithms session',
      category: 'Programming',
      difficulty: 'ADVANCED',
      experienceYears: 4,
      durationMinutes: 60,
      creditCost: 15,
      format: 'ONLINE',
    });
    const skillId = sRes.body.data.skill._id;

    // Learner A
    const lARes = await request(app).post('/api/v1/auth/register').send({
      name: 'Learner A',
      email: 'la@campus.edu',
      password: 'Password123',
    });
    const lACookie = lARes.headers['set-cookie'].find((c) => c.startsWith('cl_access='));

    // Learner B
    const lBRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Learner B',
      email: 'lb@campus.edu',
      password: 'Password123',
    });
    const lBCookie = lBRes.headers['set-cookie'].find((c) => c.startsWith('cl_access='));

    const slotTime = new Date();
    slotTime.setDate(slotTime.getDate() + 4);
    slotTime.setUTCHours(15, 0, 0, 0);

    const [reqA, reqB] = await Promise.all([
      request(app).post('/api/v1/bookings').set('Cookie', [lACookie]).send({
        skillId,
        scheduledStart: slotTime.toISOString(),
        learningObjective: 'Prep for ICPC',
      }),
      request(app).post('/api/v1/bookings').set('Cookie', [lBCookie]).send({
        skillId,
        scheduledStart: slotTime.toISOString(),
        learningObjective: 'Prep for Google interview',
      }),
    ]);

    const bAId = reqA.body.data.booking._id;
    const bBId = reqB.body.data.booking._id;

    // Mentor accepts both concurrently
    const [accA, accB] = await Promise.all([
      request(app).patch(`/api/v1/bookings/${bAId}/accept`).set('Cookie', [mentorCookie]),
      request(app).patch(`/api/v1/bookings/${bBId}/accept`).set('Cookie', [mentorCookie]),
    ]);

    const successCount = [accA, accB].filter((r) => r.status === 200).length;
    const conflictCount = [accA, accB].filter((r) => r.status === 409 && r.body.code === 'BOOKING_OVERLAP').length;

    expect(successCount).toBe(1);
    expect(conflictCount).toBe(1);
  });

  test('C-03: Duplicate settlement test - multiple concurrent confirm calls settle credits exactly once', async () => {
    // 1. Setup mentor and learner
    const mRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Mentor Settlement',
      email: 'mentor.settle@campus.edu',
      password: 'Password123',
    });
    const mentorId = mRes.body.data.user._id;
    const mentorCookie = mRes.headers['set-cookie'].find((c) => c.startsWith('cl_access='));

    const lRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Learner Settlement',
      email: 'learner.settle@campus.edu',
      password: 'Password123',
    });
    const learnerId = lRes.body.data.user._id;
    const learnerCookie = lRes.headers['set-cookie'].find((c) => c.startsWith('cl_access='));

    const sRes = await request(app).post('/api/v1/skills').set('Cookie', [mentorCookie]).send({
      title: 'Fullstack Deep Dive',
      description: 'End-to-end fullstack architecture',
      category: 'Programming',
      difficulty: 'INTERMEDIATE',
      experienceYears: 2,
      durationMinutes: 60,
      creditCost: 20,
      format: 'ONLINE',
    });
    const skillId = sRes.body.data.skill._id;

    const slotTime = new Date();
    slotTime.setDate(slotTime.getDate() + 3);
    slotTime.setUTCHours(10, 0, 0, 0);

    const bRes = await request(app).post('/api/v1/bookings').set('Cookie', [learnerCookie]).send({
      skillId,
      scheduledStart: slotTime.toISOString(),
      learningObjective: 'Understand transactions and concurrency',
    });
    const bookingId = bRes.body.data.booking._id;

    // Mentor accepts -> learner credits reserved (50 -> 30 avail, 20 reserved)
    await request(app).patch(`/api/v1/bookings/${bookingId}/accept`).set('Cookie', [mentorCookie]);

    // Force booking scheduledEnd to the past and completionRequestedAt set
    await Booking.updateOne(
      { _id: bookingId },
      {
        $set: {
          scheduledEnd: new Date(Date.now() - 10000),
          completionRequestedAt: new Date(Date.now() - 5000),
        },
      }
    );

    // 2. Fire 5 concurrent confirm requests from learner
    const confirmPromises = Array(5)
      .fill(null)
      .map(() => request(app).patch(`/api/v1/bookings/${bookingId}/confirm`).set('Cookie', [learnerCookie]));

    const responses = await Promise.all(confirmPromises);

    // All should return 200 (idempotent)
    responses.forEach((res) => {
      expect(res.status).toBe(200);
      expect(res.body.data.booking.status).toBe('COMPLETED');
    });

    // 3. Verify exactly ONE SESSION_REWARD row in the database
    const rewards = await CreditTransaction.find({
      bookingId,
      type: 'SESSION_REWARD',
    });
    expect(rewards.length).toBe(1);

    // 4. Verify balances:
    // Learner: 30 available, 0 reserved
    const dbLearner = await User.findById(learnerId);
    expect(dbLearner.wallet.available).toBe(30);
    expect(dbLearner.wallet.reserved).toBe(0);

    // Mentor: 50 initial + 20 earned = 70 available
    const dbMentor = await User.findById(mentorId);
    expect(dbMentor.wallet.available).toBe(70);
  });

  test('I-09: Reviews - after COMPLETED succeeds, before completion fails, duplicate fails', async () => {
    // Setup mentor and learner
    const mRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Mentor Reviews',
      email: 'm.reviews@campus.edu',
      password: 'Password123',
    });
    const mentorId = mRes.body.data.user._id;
    const mentorCookie = mRes.headers['set-cookie'].find((c) => c.startsWith('cl_access='));

    const lRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Learner Reviews',
      email: 'l.reviews@campus.edu',
      password: 'Password123',
    });
    const learnerCookie = lRes.headers['set-cookie'].find((c) => c.startsWith('cl_access='));

    const sRes = await request(app).post('/api/v1/skills').set('Cookie', [mentorCookie]).send({
      title: 'Database Design',
      description: 'Relational vs NoSQL',
      category: 'Programming',
      difficulty: 'INTERMEDIATE',
      experienceYears: 2,
      durationMinutes: 30,
      creditCost: 10,
      format: 'ONLINE',
    });
    const skillId = sRes.body.data.skill._id;

    const slotTime = new Date();
    slotTime.setDate(slotTime.getDate() + 3);
    slotTime.setUTCHours(10, 0, 0, 0);

    const bRes = await request(app).post('/api/v1/bookings').set('Cookie', [learnerCookie]).send({
      skillId,
      scheduledStart: slotTime.toISOString(),
      learningObjective: 'Database normal forms',
    });
    const bookingId = bRes.body.data.booking._id;

    // 1. Review before completion fails with 422 BUSINESS_RULE_VIOLATION
    const prematureReview = await request(app).post('/api/v1/reviews').set('Cookie', [learnerCookie]).send({
      bookingId,
      rating: 5,
      comment: 'Premature review attempt',
    });
    expect(prematureReview.status).toBe(422);
    expect(prematureReview.body.code).toBe('BUSINESS_RULE_VIOLATION');

    // 2. Complete session
    await request(app).patch(`/api/v1/bookings/${bookingId}/accept`).set('Cookie', [mentorCookie]);
    await Booking.updateOne(
      { _id: bookingId },
      {
        $set: {
          scheduledEnd: new Date(Date.now() - 10000),
          completionRequestedAt: new Date(Date.now() - 5000),
        },
      }
    );
    await request(app).patch(`/api/v1/bookings/${bookingId}/confirm`).set('Cookie', [learnerCookie]);

    // 3. Review after completion succeeds
    const reviewRes = await request(app).post('/api/v1/reviews').set('Cookie', [learnerCookie]).send({
      bookingId,
      rating: 5,
      comment: 'Outstanding session! Highly recommend this mentor.',
    });
    expect(reviewRes.status).toBe(201);
    expect(reviewRes.body.success).toBe(true);

    // Mentor rating summary recomputed
    const dbMentor = await User.findById(mentorId);
    expect(dbMentor.ratingSummary.count).toBe(1);
    expect(dbMentor.ratingSummary.average).toBe(5);

    // 4. Duplicate review fails with 409 DUPLICATE_REVIEW
    const dupReview = await request(app).post('/api/v1/reviews').set('Cookie', [learnerCookie]).send({
      bookingId,
      rating: 4,
      comment: 'Trying to review again',
    });
    expect(dupReview.status).toBe(409);
    expect(dupReview.body.code).toBe('DUPLICATE_REVIEW');
  });
});
