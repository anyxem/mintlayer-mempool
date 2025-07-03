import { Config } from './types';

export const config: Config = {
  port: parseInt(process.env.PORT || '3000'),
  nodePostTransactionUrl: process.env.NODE_POST_TRANSACTION_URL || 'http://localhost:3031', // default Mintlayer node
  nodeGetTransactionUrl: process.env.NODE_GET_TRANSACTION_URL, // optional separate GET endpoint
  dbPath: process.env.DB_PATH || './data/transactions.db',
  logLevel: (process.env.LOG_LEVEL as Config['logLevel']) || 'info'
};

export function validateConfig(): void {
  if (!config.nodePostTransactionUrl) {
    throw new Error('NODE_POST_TRANSACTION_URL environment variable is required');
  }

  console.log('📋 Configuration loaded:');
  console.log(`   Port: ${config.port}`);
  console.log(`   Node POST URL: ${config.nodePostTransactionUrl}`);
  console.log(`   Node GET URL: ${config.nodeGetTransactionUrl || 'same as POST URL'}`);
  console.log(`   Database: ${config.dbPath}`);
  console.log(`   Log Level: ${config.logLevel}`);
}
