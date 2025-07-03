import { TransactionService } from './transaction-service';
import { NodeClient } from './node-client';
import { config } from './config';

export interface CleanupConfig {
  intervalMs: number; // How often to run cleanup (milliseconds)
  batchSize: number; // How many transactions to check per batch
  maxAge: number; // Maximum age of transactions to keep checking (hours)
  enabled: boolean; // Whether cleanup is enabled
}

export class MempoolCleaner {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private cleanupConfig: CleanupConfig;
  private transactionService: TransactionService;

  constructor(cleanupConfig?: Partial<CleanupConfig>) {
    this.cleanupConfig = {
      intervalMs: parseInt(process.env.CLEANUP_INTERVAL_MS || '300000'), // 5 minutes default
      batchSize: parseInt(process.env.CLEANUP_BATCH_SIZE || '50'), // 50 transactions per batch
      maxAge: parseInt(process.env.CLEANUP_MAX_AGE_HOURS || '24'), // 24 hours default
      enabled: process.env.CLEANUP_ENABLED !== 'false', // enabled by default
      ...cleanupConfig
    };
    
    this.transactionService = new TransactionService();
    
    console.log('🧹 Mempool Cleaner initialized:');
    console.log(`   Enabled: ${this.cleanupConfig.enabled}`);
    console.log(`   Interval: ${this.cleanupConfig.intervalMs / 1000}s`);
    console.log(`   Batch Size: ${this.cleanupConfig.batchSize}`);
    console.log(`   Max Age: ${this.cleanupConfig.maxAge}h`);
  }

  /**
   * Start the background cleanup process
   */
  start(): void {
    if (!this.cleanupConfig.enabled) {
      console.log('🧹 Mempool cleanup is disabled');
      return;
    }

    if (this.intervalId) {
      console.log('⚠️ Mempool cleaner is already running');
      return;
    }

    console.log('🚀 Starting mempool cleanup process...');
    
    // Run initial cleanup
    this.runCleanup().catch(error => {
      console.error('❌ Initial cleanup failed:', error.message);
    });

    // Schedule periodic cleanup
    this.intervalId = setInterval(() => {
      this.runCleanup().catch(error => {
        console.error('❌ Scheduled cleanup failed:', error.message);
      });
    }, this.cleanupConfig.intervalMs);

    console.log(`✅ Mempool cleaner started (interval: ${this.cleanupConfig.intervalMs / 1000}s)`);
  }

  /**
   * Stop the background cleanup process
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 Mempool cleaner stopped');
    }
  }

  /**
   * Run a single cleanup cycle
   */
  async runCleanup(): Promise<{ checked: number; confirmed: number; removed: number; errors: number }> {
    if (this.isRunning) {
      console.log('⏳ Cleanup already in progress, skipping...');
      return { checked: 0, confirmed: 0, removed: 0, errors: 0 };
    }

    this.isRunning = true;
    const startTime = Date.now();
    
    try {
      console.log('🧹 Starting mempool cleanup cycle...');
      
      // Get all pending transactions
      const pendingTransactions = await this.transactionService.getPendingTransactions();
      
      if (pendingTransactions.length === 0) {
        console.log('✅ Mempool is empty, nothing to clean');
        return { checked: 0, confirmed: 0, removed: 0, errors: 0 };
      }

      console.log(`📋 Found ${pendingTransactions.length} pending transactions to check`);

      // Filter transactions by age (don't check very old ones repeatedly)
      const cutoffTime = new Date(Date.now() - (this.cleanupConfig.maxAge * 60 * 60 * 1000));
      const transactionsToCheck = pendingTransactions.filter(tx => 
        new Date(tx.timestamp!) > cutoffTime
      );

      if (transactionsToCheck.length < pendingTransactions.length) {
        console.log(`⏰ Filtered out ${pendingTransactions.length - transactionsToCheck.length} old transactions`);
      }

      // Process in batches
      let totalChecked = 0;
      let totalConfirmed = 0;
      let totalRemoved = 0;
      let totalErrors = 0;

      for (let i = 0; i < transactionsToCheck.length; i += this.cleanupConfig.batchSize) {
        const batch = transactionsToCheck.slice(i, i + this.cleanupConfig.batchSize);
        const batchResult = await this.processBatch(batch);
        
        totalChecked += batchResult.checked;
        totalConfirmed += batchResult.confirmed;
        totalRemoved += batchResult.removed;
        totalErrors += batchResult.errors;

        // Small delay between batches to avoid overwhelming the node
        if (i + this.cleanupConfig.batchSize < transactionsToCheck.length) {
          await this.delay(1000); // 1 second delay
        }
      }

      const duration = Date.now() - startTime;
      console.log(`✅ Cleanup cycle completed in ${duration}ms:`);
      console.log(`   Checked: ${totalChecked} transactions`);
      console.log(`   Confirmed: ${totalConfirmed} transactions`);
      console.log(`   Removed: ${totalRemoved} transactions`);
      console.log(`   Errors: ${totalErrors} transactions`);

      return {
        checked: totalChecked,
        confirmed: totalConfirmed,
        removed: totalRemoved,
        errors: totalErrors
      };

    } catch (error: any) {
      console.error('❌ Cleanup cycle failed:', error.message);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Process a batch of transactions
   */
  private async processBatch(transactions: any[]): Promise<{ checked: number; confirmed: number; removed: number; errors: number }> {
    let checked = 0;
    let confirmed = 0;
    let removed = 0;
    let errors = 0;

    console.log(`🔍 Processing batch of ${transactions.length} transactions...`);

    for (const tx of transactions) {
      try {
        checked++;
        
        // Check if transaction is confirmed on the node
        const nodeTransaction = await NodeClient.getTransaction(tx.tx_id);
        
        if (nodeTransaction) {
          // Transaction is confirmed, remove from mempool
          console.log(`✅ Transaction confirmed: ${tx.tx_id}`);
          confirmed++;
          
          const wasRemoved = await this.transactionService.removeConfirmedTransaction(tx.tx_id);
          if (wasRemoved) {
            removed++;
          }
        } else {
          // Transaction still pending, keep in mempool
          console.log(`⏳ Transaction still pending: ${tx.tx_id}`);
        }

      } catch (error: any) {
        errors++;
        console.error(`❌ Error checking transaction ${tx.tx_id}:`, error.message);
        
        // If it's a 404, the transaction might not exist on the node
        // This could mean it was rejected or is still in node's mempool
        if (error.message.includes('404') || error.message.includes('not found')) {
          console.log(`🔍 Transaction not found on node (still pending): ${tx.tx_id}`);
        }
      }
    }

    return { checked, confirmed, removed, errors };
  }

  /**
   * Get cleanup statistics
   */
  getStats(): { 
    enabled: boolean; 
    running: boolean; 
    config: CleanupConfig;
    nextRunIn?: number;
  } {
    const stats = {
      enabled: this.cleanupConfig.enabled,
      running: this.isRunning,
      config: this.cleanupConfig,
      nextRunIn: undefined as number | undefined
    };

    // Calculate time until next run if running
    if (this.intervalId && this.cleanupConfig.enabled) {
      // This is approximate since we don't track exact timing
      stats.nextRunIn = this.cleanupConfig.intervalMs;
    }

    return stats;
  }

  /**
   * Force run cleanup (for manual triggering)
   */
  async forceCleanup(): Promise<{ checked: number; confirmed: number; removed: number; errors: number }> {
    console.log('🔧 Manual cleanup triggered...');
    return await this.runCleanup();
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const mempoolCleaner = new MempoolCleaner();
