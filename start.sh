#!/bin/bash

# Trading Journal - Quick Start Script

echo "🚀 Starting Trading Journal..."
echo ""

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "📝 Creating .env.production file..."

    # Generate secure JWT secret
    JWT_SECRET=$(openssl rand -hex 32)

    cat > .env.production <<EOF
JWT_SECRET=$JWT_SECRET
CLIENT_URL=https://flobros.de
NODE_ENV=production
PORT=5000
EOF

    echo "✓ Created .env.production with secure JWT_SECRET"
    echo ""
fi

# Check if client/.env.production exists
if [ ! -f client/.env.production ]; then
    echo "📝 Creating client/.env.production file..."

    cat > client/.env.production <<EOF
VITE_API_URL=https://flobros.de/api
EOF

    echo "✓ Created client/.env.production"
    echo ""
fi

# Check if docker compose or docker-compose is available
if command -v docker &> /dev/null; then
    if docker compose version &> /dev/null; then
        echo "🐳 Building and starting with Docker Compose..."
        docker compose --env-file .env.production up --build
    elif command -v docker-compose &> /dev/null; then
        echo "🐳 Building and starting with docker-compose..."
        docker-compose --env-file .env.production up --build
    else
        echo "❌ Docker Compose not found!"
        echo "Install Docker Compose or use plain Docker commands from DEPLOYMENT.md"
        exit 1
    fi
else
    echo "❌ Docker not found!"
    echo "Please install Docker first: https://docs.docker.com/get-docker/"
    exit 1
fi
