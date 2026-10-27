import app from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { ENV } from './config/env.js';

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(ENV.PORT, () => {
      console.log(`[Server] CampusLoop backend running on port ${ENV.PORT} in ${ENV.NODE_ENV} mode`);
    });

    const shutdown = async (signal) => {
      console.log(`[Server] Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await disconnectDB();
        console.log('[Server] Process terminated.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('[Server] Fatal startup error:', err);
    process.exit(1);
  }
};

startServer();
