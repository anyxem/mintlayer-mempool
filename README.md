# Mintlayer Wallet Mempool Proxy

A TypeScript-based Mintlayer wallet mempool proxy service that connects to the Mintlayer node via WebSocket for real-time mempool queries, with PM2 process management.

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
NODE_WEBSOCKET_URL=ws://user:user@node.mintlayer.org:13031/ws
NODE_GET_TRANSACTION_URL=https://node.mintlayer.org/api/v2/transaction
LOG_LEVEL=info
CORS_ORIGINS=https://wallet.mintlayer.org,https://explorer.mintlayer.org
```

### Environment Variables Reference

#### Core Configuration
- `NODE_ENV`: Set to 'development' or 'production'
- `PORT`: Server port (default: 3000)
- `NODE_WEBSOCKET_URL`: Mintlayer node WebSocket URL for mempool queries (default: ws://user:user@localhost:13031/ws)
- `NODE_GET_TRANSACTION_URL`: Mintlayer node HTTP URL for confirmed transaction queries (optional)
- `LOG_LEVEL`: Logging level (debug, info, warn, error)

#### CORS Configuration
- `CORS_ORIGINS`: Comma-separated list of allowed origins (optional, default: all origins allowed)

## Log Files

Logs are stored in the `logs/` directory:
- Development: `dev-*.log`
- Production: `prod-*.log`

## API Endpoints

### Core Endpoints
- `GET /api/transaction/:tx_id` - Get transaction details (confirmed via HTTP, mempool via WebSocket)

### Management Endpoints
- `GET /health` - Service health check

### Health Check Example
Visit: `http://localhost:3000/health`

Response example:
```json
{
  "status": "healthy",
  "service": "Mintlayer Wallet Mempool Proxy",
  "websocket": {
    "connected": true,
    "reconnect_attempts": 0
  },
  "node_connectivity": "connected",
  "timestamp": 1748468977
}
```

### Transaction Query Example

**Get Transaction Details:**
```bash
curl http://localhost:3000/api/transaction/5a6c6b19481ef8fbf41cf9a09edda2f1d0e584acf2b8228447ce415e0fa8520d
```

Response for mempool transaction:
```json
{
  "tx_id": "5a6c6b19481ef8fbf41cf9a09edda2f1d0e584acf2b8228447ce415e0fa8520d",
  "status": "InMempool",
  "transaction": "01000400005a6c6b...",
  "decoded": {
    "inputs": [
      {
        "input": {
          "index": 0,
          "input_type": "UTXO",
          "source_id": "3e0c04ce80dff7dfae5be22b9ada59f0338d2a6ad6204aa1320a2fa5d6ca7afa",
          "source_type": "Transaction"
        },
        "utxo": null
      }
    ],
    "outputs": [
      {
        "destination": "mtc1qxk2wnpqz7s7k5rqv8q9jw7qm9s5l4k3j2h1g0f9e8d7c6b5a4",
        "type": "Transfer",
        "value": {
          "type": "Coin",
          "amount": {
            "atoms": "1000000000000",
            "decimal": "10"
          }
        }
      }
    ]
  },
  "source": "mempool",
  "timestamp": 1748468977
}
```

Response for confirmed transaction:
```json
{
  "tx_id": "5a6c6b19481ef8fbf41cf9a09edda2f1d0e584acf2b8228447ce415e0fa8520d",
  "status": "confirmed",
  "source": "node",
  "confirmations": 5,
  "timestamp": 1748468977
}
```

## WebSocket Mempool Integration

The service connects to the Mintlayer node via WebSocket for real-time mempool queries:

### How It Works
1. **WebSocket Connection**: Maintains persistent connection to the node's WebSocket endpoint
2. **JSON-RPC Protocol**: Uses `mempool_get_transaction` method to query transactions
3. **Automatic Reconnection**: Handles connection drops with exponential backoff
4. **Transaction Decoding**: Automatically decodes raw transactions using WASM bindings
5. **Transaction Parsing**: Converts complex decoded transactions into simplified, structured format
6. **Dual Source**: Checks confirmed transactions via HTTP, mempool transactions via WebSocket

### Transaction Parsing Features
- **Simplified Structure**: Converts complex nested transaction data into easy-to-use format
- **Decimal Conversion**: Automatically converts atoms to decimal representation (coins: 11 decimals, tokens: 8 decimals)
- **Type Mapping**: Maps complex transaction types to simple, consistent structures
- **Input/Output Processing**: Handles UTXO, AccountCommand, and Account input types
- **Multi-Output Support**: Supports Transfer, CreateOrder, IssueFungibleToken, Htlc, and other output types

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
NODE_WEBSOCKET_URL=ws://user:user@your-mintlayer-node.com:13031/ws
NODE_GET_TRANSACTION_URL=https://your-mintlayer-node.com/api/v2/transaction
LOG_LEVEL=warn
CORS_ORIGINS=https://wallet.mintlayer.org,https://explorer.mintlayer.org
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

## Docker Deployment

### Standalone Docker Compose

The project includes a `docker-compose.yml` file for standalone deployment:

```bash
# Build and start the service
docker-compose up -d

# View logs
docker-compose logs -f wallet-mempool

# Stop the service
docker-compose down
```

### Integration with Existing Mintlayer Docker Compose

#### Quick Integration

To add the wallet mempool service to your existing Mintlayer docker-compose setup, add this service definition:

```yaml
  wallet-mempool:
    build:
      context: ./wallet-mempool  # Path to wallet-mempool directory
      dockerfile: Dockerfile
    container_name: mintlayer-wallet-mempool
    restart: unless-stopped
    networks:
      - shared_network
    environment:
      # Server Configuration
      NODE_ENV: production
      PORT: 3000

      # Mintlayer Node Configuration
      NODE_WEBSOCKET_URL: ws://$NODE_RPC_USERNAME:$NODE_RPC_PASSWORD@node-daemon:13030/ws
      NODE_GET_TRANSACTION_URL: http://api-web-server:3000/api/v2/transaction

      # Logging Configuration
      LOG_LEVEL: info

      # CORS Configuration (optional)
      # CORS_ORIGINS: https://wallet.mintlayer.org,https://explorer.mintlayer.org
    ports:
      - "${WALLET_MEMPOOL_HOST_PORT:-3050}:3000"
    volumes:
      # Persist transaction database
      - wallet_mempool_data:/app/data
      # Persist logs
      - wallet_mempool_logs:/app/logs
    depends_on:
      - node-daemon
      - api-web-server
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
```

And add the volumes to your volumes section:

```yaml
volumes:
  api_postgres_db:
  api_postgres_db_a:
  wallet_mempool_data:    # Add this
  wallet_mempool_logs:    # Add this
```

#### Complete Integration Example

For a complete example of how to integrate the wallet mempool with your existing Mintlayer services, see the `docker-compose.integration-example.yml` file. This shows the full docker-compose configuration with all services including the wallet mempool.

To use the integration example:

1. **Copy your wallet-mempool directory** to the same location as your main docker-compose.yml
2. **Copy the wallet mempool service definition** from `docker-compose.integration-example.yml` to your main docker-compose.yml
3. **Add the required environment variables** to your `.env` file:
   ```bash
   # Add to your existing .env file
   WALLET_MEMPOOL_HOST_PORT=3050
   ```
4. **Update the context path** in the wallet-mempool service to match your directory structure

### Environment Variables for Docker

Add these variables to your `.env` file for the main docker-compose:

```bash
# Wallet Mempool Configuration
WALLET_MEMPOOL_HOST_PORT=3050
```

### Quick Docker Setup

Use the provided setup script for easy Docker deployment:

```bash
# Make setup script executable and run it
chmod +x docker-setup.sh
./docker-setup.sh

# Edit environment configuration
nano .env

# Start the service
docker-compose up -d

# View logs
docker-compose logs -f wallet-mempool

# Test the service
curl http://localhost:3050/health
```

### Docker Build and Management

```bash
# Build the image
docker build -t mintlayer-wallet-mempool .

# Run standalone container
docker run -d \
  --name wallet-mempool \
  --network shared_network \
  -p 3050:3000 \
  -e NODE_WEBSOCKET_URL="ws://user:user@node-daemon:13030/ws" \
  -e NODE_GET_TRANSACTION_URL="http://api-web-server:3000/api/v2/transaction" \
  mintlayer-wallet-mempool

# View logs
docker logs -f wallet-mempool

# Stop and remove
docker stop wallet-mempool
docker rm wallet-mempool
```

### Docker Health Checks

The Docker container includes health checks that verify:
- Service is responding on port 3000
- `/health` endpoint returns successful response
- WebSocket connection to node is active

Check health status:
```bash
docker ps  # Shows health status in STATUS column
docker inspect wallet-mempool | grep -A 10 Health
```
