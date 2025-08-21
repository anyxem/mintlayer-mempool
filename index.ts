// Load environment variables for production
if (process.env.NODE_ENV === 'production') {
  require('dotenv').config({ path: '.env.production' });
}

import { startServer } from './src/api-server';
import { webSocketClient } from './src/websocket-client';

// Graceful shutdown handler
async function gracefulShutdown(signal: string) {
  console.log(`🛑 ${signal} received, shutting down gracefully`);

  try {
    // Close WebSocket connection
    await webSocketClient.close();
    console.log('✅ WebSocket connection closed');

    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Start the server
startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
