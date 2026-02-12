#!/bin/bash

# Import trades to Docker container database
# Usage: ./docker-import.sh

echo "🐳 Trading Journal - Docker CSV Import"
echo "======================================"
echo ""

# Check if CSV file exists
if [ ! -f "TradeJournal.csv" ]; then
    echo "❌ Error: TradeJournal.csv not found"
    exit 1
fi

# Check if container is running
if ! docker ps | grep -q trading-journal-app; then
    echo "❌ Error: trading-journal-app container is not running"
    echo "   Start it with: docker-compose up -d"
    exit 1
fi

echo "📋 Copying files to container..."
docker cp TradeJournal.csv trading-journal-app:/app/
docker cp import-trades.js trading-journal-app:/app/

echo "📦 Installing better-sqlite3 in container..."
docker exec -w /app trading-journal-app npm install better-sqlite3

echo "🚀 Running import..."
docker exec -w /app trading-journal-app node import-trades.js

echo ""
echo "✨ Done! Check your trading journal."
