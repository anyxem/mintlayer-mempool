# Mintlayer Wallet Mempool Service

A TypeScript-based Mintlayer wallet mempool service with PM2 process management.

## Development vs Production Setup

### Development Environment
- Runs TypeScript directly with `ts-node`
- File watching enabled (auto-restart on changes)
- Single instance
- Detailed logging

### Production Environment
- Runs compiled JavaScript from `dist/` folder
- Cluster mode (uses all CPU cores)
- No file watching
- Memory restart limits
- Optimized for performance

## Quick Start

### Install Dependencies
```bash
npm install
```

### Development Mode

#### Option 1: Direct run
```bash
npm run dev
```

#### Option 2: With file watching
```bash
npm run dev:watch
```

#### Option 3: PM2 Development
```bash
npm run pm2:dev
```

### Production Mode

#### Build and run with PM2
```bash
npm run pm2:prod
```

## PM2 Commands

| Command | Description |
|---------|-------------|
| `npm run pm2:dev` | Start development server with PM2 |
| `npm run pm2:prod` | Build and start production server with PM2 |
| `npm run pm2:stop` | Stop all PM2 processes |
| `npm run pm2:restart` | Restart all PM2 processes |
| `npm run pm2:logs` | View PM2 logs |
| `npm run pm2:monitor` | Open PM2 monitoring dashboard |

## Manual PM2 Commands

```bash
# Start specific environment
pm2 start ecosystem.config.js --only mintlayer-wallet-mempool-dev
pm2 start ecosystem.config.js --only mintlayer-wallet-mempool-prod --env production

# View status
pm2 status

# View logs
pm2 logs mintlayer-wallet-mempool-dev
pm2 logs mintlayer-wallet-mempool-prod

# Stop specific app
pm2 stop mintlayer-wallet-mempool-dev
pm2 stop mintlayer-wallet-mempool-prod

# Delete from PM2
pm2 delete mintlayer-wallet-mempool-dev
pm2 delete mintlayer-wallet-mempool-prod
```

## Environment Variables

### Core Configuration
- `NODE_ENV`: Set to 'development' or 'production'
- `PORT`: Server port (default: 3000)
- `NODE_POST_TRANSACTION_URL`: Mintlayer node URL for submitting transactions
- `NODE_GET_TRANSACTION_URL`: Mintlayer node URL for querying transactions (optional)
- `DB_PATH`: Database file path (default: ./data/transactions.db)
- `LOG_LEVEL`: Logging level (debug, info, warn, error)

### Cleanup Configuration
- `CLEANUP_ENABLED`: Enable/disable automatic cleanup (default: true)
- `CLEANUP_INTERVAL_MS`: Cleanup interval in milliseconds (default: 300000 = 5 minutes)
- `CLEANUP_BATCH_SIZE`: Number of transactions to check per batch (default: 50)
- `CLEANUP_MAX_AGE_HOURS`: Maximum age of transactions to keep checking (default: 24)

## Log Files

Logs are stored in the `logs/` directory:
- Development: `dev-*.log`
- Production: `prod-*.log`

## API Endpoints

### Core Endpoints
- `POST /api/transaction` - Submit transaction (text/plain or JSON)
- `GET /api/transaction/:tx_id` - Get transaction details (proxied)
- `GET /api/transactions/pending` - List pending transactions

### Management Endpoints
- `GET /health` - Service health check
- `GET /api/cleanup/status` - Cleanup process status
- `POST /api/cleanup/run` - Manual cleanup trigger

### Health Check Example
Visit: `http://localhost:3000/health`

Response example:
```json
{
  "status": "healthy",
  "service": "Mintlayer Wallet Mempool",
  "database": "connected",
  "mempool_count": 5,
  "node_connectivity": "connected",
  "cleanup": {
    "enabled": true,
    "running": false,
    "interval_seconds": 300
  },
  "timestamp": "2025-07-03T..."
}
```

### Transaction Submission Examples

**Raw Transaction (text/plain):**
```bash
curl -X POST http://localhost:3000/api/transaction \
  -H "Content-Type: text/plain" \
  -d "deadbeef01234567..."
```

**JSON Transaction:**
```bash
curl -X POST http://localhost:3000/api/transaction \
  -H "Content-Type: application/json" \
  -d '{
    "transaction": "deadbeef01234567...",
    "metadata": {
      "amount": 100000000,
      "recipient": "address123",
      "fee": 1000
    }
  }'
```

## Mempool Cleanup Process

The service includes an automatic background process that removes confirmed transactions from the mempool:

### How It Works
1. **Periodic Checks**: Runs every 5 minutes by default
2. **Node Queries**: Checks each pending transaction against the Mintlayer node
3. **Confirmation Detection**: If a transaction is found on the node, it's considered confirmed
4. **Automatic Removal**: Confirmed transactions are removed from the local mempool
5. **Batch Processing**: Processes transactions in batches to avoid overwhelming the node

### Configuration
- **Interval**: Configure with `CLEANUP_INTERVAL_MS` (default: 300000ms = 5 minutes)
- **Batch Size**: Configure with `CLEANUP_BATCH_SIZE` (default: 50 transactions)
- **Max Age**: Configure with `CLEANUP_MAX_AGE_HOURS` (default: 24 hours)
- **Enable/Disable**: Configure with `CLEANUP_ENABLED` (default: true)

### Manual Cleanup
Trigger manual cleanup via API:
```bash
curl -X POST http://localhost:3000/api/cleanup/run
```

### Cleanup Status
Check cleanup process status:
```bash
curl http://localhost:3000/api/cleanup/status
```
