# CSV Import Guide - Docker

## 🐳 For Docker Setup (Raspberry Pi)

Your app runs in Docker, so the database is inside a container. Use this simple command:

### Quick Import:

```bash
./docker-import.sh
```

That's it! The script will:
- ✅ Copy CSV and import script to container
- ✅ Install better-sqlite3 inside container
- ✅ Import 92 trades to the database
- ✅ Create user `kuznikluka@gmail.com` if needed

### Manual Docker Import:

```bash
# 1. Copy files to container
docker cp TradeJournal.csv trading-journal-app:/app/
docker cp import-trades.js trading-journal-app:/app/

# 2. Install dependency in container
docker exec trading-journal-app npm install better-sqlite3

# 3. Run import
docker exec trading-journal-app node import-trades.js
```

## 🎯 What Gets Imported

- **92 futures trades** for `kuznikluka@gmail.com`
- Converts:
  - `FUT` → `Futures`
  - `MESH6` → `MES`
  - Date: `2026-02-02;095125` → `2026-02-02`
  - Type: Based on P&L (positive = profit, negative = loss)
  - Amount: Absolute value of NetCash
  - Fees: Absolute value of IBCommission

## 🔐 Login Info

- **Email:** `kuznikluka@gmail.com`
- **Password:** `password123` (change after login!)
- **Currency:** EUR

## 📂 Docker File Structure

Inside container at `/app/`:
```
/app/
├── TradeJournal.csv       # CSV copied here
├── import-trades.js       # Import script
└── server/
    └── database/
        └── trading-journal.db # SQLite database (Docker volume)
```

## ⚠️ Troubleshooting

**"Container not running"**
```bash
docker-compose up -d
```

**"User not found"**
Create user inside container:
```bash
docker exec -it trading-journal-app sqlite3 server/database/trading-journal.db
```
Then run:
```sql
INSERT INTO users (name, email, password_hash, currency)
VALUES ('Luka Kuznik', 'kuznikluka@gmail.com', '$2a$10$XvPsP8c.N5E/ggJc9qxsxeWQYGdW8EEd0mTKqN8JqY4nqYKH7mQxC', 'EUR');
```

**Check if import worked:**
```bash
docker exec trading-journal-app sqlite3 server/database/trading-journal.db \
  "SELECT COUNT(*) FROM trades WHERE user_id=2;"
```

Expected: `92`

## 🔄 Re-import (Clear Previous Data)

If you need to import again:
```bash
# Delete old trades
docker exec trading-journal-app sqlite3 server/database/trading-journal.db \
  "DELETE FROM trades WHERE user_id=2;"

# Re-run import
./docker-import.sh
```
