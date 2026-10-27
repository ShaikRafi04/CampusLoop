import request from 'supertest';
import app from '../src/app.js';
import { setupTestDB } from './setup.js';
import { User } from '../src/models/User.js';
import { CreditTransaction } from '../src/models/CreditTransaction.js';

describe('Milestone 1 Acceptance Tests', () => {
  setupTestDB();

  const studentA = {
    name: 'Alice Johnson',
    email: 'alice@campus.edu',
    password: 'Password123',
    college: 'Tech University',
    department: 'Computer Science',
    academicYear: 3,
  };

  const studentB = {
    name: 'Bob Smith',
    email: 'bob@campus.edu',
    password: 'Password456',
    college: 'Tech University',
    department: 'Mechanical',
    academicYear: 2,
  };

  test('I-01: Register -> Login -> /auth/me works and duplicate email rejected with 409', async () => {
    // 1. Register Alice
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send(studentA);

    expect(regRes.status).toBe(201);
    expect(regRes.body.success).toBe(true);
    expect(regRes.body.data.user.email).toBe(studentA.email.toLowerCase());
    expect(regRes.body.data.user.wallet.available).toBe(50);
    expect(regRes.body.data.user.wallet.reserved).toBe(0);
    expect(regRes.body.data.user.passwordHash).toBeUndefined();

    // Verify cookies set
    const cookies = regRes.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.some((c) => c.includes('cl_access'))).toBe(true);
    expect(cookies.some((c) => c.includes('cl_refresh'))).toBe(true);

    // Verify INITIAL_GRANT ledger transaction created
    const initialTx = await CreditTransaction.findOne({
      userId: regRes.body.data.user._id,
      type: 'INITIAL_GRANT',
    });
    expect(initialTx).toBeDefined();
    expect(initialTx.amount).toBe(50);
    expect(initialTx.idempotencyKey).toBe(`grant:${regRes.body.data.user._id}`);

    // 2. Reject duplicate email with 409
    const dupRes = await request(app)
      .post('/api/v1/auth/register')
      .send(studentA);

    expect(dupRes.status).toBe(409);
    expect(dupRes.body.success).toBe(false);
    expect(dupRes.body.code).toBe('EMAIL_TAKEN');

    // 3. Login
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: studentA.email, password: studentA.password });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data.accessToken).toBeDefined();

    const authCookie = loginRes.headers['set-cookie'].find((c) => c.startsWith('cl_access='));

    // 4. GET /auth/me
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', [authCookie]);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data.user.email).toBe(studentA.email.toLowerCase());
  });

  test('I-02: Login with wrong password returns 401 with identical message for unknown email', async () => {
    // Register Alice
    await request(app).post('/api/v1/auth/register').send(studentA);

    // Wrong password for existing user
    const wrongPassRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: studentA.email, password: 'WrongPassword99' });

    expect(wrongPassRes.status).toBe(401);
    expect(wrongPassRes.body.code).toBe('INVALID_CREDENTIALS');
    expect(wrongPassRes.body.message).toBe('Invalid email or password');

    // Unknown email
    const unknownEmailRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nonexistent@campus.edu', password: 'Password123' });

    expect(unknownEmailRes.status).toBe(401);
    expect(unknownEmailRes.body.code).toBe('INVALID_CREDENTIALS');
    expect(unknownEmailRes.body.message).toBe('Invalid email or password');
  });

  test('A-01: Unauthenticated request to protected route returns 401 UNAUTHENTICATED', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('UNAUTHENTICATED');
  });

  test('A-05: Client body with role: "ADMIN" on register or PATCH is stripped; role remains STUDENT', async () => {
    // Attempt privilege escalation during registration
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        ...studentA,
        role: 'ADMIN',
      });

    expect(regRes.status).toBe(201);
    expect(regRes.body.data.user.role).toBe('STUDENT');

    const authCookie = regRes.headers['set-cookie'].find((c) => c.startsWith('cl_access='));

    // Attempt privilege escalation during profile update
    const patchRes = await request(app)
      .patch('/api/v1/users/me')
      .set('Cookie', [authCookie])
      .send({
        role: 'ADMIN',
        bio: 'Updated bio',
      });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.user.role).toBe('STUDENT');
    expect(patchRes.body.data.user.bio).toBe('Updated bio');

    // Check DB directly
    const dbUser = await User.findById(regRes.body.data.user._id);
    expect(dbUser.role).toBe('STUDENT');
  });

  test('I-03 & A-03: Create offering; edit own; edit other returns 403 FORBIDDEN', async () => {
    // 1. Register Alice and Bob
    const regA = await request(app).post('/api/v1/auth/register').send(studentA);
    const cookieA = regA.headers['set-cookie'].find((c) => c.startsWith('cl_access='));

    const regB = await request(app).post('/api/v1/auth/register').send(studentB);
    const cookieB = regB.headers['set-cookie'].find((c) => c.startsWith('cl_access='));

    // 2. Alice creates a skill offering
    const skillPayload = {
      title: 'Python for Beginners',
      description: 'Learn the fundamentals of Python programming in a hands-on session.',
      category: 'Programming',
      difficulty: 'BEGINNER',
      experienceYears: 2,
      durationMinutes: 60,
      creditCost: 15,
      format: 'ONLINE',
      tags: ['python', 'coding'],
    };

    const createRes = await request(app)
      .post('/api/v1/skills')
      .set('Cookie', [cookieA])
      .send(skillPayload);

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    const skillId = createRes.body.data.skill._id;

    // 3. Alice edits her own offering
    const editRes = await request(app)
      .patch(`/api/v1/skills/${skillId}`)
      .set('Cookie', [cookieA])
      .send({
        creditCost: 20,
        title: 'Python for Data & Automation',
      });

    expect(editRes.status).toBe(200);
    expect(editRes.body.data.skill.creditCost).toBe(20);
    expect(editRes.body.data.skill.title).toBe('Python for Data & Automation');

    // 4. Bob tries to edit Alice's offering -> 403 FORBIDDEN
    const forbiddenRes = await request(app)
      .patch(`/api/v1/skills/${skillId}`)
      .set('Cookie', [cookieB])
      .send({
        title: 'Hacked Title',
      });

    expect(forbiddenRes.status).toBe(403);
    expect(forbiddenRes.body.code).toBe('FORBIDDEN');
  });
});
