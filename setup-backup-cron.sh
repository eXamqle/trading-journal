#!/bin/bash

# Trading Journal - Setup Daily S3 Backup Cron
# Run this script once on your production server to set up the daily backup

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Check that docker is available
if ! command -v docker &> /dev/null; then
    echo "Error: Docker not found"
    exit 1
fi

# Check that the container is running
if ! docker ps --format '{{.Names}}' | grep -q 'trading-journal-app'; then
    echo "Error: trading-journal-app container is not running"
    exit 1
fi

# Create the cron entry - runs daily at 2:00 AM
CRON_CMD="0 2 * * * docker exec trading-journal-app node src/backup.js >> /var/log/trading-journal-backup.log 2>&1"

# Check if cron entry already exists
if crontab -l 2>/dev/null | grep -q 'trading-journal-app.*backup'; then
    echo "Backup cron already exists. Replacing..."
    crontab -l 2>/dev/null | grep -v 'trading-journal-app.*backup' | { cat; echo "$CRON_CMD"; } | crontab -
else
    (crontab -l 2>/dev/null; echo "$CRON_CMD") | crontab -
fi

echo "Backup cron installed. Running daily at 2:00 AM."
echo ""
echo "To verify: crontab -l"
echo "To view logs: tail -f /var/log/trading-journal-backup.log"
echo ""

# Test the backup now
echo "Running test backup..."
docker exec trading-journal-app node src/backup.js
echo ""
echo "Done!"
