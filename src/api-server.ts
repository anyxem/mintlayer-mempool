import express from 'express';
import cors from 'cors';
import type { Request, Response, NextFunction } from 'express';
import { config, validateConfig } from './config';
import { webSocketClient } from './websocket-client';
import { NodeClient } from './node-client';
import { parseDecodedTx } from './parseDecodedTx';

const app = express();

// CORS middleware - configurable origins
const corsOrigins = config.corsOrigins
  ? config.corsOrigins.split(',').map(origin => origin.trim())
  : true; // Allow all origins if not specified

app.use(cors({
  origin: corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

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
    const wsStatus = webSocketClient.getConnectionStatus();
    const nodeHealthy = await NodeClient.healthCheck();

    res.json({
      status: 'healthy',
      service: 'Mintlayer Wallet Mempool Proxy',
      websocket: {
        connected: wsStatus.connected,
        reconnect_attempts: wsStatus.reconnectAttempts
      },
      node_connectivity: nodeHealthy ? 'connected' : 'disconnected',
      timestamp: Math.floor(Date.now() / 1000)
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: Math.floor(Date.now() / 1000)
    });
  }
});



// GET /api/transaction/:tx_id - Get transaction (confirmed via HTTP, mempool via WebSocket)
app.get('/api/transaction/:tx_id', async (req: any, res: any) => {
  try {
    const { tx_id } = req.params;
    console.log(`🔍 Looking up transaction: ${tx_id}`);

    // First, try to get confirmed transaction from node via HTTP
    if (config.nodeGetTransactionUrl) {
      try {
        const nodeTransaction = await NodeClient.getTransaction(tx_id);
        if (nodeTransaction) {
          console.log(`✅ Found confirmed transaction on node: ${tx_id}`);
          return res.json({
            id: tx_id,
            ...nodeTransaction,
          });
        }
      } catch (nodeError: any) {
        console.warn(`⚠️ Node lookup failed for ${tx_id}:`, nodeError.message);
        // Continue to mempool fallback
      }
    }

    // Fallback to mempool via WebSocket
    const mempoolResult = await webSocketClient.getMempoolTransaction(tx_id);

    if (mempoolResult) {
      console.log(`✅ Found transaction in mempool: ${tx_id}`);

      // Decode the transaction using WASM
      try {
        const {
          decode_signed_transaction_to_js,
          get_transaction_id
        } = require('../lib/wasm/wasm_wrappers');

        // Convert hex string to Uint8Array
        const transactionBytes = new Uint8Array(
          mempoolResult.transaction.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
        );

        const rawDecoded = decode_signed_transaction_to_js(transactionBytes, 1);

        const tx_id = get_transaction_id(transactionBytes, false);

        const parsedTransaction = parseDecodedTx(rawDecoded);

        return res.json({
          id: tx_id,
          ...parsedTransaction,
          confirmations: 0,
          timestamp: Math.floor(Date.now() / 1000)
        });
      } catch (decodeError: any) {
        console.warn(`⚠️ Failed to decode transaction ${tx_id}:`, decodeError.message);

        // Return raw transaction data if decoding fails
        return res.json({
          id: mempoolResult.id,
          confirmations: 0,
          raw: mempoolResult.transaction,
          timestamp: Math.floor(Date.now() / 1000)
        });
      }
    }

    // Not found anywhere
    console.log(`❓ Transaction not found: ${tx_id}`);
    res.status(404).json({
      success: false,
      error: 'Transaction not found',
      tx_id,
      timestamp: Math.floor(Date.now() / 1000)
    });

  } catch (error: any) {
    console.error('❌ Transaction lookup failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: Math.floor(Date.now() / 1000)
    });
  }
});



export async function startServer(): Promise<void> {
  try {
    // Validate configuration
    validateConfig();

    // Start server
    app.listen(config.port, () => {
      console.log(`🚀 Mintlayer Wallet Mempool Proxy running on port ${config.port}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔧 Process ID: ${process.pid}`);
      console.log(`🔌 WebSocket URL: ${config.nodeWebSocketUrl}`);
      console.log('\n📋 Available endpoints:');
      console.log('   GET  /api/transaction/:tx_id - Get transaction details from mempool');
      console.log('   GET  /health - Health check');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

export { app };
