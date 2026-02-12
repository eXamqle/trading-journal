#!/bin/bash

# Import trades to database
# Usage: ./import.sh

echo "🚀 Trading Journal - CSV Import Script"
echo "======================================"
echo ""

# Check if CSV file exists
if [ ! -f "TradeJournal.csv" ]; then
    echo "❌ Error: TradeJournal.csv not found"
    echo "   Please make sure the CSV file is in the project root"
    exit 1
fi

# Check if import script exists
if [ ! -f "import-trades.js" ]; then
    echo "❌ Error: import-trades.js not found"
    exit 1
fi

# Run the import script
node import-trades.js

echo ""
echo "✨ Done!"
