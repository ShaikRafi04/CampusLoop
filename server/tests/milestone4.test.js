import request from 'supertest';
import app from '../src/app.js';
import { setupTestDB } from './setup.js';
import { User } from '../src/models/User.js';
import { AuditLog } from '../src/models/AuditLog.js';
import { CreditTransaction } from '../src/models/CreditTransaction.js';
import bcrypt from 'bcrypt';

describe('Milestone 4 Acceptance Tests: Admin & Security Hardening', () => {
  setupTestDB();

  let adminCookie, studentCookie;
  let adminId, studentId;

  beforeEach(async () => {
    // 1. Seed Admin user directly
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash('AdminPassword123', salt);
    const adminUser = await new User({
      name: 'System Admin',
      email: 'admin@campusloop.internal',
      passwordHash,
      role: 'ADMIN',
      wallet: { available: 1000, reserved: 0 },
    }).save();
    adminId = adminUser._id;

    // Login as Admin to get cookie
    const adminLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@campusloop.internal',
      password: 'AdminPassword123',
    });
    adminCookie = adminLogin.headers['set-cookie'].find((c) => c.startsWith('cl_access='));

    // 2. Register Student user
    const studentRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Regular Student',
      email: 'student@campus.edu',
      password: 'Password123',
    });
    studentId = studentRes.body.data.user._id;
    studentCookie = studentRes.headers['set-cookie'].find((c) => c.startsWith('cl_access='));
  });

  test('A-02: Student calling any admin route returns 403 FORBIDDEN', async () => {
    const res = await request(app).get('/api/v1/admin/overview').set('Cookie', [studentCookie]);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  test('I-11: Admin can suspend and reactivate user with AuditLog logging', async () => {
    // 1. Admin suspends student
    const suspendRes = await request(app)
      .patch(`/api/v1/admin/users/${studentId}/suspend`)
      .set('Cookie', [adminCookie])
      .send({ reason: 'Reported for policy violation' });

    expect(suspendRes.status).toBe(200);
    expect(suspendRes.body.data.user.isSuspended).toBe(true);

    // Verify AuditLog
    const auditEntry = await AuditLog.findOne({
      targetId: studentId,
      action: 'USER_SUSPENDED',
    });
    expect(auditEntry).toBeDefined();
    expect(auditEntry.details.reason).toBe('Reported for policy violation');

    // 2. Suspended student cannot perform write actions (e.g. creating offering)
    const writeRes = await request(app)
      .post('/api/v1/skills')
      .set('Cookie', [studentCookie])
      .send({
        title: 'Python for Fun',
        description: 'Learning python basics',
        category: 'Programming',
        difficulty: 'BEGINNER',
        experienceYears: 1,
        durationMinutes: 30,
        creditCost: 10,
        format: 'ONLINE',
      });
    expect(writeRes.status).toBe(403);
    expect(writeRes.body.code).toBe('ACCOUNT_SUSPENDED');

    // 3. Admin reactivates student
    const reactivateRes = await request(app)
      .patch(`/api/v1/admin/users/${studentId}/reactivate`)
      .set('Cookie', [adminCookie])
      .send({ reason: 'Issue resolved with student' });

    expect(reactivateRes.status).toBe(200);
    expect(reactivateRes.body.data.user.isSuspended).toBe(false);

    // Verify reactivation AuditLog
    const reactivateEntry = await AuditLog.findOne({
      targetId: studentId,
      action: 'USER_REACTIVATED',
    });
    expect(reactivateEntry).toBeDefined();
  });

  test('Admin credit adjustment updates wallet balance and creates ledger row', async () => {
    const adjRes = await request(app)
      .post(`/api/v1/admin/users/${studentId}/credit-adjustments`)
      .set('Cookie', [adminCookie])
      .send({
        amount: 25,
        reason: 'Compensation for system downtime',
      });

    expect(adjRes.status).toBe(200);
    expect(adjRes.body.data.user.wallet.available).toBe(75); // 50 initial + 25

    // Check CreditTransaction
    const tx = await CreditTransaction.findOne({
      userId: studentId,
      type: 'ADMIN_ADJUSTMENT',
    });
    expect(tx).toBeDefined();
    expect(tx.amount).toBe(25);
    expect(tx.direction).toBe('CREDIT');
  });

  test('Auto-confirm worker settles bookings requested > 72h ago', async () => {
    const { Booking } = await import('../src/models/Booking.js');
    const { autoConfirmExpiredBookings } = await import('../src/services/bookingService.js');

    // 1. Setup learner with reserved credits
    await User.updateOne(
      { _id: studentId },
      { $set: { 'wallet.available': 40, 'wallet.reserved': 10 } }
    );

    // 2. Setup mentor
    const mentor = await new User({
      name: 'Mentor Jane',
      email: 'jane@campus.edu',
      passwordHash: 'dummyhash',
      wallet: { available: 50, reserved: 0 },
    }).save();

    // 3. Create booking with completion requested 75 hours ago
    const seventyFiveHoursAgo = new Date(Date.now() - 75 * 60 * 60 * 1000);
    const booking = await new Booking({
      skillId: new (await import('mongoose')).default.Types.ObjectId(),
      skillTitle: 'Math 101',
      mentorId: mentor._id,
      learnerId: studentId,
      scheduledStart: new Date(seventyFiveHoursAgo.getTime() - 3600000),
      scheduledEnd: seventyFiveHoursAgo,
      durationMinutes: 60,
      creditCost: 10,
      format: 'ONLINE',
      learningObjective: 'Understand calculus principles',
      status: 'ACCEPTED',
      completionRequestedAt: seventyFiveHoursAgo,
    }).save();


    // 4. Run autoConfirm
    const result = await autoConfirmExpiredBookings(72);
    expect(result.processed).toBe(1);
    expect(result.settled).toBe(1);

    // 5. Verify booking completed
    const updatedBooking = await Booking.findById(booking._id);
    expect(updatedBooking.status).toBe('COMPLETED');
    expect(updatedBooking.completedAt).toBeDefined();

    // 6. Verify wallets
    const updatedLearner = await User.findById(studentId);
    expect(updatedLearner.wallet.reserved).toBe(0);

    const updatedMentor = await User.findById(mentor._id);
    expect(updatedMentor.wallet.available).toBe(60);
  });
});

