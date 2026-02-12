#!/bin/bash

# Import trades to database
# Usage: ./import.sh

echo "🚀 Trading Journal - CSV Import Script"
echo "======================================"
echo ""

# Check if better-sqlite3 is installed
if [ ! -d "node_modules/better-sqlite3" ]; then
    echo "📦 Installing better-sqlite3..."
    npm install better-sqlite3
    echo ""
fi

# Check if CSV file exists
if [ ! -f "TradeJournal.csv" ]; then
    echo "❌ Error: TradeJournal.csv not found"
    echo "   Please make sure the CSV file is in the same directory"
    exit 1
fi

# Check if import script exists
if [ ! -f "import-trades.js" ]; then
    echo "❌ Error: import-trades.js not found"
    exit 1
fi

# Check if database directory exists
if [ ! -d "database" ]; then
    echo "❌ Error: database directory not found"
    echo "   Make sure you're running this from /home/tradingjournal/app"
    exit 1
fi

# Run the import script
node import-trades.js

echo ""
echo "✨ Done!"
