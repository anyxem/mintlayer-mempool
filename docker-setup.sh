#!/bin/bash

# Mintlayer Wallet Mempool - Docker Setup Script

set -e

echo "🐳 Mintlayer Wallet Mempool Docker Setup"
echo "========================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create shared network if it doesn't exist
echo "🌐 Creating shared network..."
docker network create shared_network 2>/dev/null || echo "   Network 'shared_network' already exists"

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from example..."
    cp .env.docker.example .env
    echo "   Please edit .env file with your configuration"
else
    echo "✅ .env file already exists"
fi

# Create data and logs directories
echo "📁 Creating data and logs directories..."
mkdir -p data logs
chmod 755 data logs

# Build the Docker image
echo "🔨 Building Docker image..."
docker build -t mintlayer-wallet-mempool .

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Run: docker-compose up -d"
echo "3. Check logs: docker-compose logs -f wallet-mempool"
echo "4. Test health: curl http://localhost:3050/health"
echo ""
echo "For integration with existing Mintlayer services:"
echo "- See docker-compose.integration-example.yml"
echo "- Copy wallet-mempool service definition to your main docker-compose.yml"
echo "- Add WALLET_MEMPOOL_HOST_PORT=3050 to your main .env file"
