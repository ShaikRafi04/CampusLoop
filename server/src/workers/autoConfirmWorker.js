import { connectDB, disconnectDB } from '../config/db.js';
import { autoConfirmExpiredBookings } from '../services/bookingService.js';

export const runAutoConfirmJob = async () => {
  console.log('[AutoConfirmWorker] Starting scan for bookings pending learner confirmation > 72h...');
  try {
    const results = await autoConfirmExpiredBookings(72);
    console.log(`[AutoConfirmWorker] Scan completed: ${results.processed} inspected, ${results.settled} settled.`);
    if (results.errors.length > 0) {
      console.error('[AutoConfirmWorker] Errors encountered during processing:', results.errors);
    }
    return results;
  } catch (err) {
    console.error('[AutoConfirmWorker] Critical job error:', err);
    throw err;
  }
};

// If run directly from CLI (e.g., node src/workers/autoConfirmWorker.js or cron container)
if (process.argv[1]?.endsWith('autoConfirmWorker.js')) {
  (async () => {
    let exitCode = 0;
    try {
      await connectDB();
      const results = await runAutoConfirmJob();
      if (results.errors.length > 0) {
        exitCode = 1;
      }
    } catch (err) {
      console.error('[AutoConfirmWorker] Fatal CLI runner error:', err);
      exitCode = 1;
    } finally {
      await disconnectDB();
    }
    process.exitCode = exitCode;
  })();
}
