// Core transaction types
export interface TransactionRequest {
  transaction: string; // hex-encoded transaction
  metadata?: any; // optional JSON metadata
}

export interface StoredTransaction {
  tx_id: string;
  encoded_transaction: string;
  json_metadata?: any;
  timestamp: Date;
  status: 'accepted';
  node_response?: any;
}

export interface VerificationResult {
  isValid: boolean;
  errors?: string[];
}

// API Response types
export interface TransactionResponse {
  tx_id: string;
  status: string;
  timestamp?: string;
}

export interface TransactionDetails {
  tx_id: string;
  status: string;
  transaction?: string;
  metadata?: any;
  timestamp?: string;
}

// Configuration types
export interface Config {
  port: number;
  nodePostTransactionUrl: string;
  nodeGetTransactionUrl?: string; // separate URL for GET requests if different
  dbPath: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

// Node communication types
export interface NodeSubmitResponse {
  tx_id?: string;
  txid?: string; // some nodes use different field names
  result?: string;
  error?: string;
}

export interface NodeGetResponse {
  tx_id?: string;
  txid?: string;
  transaction?: string;
  confirmations?: number;
  status?: string;
  [key: string]: any; // allow additional fields from node
}
