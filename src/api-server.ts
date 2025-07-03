import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { config, validateConfig } from './config';
import { transactionDb } from './database';
import { TransactionService } from './transaction-service';
import { NodeClient } from './node-client';

const app = express();

// Middleware for parsing different content types
app.use(express.json({ limit: '10mb' }));
app.use(express.text({ type: 'text/plain', limit: '10mb' }));
app.use(express.raw({ type: 'application/octet-stream', limit: '10mb' }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`📨 ${req.method} ${req.path} - ${req.get('Content-Type') || 'no content-type'}`);
  next();
});

// Health check endpoint
app.get('/health', async (req: any, res: any) => {
  try {
    const dbStats = await new TransactionService().getMempoolStats();
    const nodeHealthy = await NodeClient.healthCheck();
    
    res.json({
      status: 'healthy',
      service: 'Mintlayer Wallet Mempool',
      database: 'connected',
      mempool_count: dbStats.count,
      node_connectivity: nodeHealthy ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /api/transaction - Submit transaction
app.post('/api/transaction', async (req: any, res: any) => {
  try {
    const contentType = req.get('Content-Type') || '';
    console.log(`📝 Processing transaction submission (${contentType})`);
    
    // Parse the transaction request
    const transactionRequest = TransactionService.parseTransactionRequest(req.body, contentType);
    console.log(`🔍 Parsed transaction: ${transactionRequest.transaction.length} chars, metadata: ${!!transactionRequest.metadata}`);
    
    // Submit to node first
    const nodeResponse = await NodeClient.submitTransaction(transactionRequest.transaction);
    
    // Process and store the transaction
    const service = new TransactionService();
    const result = await service.processTransaction(transactionRequest, nodeResponse);
    
    res.status(201).json({
      success: true,
      tx_id: result.tx_id,
      status: result.status,
      timestamp: result.timestamp
    });
    
  } catch (error: any) {
    console.error('❌ Transaction submission failed:', error.message);
    res.status(400).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/transaction/:tx_id - Get transaction (proxied with fallback)
app.get('/api/transaction/:tx_id', async (req: any, res: any) => {
  try {
    const { tx_id } = req.params;
    console.log(`🔍 Looking up transaction: ${tx_id}`);
    
    // First, try to get from node (confirmed transactions)
    try {
      const nodeTransaction = await NodeClient.getTransaction(tx_id);
      if (nodeTransaction) {
        console.log(`✅ Found confirmed transaction on node: ${tx_id}`);
        return res.json({
          tx_id,
          status: 'confirmed',
          source: 'node',
          ...nodeTransaction,
          timestamp: new Date().toISOString()
        });
      }
    } catch (nodeError: any) {
      console.warn(`⚠️ Node lookup failed for ${tx_id}:`, nodeError.message);
      // Continue to local storage fallback
    }
    
    // Fallback to local storage (mempool)
    const service = new TransactionService();
    const localTransaction = await service.getTransactionDetails(tx_id);
    
    if (localTransaction) {
      console.log(`✅ Found transaction in mempool: ${tx_id}`);
      return res.json({
        ...localTransaction,
        source: 'mempool'
      });
    }
    
    // Not found anywhere
    console.log(`❓ Transaction not found: ${tx_id}`);
    res.status(404).json({
      success: false,
      error: 'Transaction not found',
      tx_id,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Transaction lookup failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/transactions/pending - Get all pending transactions
app.get('/api/transactions/pending', async (req: any, res: any) => {
  try {
    console.log('📋 Retrieving pending transactions');
    
    const service = new TransactionService();
    const pendingTransactions = await service.getPendingTransactions();
    
    res.json({
      success: true,
      count: pendingTransactions.length,
      transactions: pendingTransactions,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Failed to get pending transactions:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export async function startServer(): Promise<void> {
  try {
    // Validate configuration
    validateConfig();
    
    // Initialize database
    await transactionDb.initialize();
    
    // Start server
    app.listen(config.port, () => {
      console.log(`🚀 Mintlayer Wallet Mempool API running on port ${config.port}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔧 Process ID: ${process.pid}`);
      console.log('\n📋 Available endpoints:');
      console.log('   POST /api/transaction - Submit transaction');
      console.log('   GET  /api/transaction/:tx_id - Get transaction details');
      console.log('   GET  /api/transactions/pending - List pending transactions');
      console.log('   GET  /health - Health check');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

export { app };
