// API Response types
export interface TransactionDetails {
  tx_id: string;
  status: string;
  transaction?: string;
  decoded?: any;
  source?: string;
  timestamp?: number; // Unix timestamp in seconds
}

// Configuration types
export interface Config {
  port: number;
  nodeWebSocketUrl: string; // WebSocket URL for mempool queries
  nodeGetTransactionUrl?: string; // HTTP URL for confirmed transaction queries
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  corsOrigins?: string; // comma-separated list of allowed origins
}

// Node communication types
export interface NodeGetResponse {
  tx_id?: string;
  txid?: string;
  id?: string; // Mintlayer node uses 'id'
  transaction?: string;
  confirmations?: number;
  status?: string;
  [key: string]: any; // allow additional fields from node
}
