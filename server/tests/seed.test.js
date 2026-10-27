import { setupTestDB } from './setup.js';
import { seedDatabase } from '../src/scripts/seed.js';
import { User } from '../src/models/User.js';
import { Skill } from '../src/models/Skill.js';
import { Booking } from '../src/models/Booking.js';
import { CreditTransaction } from '../src/models/CreditTransaction.js';
import { Review } from '../src/models/Review.js';
import { Goal } from '../src/models/Goal.js';
import { Availability } from '../src/models/Availability.js';

describe('Seed Script Verification', () => {
  setupTestDB();

  test('seedDatabase runs cleanly and populates all required entities', async () => {
    await seedDatabase();

    // Verify Users
    const admin = await User.findOne({ email: 'admin@campusloop.internal' });
    expect(admin).toBeDefined();
    expect(admin.role).toBe('ADMIN');
    expect(admin.wallet.available).toBe(1000);

    const alice = await User.findOne({ email: 'alice@campus.edu' });
    expect(alice).toBeDefined();
    expect(alice.role).toBe('STUDENT');
    expect(alice.wallet.available).toBe(60);
    expect(alice.ratingSummary.average).toBe(5);

    const bob = await User.findOne({ email: 'bob@campus.edu' });
    expect(bob).toBeDefined();
    expect(bob.role).toBe('STUDENT');
    expect(bob.wallet.available).toBe(30);
    expect(bob.wallet.reserved).toBe(10);

    // Verify Skills
    const skills = await Skill.find({ ownerId: alice._id });
    expect(skills.length).toBe(2);

    // Verify Availability
    const availabilities = await Availability.find({ mentorId: alice._id });
    expect(availabilities.length).toBe(3);


    // Verify Bookings (COMPLETED, ACCEPTED, PENDING)
    const bookings = await Booking.find({ learnerId: bob._id });
    expect(bookings.length).toBe(3);
    const statuses = bookings.map((b) => b.status);
    expect(statuses).toContain('COMPLETED');
    expect(statuses).toContain('ACCEPTED');
    expect(statuses).toContain('PENDING');

    // Verify Ledger transactions
    const txs = await CreditTransaction.find();
    expect(txs.length).toBeGreaterThanOrEqual(6);

    // Verify Review
    const review = await Review.findOne({ reviewerId: bob._id });
    expect(review).toBeDefined();
    expect(review.rating).toBe(5);

    // Verify Goal
    const goal = await Goal.findOne({ userId: bob._id });
    expect(goal).toBeDefined();
    expect(goal.targetSessions).toBe(3);
    expect(goal.completedSessions).toBe(1);
  });
});
