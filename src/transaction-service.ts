import { TransactionRequest, StoredTransaction, TransactionDetails } from './types';
import { transactionDb } from './database';
import { TransactionVerifier } from './verification';

export class TransactionService {
  
  /**
   * Process a new transaction submission
   * @param request - Transaction request (raw or JSON)
   * @param nodeResponse - Response from the blockchain node
   * @returns Stored transaction data
   */
  async processTransaction(
    request: TransactionRequest, 
    nodeResponse: any
  ): Promise<TransactionDetails> {
    console.log('🔄 Processing transaction submission...');
    
    // Extract tx_id from node response (handle different field names)
    const tx_id = nodeResponse.tx_id || nodeResponse.txid || nodeResponse.result;
    
    if (!tx_id) {
      throw new Error('No transaction ID received from node');
    }

    // Verify the transaction
    const verification = TransactionVerifier.verifyTransaction(
      request.transaction, 
      request.metadata
    );
    
    if (!verification.isValid) {
      throw new Error(`Transaction verification failed: ${verification.errors?.join(', ')}`);
    }

    // Prepare transaction for storage
    const storedTransaction: Omit<StoredTransaction, 'timestamp'> = {
      tx_id,
      encoded_transaction: request.transaction,
      json_metadata: request.metadata,
      status: 'accepted',
      node_response: nodeResponse
    };

    // Save to database
    await transactionDb.saveTransaction(storedTransaction);

    console.log(`✅ Transaction processed successfully: ${tx_id}`);
    
    return {
      tx_id,
      status: 'accepted',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get transaction details with fallback logic
   * 1. First check if it exists in local storage (mempool)
   * 2. If found, return local data with metadata
   * 3. If not found locally, it might be confirmed (removed from mempool)
   * @param tx_id - Transaction ID to lookup
   * @returns Transaction details or null if not found
   */
  async getTransactionDetails(tx_id: string): Promise<TransactionDetails | null> {
    console.log(`🔍 Looking up transaction: ${tx_id}`);
    
    // Check local storage first (mempool)
    const localTransaction = await transactionDb.getTransaction(tx_id);
    
    if (localTransaction) {
      console.log(`📋 Found transaction in mempool: ${tx_id}`);
      
      return {
        tx_id: localTransaction.tx_id,
        status: localTransaction.status,
        transaction: localTransaction.encoded_transaction,
        metadata: localTransaction.json_metadata,
        timestamp: localTransaction.timestamp.toISOString()
      };
    }

    console.log(`❓ Transaction not found in mempool: ${tx_id}`);
    return null;
  }

  /**
   * Get all pending transactions (mempool contents)
   */
  async getPendingTransactions(): Promise<TransactionDetails[]> {
    console.log('📋 Retrieving all pending transactions...');
    
    const pendingTransactions = await transactionDb.getPendingTransactions();
    
    return pendingTransactions.map(tx => ({
      tx_id: tx.tx_id,
      status: tx.status,
      transaction: tx.encoded_transaction,
      metadata: tx.json_metadata,
      timestamp: tx.timestamp.toISOString()
    }));
  }

  /**
   * Remove transaction from mempool (called when transaction is confirmed)
   * This would typically be called by a background process that monitors confirmations
   */
  async removeConfirmedTransaction(tx_id: string): Promise<boolean> {
    console.log(`🗑️ Removing confirmed transaction from mempool: ${tx_id}`);
    return await transactionDb.removeTransaction(tx_id);
  }

  /**
   * Get mempool statistics
   */
  async getMempoolStats(): Promise<{ count: number }> {
    const count = await transactionDb.getTransactionCount();
    return { count };
  }

  /**
   * Parse transaction request from different input formats
   */
  static parseTransactionRequest(body: any, contentType: string): TransactionRequest {
    if (contentType.includes('application/json')) {
      // JSON payload format
      if (typeof body === 'object' && body.transaction) {
        return {
          transaction: body.transaction,
          metadata: body.metadata
        };
      } else {
        throw new Error('Invalid JSON format: missing transaction field');
      }
    } else if (contentType.includes('text/plain')) {
      // Raw transaction format
      if (typeof body === 'string') {
        return {
          transaction: body.trim()
        };
      } else {
        throw new Error('Invalid raw transaction format: expected string');
      }
    } else {
      throw new Error(`Unsupported content type: ${contentType}`);
    }
  }
}
