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

#### Setup production environment
```bash
# Copy example environment file
npm run pm2:prod:setup

# Edit with your production values
nano .env.production
```

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

## Environment Configuration

### Development Mode
Development mode uses default environment variables and doesn't require an `.env` file.

### Production Mode
Production mode uses `.env.production` file for configuration.

#### Setup Production Environment
```bash
# Create production environment file
npm run pm2:prod:setup

# Edit with your values
nano .env.production
```

#### Example .env.production
```bash
NODE_ENV=production
PORT=3000
NODE_POST_TRANSACTION_URL=https://node.mintlayer.org/api/submit
NODE_GET_TRANSACTION_URL=https://node.mintlayer.org/api/tx
DB_PATH=/var/lib/wallet-mempool/transactions.db
LOG_LEVEL=info
CORS_ORIGINS=https://wallet.mintlayer.org,https://explorer.mintlayer.org
CLEANUP_ENABLED=true
CLEANUP_INTERVAL_MS=300000
CLEANUP_BATCH_SIZE=50
CLEANUP_MAX_AGE_HOURS=24
```

### Environment Variables Reference

#### Core Configuration
- `NODE_ENV`: Set to 'development' or 'production'
- `PORT`: Server port (default: 3000)
- `NODE_POST_TRANSACTION_URL`: Mintlayer node URL for submitting transactions
- `NODE_GET_TRANSACTION_URL`: Mintlayer node URL for querying transactions (optional)
- `DB_PATH`: Database file path (default: ./data/transactions.db)
- `LOG_LEVEL`: Logging level (debug, info, warn, error)

#### CORS Configuration
- `CORS_ORIGINS`: Comma-separated list of allowed origins (optional, default: all origins allowed)

#### Cleanup Configuration
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

**JSON Transaction with Object Metadata:**
```bash
curl -X POST http://localhost:3000/api/transaction \
  -H "Content-Type: application/json" \
  -d '{
    "transaction": "deadbeef01234567...",
    "metadata": {
      "amount": 100000000,
      "recipient": "ml1qw508d6qejxtdg4y5r3zarvary0c5xw7k8txqgv",
      "fee": 1000,
      "wallet_info": {
        "version": "2.1.0",
        "platform": "web"
      },
      "tags": ["payment", "urgent"]
    }
  }'
```

**JSON Transaction with String Metadata:**
```bash
curl -X POST http://localhost:3000/api/transaction \
  -H "Content-Type: application/json" \
  -d '{
    "transaction": "cafebabe87654321...",
    "metadata": "Simple string metadata for this transaction"
  }'
```

**JSON Transaction with Number Metadata:**
```bash
curl -X POST http://localhost:3000/api/transaction \
  -H "Content-Type: application/json" \
  -d '{
    "transaction": "beefdead01234567...",
    "metadata": 42
  }'
```

## Metadata Support

The service supports **free-format metadata** to accommodate different wallet implementations and use cases:

### Supported Metadata Types
- **Object**: Complex nested structures with any fields
- **String**: Simple text metadata
- **Number**: Numeric metadata
- **Boolean**: True/false flags
- **Array**: Lists of values
- **null**: Explicit null value
- **undefined**: No metadata (omit the field)

### Metadata Examples

**Wallet Information:**
```json
{
  "transaction": "...",
  "metadata": {
    "wallet_version": "2.1.0",
    "user_id": "user123",
    "session_id": "sess456"
  }
}
```

**Exchange Order:**
```json
{
  "transaction": "...",
  "metadata": {
    "exchange_order_id": "ORD-789",
    "trading_pair": "ML/USDT",
    "order_type": "market",
    "executed_price": 1.25,
    "fees": {
      "network_fee": 0.001,
      "exchange_fee": 0.0025
    }
  }
}
```

**Simple Tag:**
```json
{
  "transaction": "...",
  "metadata": "urgent-payment"
}
```

**Compliance Data:**
```json
{
  "transaction": "...",
  "metadata": {
    "compliance": {
      "kyc_verified": true,
      "aml_check": "passed",
      "risk_score": 0.15
    },
    "routing": ["ExchangeA", "HopB", "ExchangeC"],
    "priority": 1
  }
}
```

### Metadata Preservation
- Metadata is stored exactly as provided
- No validation or transformation is performed (see TODO section)
- Retrieved transactions return metadata in the same format
- Supports any JSON-serializable data structure

### Current Verification Status
⚠️ **Note**: The verification layer currently accepts all transactions as a stub implementation. Future enhancement will include verification of metadata against encoded transaction data to ensure consistency and prevent spoofing.

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

## Production Deployment

### Bare Metal Server with PM2

#### 1. Server Setup
```bash
# Clone repository
git clone <repository-url>
cd wallet-mempool

# Install dependencies
npm install

# Setup production environment
npm run pm2:prod:setup

# Edit production configuration
nano .env.production
```

#### 2. Configure Environment
Update `.env.production` with your production values:
```bash
NODE_ENV=production
PORT=3000
NODE_POST_TRANSACTION_URL=https://your-mintlayer-node.com/api/submit
NODE_GET_TRANSACTION_URL=https://your-mintlayer-node.com/api/tx
DB_PATH=/var/lib/wallet-mempool/transactions.db
LOG_LEVEL=warn
CLEANUP_ENABLED=true
CLEANUP_INTERVAL_MS=300000
```

#### 3. Deploy
```bash
# Build application
npm run build

# Start with PM2
npm run pm2:prod

# Setup auto-startup
pm2 startup
pm2 save
```

#### 4. Management Commands
```bash
# View status
pm2 status

# View logs
pm2 logs mintlayer-wallet-mempool-prod

# Restart
pm2 restart mintlayer-wallet-mempool-prod

# Stop
pm2 stop mintlayer-wallet-mempool-prod

# Monitor
pm2 monit
```

### Security Considerations
- ✅ `.env.production` is excluded from git
- ✅ Use proper file permissions: `chmod 600 .env.production`
- ✅ Run as dedicated user, not root
- ✅ Use reverse proxy (nginx) for SSL termination
- ✅ Configure firewall to restrict access

## TODO / Future Enhancements

### Transaction Verification
- **TODO**: Implement verification layer to compare transaction metadata against encoded transaction
- **Purpose**: Ensure consistency between JSON metadata and the actual encoded transaction data
- **Examples**:
  - Verify that `metadata.amount` matches the amount in the encoded transaction
  - Verify that `metadata.recipient` matches the recipient address in the transaction
  - Verify that `metadata.fee` matches the calculated transaction fee
  - Detect discrepancies between claimed and actual transaction parameters
- **Implementation**: Update `src/verification.ts` with actual verification logic using transaction parsing library
- **Security**: Prevents metadata spoofing and ensures data integrity
- **Current Status**: Verification layer exists as stub (allows all transactions)
