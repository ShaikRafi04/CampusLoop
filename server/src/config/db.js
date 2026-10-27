import mongoose from 'mongoose';
import { ENV } from './env.js';

let mongod = null;

export const connectDB = async () => {
  let uri = ENV.MONGODB_URI;

  try {
    // Attempt connecting to the configured URI
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[DB] Connected to MongoDB at ${uri}`);
  } catch (err) {
    if (ENV.NODE_ENV === 'development') {
      console.warn(`[DB] Could not connect to ${uri}. Initializing local in-memory replica set for development...`);
      try {
        const { MongoMemoryReplSet } = await import('mongodb-memory-server');
        mongod = await MongoMemoryReplSet.create({
          replSet: { count: 1, storageEngine: 'wiredTiger' },
        });
        uri = mongod.getUri();
        await mongoose.connect(uri);
        console.log(`[DB] Connected to in-memory replica set at ${uri}`);
      } catch (memErr) {
        console.error('[DB] Failed to launch in-memory replica set:', memErr);
        throw err;
      }
    } else {
      console.error('[DB] MongoDB connection failed:', err);
      throw err;
    }
  }

  // Verify transaction support
  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    await session.abortTransaction();
    await session.endSession();
    console.log('[DB] MongoDB Replica Set verified: Transactions supported.');
  } catch (txErr) {
    console.error('[DB] FATAL: Replica set transactions are NOT supported by this MongoDB instance.', txErr.message);
    if (ENV.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.warn('[DB] WARNING: Running without replica set transactions in dev mode.');
    }
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
  } catch (err) {
    console.error('[DB] Disconnect error:', err);
  }
};
