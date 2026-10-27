import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Skill } from '../models/Skill.js';
import { Availability } from '../models/Availability.js';
import { Booking } from '../models/Booking.js';
import { CreditTransaction } from '../models/CreditTransaction.js';
import { Review } from '../models/Review.js';
import { Goal } from '../models/Goal.js';
import { Notification } from '../models/Notification.js';
import {
  ROLES,
  SKILL_CATEGORIES,
  DIFFICULTY_LEVELS,
  SESSION_FORMATS,
  BOOKING_STATUS,
  TRANSACTION_TYPES,
  TRANSACTION_DIRECTIONS,
  TRANSACTION_STATUS,
  NOTIFICATION_TYPES,
  AVAILABILITY_TYPES,
} from '../config/enums.js';

export const seedDatabase = async () => {
  console.log('[Seed] Starting CampusLoop database initialization...');

  // 1. Clean existing seed records
  const seedEmails = ['admin@campusloop.internal', 'alice@campus.edu', 'bob@campus.edu'];
  const existingUsers = await User.find({ email: { $in: seedEmails } });
  const userIds = existingUsers.map((u) => u._id);

  if (userIds.length > 0) {
    await Skill.deleteMany({ ownerId: { $in: userIds } });
    await Availability.deleteMany({ mentorId: { $in: userIds } });
    await Booking.deleteMany({ $or: [{ learnerId: { $in: userIds } }, { mentorId: { $in: userIds } }] });
    await CreditTransaction.deleteMany({ userId: { $in: userIds } });
    await Review.deleteMany({ $or: [{ reviewerId: { $in: userIds } }, { revieweeId: { $in: userIds } }] });
    await Goal.deleteMany({ userId: { $in: userIds } });
    await Notification.deleteMany({ userId: { $in: userIds } });
    await User.deleteMany({ _id: { $in: userIds } });
    console.log('[Seed] Cleaned existing seed users and associated records.');
  }

  const salt = await bcrypt.genSalt(12);

  // 2. Create Platform Administrator
  const adminHash = await bcrypt.hash('AdminPassword123!', salt);
  const admin = await new User({
    name: 'Campus Admin',
    email: 'admin@campusloop.internal',
    passwordHash: adminHash,
    role: ROLES.ADMIN,
    college: 'Campus Administration',
    department: 'Student Affairs & Learning',
    bio: 'System administrator and peer learning program coordinator.',
    wallet: { available: 1000, reserved: 0 },
  }).save();

  await new CreditTransaction({
    userId: admin._id,
    type: TRANSACTION_TYPES.ADMIN_ADJUSTMENT,
    direction: TRANSACTION_DIRECTIONS.CREDIT,
    amount: 1000,
    balanceAfter: { available: 1000, reserved: 0 },
    status: TRANSACTION_STATUS.COMPLETED,
    idempotencyKey: `seed-admin-grant:${admin._id}`,
    description: 'System operational reserve credit grant',
  }).save();

  // 3. Create Student A: Alice Chen (Mentor / Active Tutor)
  // Alice taught 1 completed session (+10 credits), starting balance was 50 -> now 60
  const aliceHash = await bcrypt.hash('StudentPass123!', salt);
  const alice = await new User({
    name: 'Alice Chen',
    email: 'alice@campus.edu',
    studentId: 'STU-2026-001',
    passwordHash: aliceHash,
    role: ROLES.STUDENT,
    college: 'School of Engineering',
    department: 'Computer Science',
    yearOfStudy: 3,
    bio: 'Passionate about algorithms, python development, and deep learning systems.',
    interests: ['Python', 'Machine Learning', 'Data Structures', 'Web Development'],
    wallet: { available: 60, reserved: 0 },
    completedSessionsAsMentor: 1,
    ratingSummary: {
      average: 5.0,
      count: 1,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 },
    },
  }).save();

  await new CreditTransaction({
    userId: alice._id,
    type: TRANSACTION_TYPES.INITIAL_GRANT,
    direction: TRANSACTION_DIRECTIONS.CREDIT,
    amount: 50,
    balanceAfter: { available: 50, reserved: 0 },
    status: TRANSACTION_STATUS.COMPLETED,
    idempotencyKey: `seed-initial:${alice._id}`,
    description: 'Welcome credit grant on registration',
  }).save();

  // Alice Offerings
  const skillDsa = await new Skill({
    ownerId: alice._id,
    title: 'Data Structures & Algorithms in Python',
    category: 'Programming',
    description:
      'Master binary search trees, dynamic programming, and recursion patterns. Ideal for technical interview prep and coursework.',
    difficulty: DIFFICULTY_LEVELS.INTERMEDIATE,
    experienceYears: 2,
    durationMinutes: 60,
    creditCost: 10,
    format: SESSION_FORMATS.ONLINE,
    meetingLink: 'https://meet.google.com/xyz-campus-dsa',
    tags: ['python', 'algorithms', 'interviews', 'leetcode'],
    prerequisites: 'Basic Python syntax knowledge',
  }).save();

  const skillMl = await new Skill({
    ownerId: alice._id,
    title: 'Intro to Deep Learning with PyTorch',
    category: 'Data Science',
    description:
      'Hands-on guidance through neural network architectures, autograd, tensors, and training computer vision models.',
    difficulty: DIFFICULTY_LEVELS.ADVANCED,
    experienceYears: 1,
    durationMinutes: 60,
    creditCost: 15,
    format: SESSION_FORMATS.ONLINE,
    meetingLink: 'https://meet.google.com/abc-campus-pytorch',
    tags: ['ai', 'pytorch', 'deep-learning', 'math'],
    prerequisites: 'Multivariable calculus & Python basics',
  }).save();

  // Alice Availability Windows (Monday, Wednesday, Friday)
  await Availability.create([
    {
      mentorId: alice._id,
      type: AVAILABILITY_TYPES.WEEKLY,
      dayOfWeek: 1, // Monday
      startTime: '14:00',
      endTime: '18:00',
      isAvailable: true,
    },
    {
      mentorId: alice._id,
      type: AVAILABILITY_TYPES.WEEKLY,
      dayOfWeek: 3, // Wednesday
      startTime: '14:00',
      endTime: '18:00',
      isAvailable: true,
    },
    {
      mentorId: alice._id,
      type: AVAILABILITY_TYPES.WEEKLY,
      dayOfWeek: 5, // Friday
      startTime: '10:00',
      endTime: '13:00',
      isAvailable: true,
    },
  ]);

  // 4. Create Student B: Bob Miller (Learner)
  // Bob started with 50 credits, spent 10 on completed session, has 10 reserved for upcoming accepted session -> 30 available, 10 reserved
  const bobHash = await bcrypt.hash('StudentPass123!', salt);
  const bob = await new User({
    name: 'Bob Miller',
    email: 'bob@campus.edu',
    studentId: 'STU-2026-002',
    passwordHash: bobHash,
    role: ROLES.STUDENT,
    college: 'Faculty of Arts & Sciences',
    department: 'Mathematics & Statistics',
    yearOfStudy: 2,
    bio: 'Math major enthusiastic about computational statistics, combinatorics, and machine learning.',
    interests: ['Calculus', 'Probability', 'Python', 'Linear Algebra'],
    wallet: { available: 30, reserved: 10 },
    completedSessionsAsLearner: 1,
  }).save();

  await new CreditTransaction({
    userId: bob._id,
    type: TRANSACTION_TYPES.INITIAL_GRANT,
    direction: TRANSACTION_DIRECTIONS.CREDIT,
    amount: 50,
    balanceAfter: { available: 50, reserved: 0 },
    status: TRANSACTION_STATUS.COMPLETED,
    idempotencyKey: `seed-initial:${bob._id}`,
    description: 'Welcome credit grant on registration',
  }).save();

  // 5. Seed Bookings representing key lifecycle states
  // Booking 1: COMPLETED (3 days ago)
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const bookingCompleted = await new Booking({
    skillId: skillDsa._id,
    skillTitle: skillDsa.title,
    mentorId: alice._id,
    learnerId: bob._id,
    scheduledStart: new Date(threeDaysAgo.getTime() - 3600000),
    scheduledEnd: threeDaysAgo,
    durationMinutes: 60,
    creditCost: 10,
    format: SESSION_FORMATS.ONLINE,
    meetingLink: skillDsa.meetingLink,
    learningObjective: 'Master Binary Tree Traversals and Recursion Base Cases',
    status: BOOKING_STATUS.COMPLETED,
    completionRequestedAt: threeDaysAgo,
    completedAt: threeDaysAgo,
    statusHistory: [
      { from: BOOKING_STATUS.PENDING, to: BOOKING_STATUS.ACCEPTED, actorId: alice._id, at: new Date(threeDaysAgo.getTime() - 86400000), note: 'Accepted' },
      { from: BOOKING_STATUS.ACCEPTED, to: BOOKING_STATUS.COMPLETED, actorId: bob._id, at: threeDaysAgo, note: 'Learner confirmed session completion' },
    ],
  }).save();

  // Transactions for Booking 1
  await new CreditTransaction({
    userId: bob._id,
    bookingId: bookingCompleted._id,
    type: TRANSACTION_TYPES.SESSION_SETTLEMENT,
    direction: TRANSACTION_DIRECTIONS.DEBIT,
    amount: 10,
    balanceAfter: { available: 40, reserved: 0 },
    status: TRANSACTION_STATUS.COMPLETED,
    idempotencyKey: `settle-learner:${bookingCompleted._id}`,
    description: `Settled session: ${skillDsa.title}`,
  }).save();

  await new CreditTransaction({
    userId: alice._id,
    bookingId: bookingCompleted._id,
    type: TRANSACTION_TYPES.SESSION_REWARD,
    direction: TRANSACTION_DIRECTIONS.CREDIT,
    amount: 10,
    balanceAfter: { available: 60, reserved: 0 },
    status: TRANSACTION_STATUS.COMPLETED,
    idempotencyKey: `settle-mentor:${bookingCompleted._id}`,
    description: `Reward for mentoring: ${skillDsa.title}`,
  }).save();

  // Review for Booking 1
  await new Review({
    bookingId: bookingCompleted._id,
    skillId: skillDsa._id,
    reviewerId: bob._id,
    revieweeId: alice._id,
    rating: 5,
    comment:
      'Alice was exceptionally clear explaining recursion trees and tree traversals. Highly recommend for any CS students!',
  }).save();

  // Booking 2: ACCEPTED (Scheduled 2 days in the future)
  const twoDaysLater = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  const bookingAccepted = await new Booking({
    skillId: skillDsa._id,
    skillTitle: skillDsa.title,
    mentorId: alice._id,
    learnerId: bob._id,
    scheduledStart: twoDaysLater,
    scheduledEnd: new Date(twoDaysLater.getTime() + 3600000),
    durationMinutes: 60,
    creditCost: 10,
    format: SESSION_FORMATS.ONLINE,
    meetingLink: skillDsa.meetingLink,
    learningObjective: 'Deep dive into Dijkstra Algorithm and Priority Queues',
    status: BOOKING_STATUS.ACCEPTED,
    statusHistory: [
      { from: BOOKING_STATUS.PENDING, to: BOOKING_STATUS.ACCEPTED, actorId: alice._id, at: new Date(), note: 'Accepted by mentor' },
    ],
  }).save();

  // Reservation transaction for Booking 2
  await new CreditTransaction({
    userId: bob._id,
    bookingId: bookingAccepted._id,
    type: TRANSACTION_TYPES.RESERVATION,
    direction: TRANSACTION_DIRECTIONS.DEBIT,
    amount: 10,
    balanceAfter: { available: 30, reserved: 10 },
    status: TRANSACTION_STATUS.COMPLETED,
    idempotencyKey: `reserve:${bookingAccepted._id}`,
    description: `Credits reserved for session: ${skillDsa.title}`,
  }).save();

  // Booking 3: PENDING (Scheduled 4 days in future)
  const fourDaysLater = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);
  await new Booking({
    skillId: skillMl._id,
    skillTitle: skillMl.title,
    mentorId: alice._id,
    learnerId: bob._id,
    scheduledStart: fourDaysLater,
    scheduledEnd: new Date(fourDaysLater.getTime() + 3600000),
    durationMinutes: 60,
    creditCost: 15,
    format: SESSION_FORMATS.ONLINE,
    learningObjective: 'Understand backpropagation math and tensor operations in PyTorch',
    status: BOOKING_STATUS.PENDING,
    statusHistory: [
      { from: 'INITIAL', to: BOOKING_STATUS.PENDING, actorId: bob._id, at: new Date(), note: 'Booking requested by learner' },
    ],
  }).save();


  // 6. Seed Learning Goals for Bob
  await new Goal({
    userId: bob._id,
    title: 'Master Graph Algorithms & Dynamic Programming',
    skillName: 'Algorithms & Problem Solving',
    description: 'Preparing for competitive programming semester contests.',
    targetSessions: 3,
    completedSessions: 1,
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    status: 'IN_PROGRESS',
  }).save();


  // 7. Seed Notifications
  await new Notification({
    userId: alice._id,
    type: NOTIFICATION_TYPES.BOOKING_REQUESTED,
    title: 'New Session Request',
    message: 'Bob Miller requested a session for "Intro to Deep Learning with PyTorch".',
    relatedResourceId: skillMl._id,
  }).save();

  await new Notification({
    userId: bob._id,
    type: NOTIFICATION_TYPES.BOOKING_ACCEPTED,
    title: 'Session Accepted!',
    message: 'Alice Chen accepted your booking for "Data Structures & Algorithms in Python".',
    relatedResourceId: bookingAccepted._id,
  }).save();

  console.log('\n=============================================================');
  console.log('✅ CampusLoop Database Seed Completed Successfully!');
  console.log('=============================================================');
  console.log('Seeded Users:');
  console.log('1. Admin:');
  console.log('   Email:    admin@campusloop.internal');
  console.log('   Password: AdminPassword123!');
  console.log('   Role:     ADMIN (Wallet: 1000 credits)');
  console.log('2. Student A (Mentor):');
  console.log('   Email:    alice@campus.edu');
  console.log('   Password: StudentPass123!');
  console.log('   Role:     STUDENT (Wallet: 60 credits, 2 skills offered)');
  console.log('3. Student B (Learner):');
  console.log('   Email:    bob@campus.edu');
  console.log('   Password: StudentPass123!');
  console.log('   Role:     STUDENT (Wallet: 30 available, 10 reserved)');
  console.log('Bookings:    3 total (1 COMPLETED, 1 ACCEPTED, 1 PENDING)');
  console.log('Reviews:     1 5-star review created');
  console.log('Goals:       1 active learning goal for Bob');
  console.log('=============================================================\n');
};

// Run script if invoked directly
if (process.argv[1]?.endsWith('seed.js')) {
  (async () => {
    try {
      await connectDB();
      await seedDatabase();
      await disconnectDB();
      process.exit(0);
    } catch (err) {
      console.error('[Seed] Fatal error:', err);
      process.exit(1);
    }
  })();
}
