// Core transaction types
export interface TransactionRequest {
  transaction: string; // hex-encoded transaction
  metadata?: TransactionMetadata; // standardized metadata format only
}

export interface StoredTransaction {
  tx_id: string;
  encoded_transaction: string;
  json_metadata?: TransactionMetadata;
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
  timestamp?: number; // Unix timestamp in seconds
}

export interface TransactionDetails {
  tx_id: string;
  status: string;
  transaction?: string;
  metadata?: TransactionMetadata;
  timestamp?: number; // Unix timestamp in seconds
}

// Standardized transaction metadata types (Phase 1: Shallow validation)
export interface TransactionMetadata {
  inputs: any[];
  outputs: any[];
  fee: {
    atoms: string;
    decimal: string;
  };
  id: string;
}

// Configuration types
export interface Config {
  port: number;
  nodePostTransactionUrl: string;
  nodeGetTransactionUrl?: string; // separate URL for GET requests if different
  dbPath: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  corsOrigins?: string; // comma-separated list of allowed origins
}

// Node communication types
export interface NodeSubmitResponse {
  tx_id?: string;
  txid?: string; // some nodes use different field names
  id?: string; // Mintlayer node uses 'id'
  result?: string;
  error?: string;
}

export interface NodeGetResponse {
  tx_id?: string;
  txid?: string;
  id?: string; // Mintlayer node uses 'id'
  transaction?: string;
  confirmations?: number;
  status?: string;
  [key: string]: any; // allow additional fields from node
}
