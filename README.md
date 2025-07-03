# Wallet Mempool Service

A TypeScript-based wallet mempool service with PM2 process management.

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
pm2 start ecosystem.config.js --only wallet-mempool-dev
pm2 start ecosystem.config.js --only wallet-mempool-prod --env production

# View status
pm2 status

# View logs
pm2 logs wallet-mempool-dev
pm2 logs wallet-mempool-prod

# Stop specific app
pm2 stop wallet-mempool-dev
pm2 stop wallet-mempool-prod

# Delete from PM2
pm2 delete wallet-mempool-dev
pm2 delete wallet-mempool-prod
```

## Environment Variables

- `NODE_ENV`: Set to 'development' or 'production'
- `PORT`: Server port (default: 3000)

## Log Files

Logs are stored in the `logs/` directory:
- Development: `dev-*.log`
- Production: `prod-*.log`

## API Endpoint

Once running, visit: `http://localhost:3000`

Response example:
```json
{
  "message": "Wallet Mempool Service",
  "environment": "development",
  "timestamp": "2025-07-03T...",
  "pid": 12345
}
```
