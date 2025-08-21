import { Config } from './types';

export const config: Config = {
  port: parseInt(process.env.PORT || '3000'),
  nodeWebSocketUrl: process.env.NODE_WEBSOCKET_URL || 'ws://user:user@localhost:13030', // default Mintlayer node WebSocket with auth
  nodeGetTransactionUrl: process.env.NODE_GET_TRANSACTION_URL, // optional HTTP endpoint for confirmed transactions
  logLevel: (process.env.LOG_LEVEL as Config['logLevel']) || 'info',
  corsOrigins: process.env.CORS_ORIGINS // optional CORS origins
};

export function validateConfig(): void {
  if (!config.nodeWebSocketUrl) {
    throw new Error('NODE_WEBSOCKET_URL environment variable is required');
  }

  console.log('📋 Configuration loaded:');
  console.log(`   Port: ${config.port}`);
  console.log(`   Node WebSocket URL: ${config.nodeWebSocketUrl}`);
  console.log(`   Node GET URL: ${config.nodeGetTransactionUrl || 'not configured'}`);
  console.log(`   Log Level: ${config.logLevel}`);
  console.log(`   CORS Origins: ${config.corsOrigins || 'all origins allowed'}`);
}
