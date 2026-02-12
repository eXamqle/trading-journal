import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Docker container paths (when run from /app inside container)
const dbPath = path.join(__dirname, 'server/database/trading-journal.db');
const csvPath = path.join(__dirname, 'TradeJournal.csv');

console.log('📊 Starting CSV import...\n');
console.log(`Database: ${dbPath}`);
console.log(`CSV file: ${csvPath}\n`);

const db = new Database(dbPath);

// Find user by email
const user = db.prepare('SELECT * FROM users WHERE email = ?').get('kuznikluka@gmail.com');

if (!user) {
  console.error('❌ User not found: kuznikluka@gmail.com');
  process.exit(1);
}

console.log(`✓ Found user: ${user.name} (${user.email})`);
console.log(`✓ User ID: ${user.id}\n`);

// Read and parse CSV
const csvContent = readFileSync(csvPath, 'utf-8');
const lines = csvContent.split('\n').filter(line => line.trim());

// Skip header
const trades = lines.slice(1);

console.log(`📄 CSV contains ${trades.length} trades\n`);

// Parse and import trades
const insertStmt = db.prepare(`
  INSERT INTO trades (user_id, date, type, symbol, amount, category, fees)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

let imported = 0;
let skipped = 0;

const insertMany = db.transaction((tradeRows) => {
  for (const row of tradeRows) {
    try {
      // Parse CSV row (handle quoted fields)
      const fields = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g).map(f => f.replace(/^"|"$/g, ''));

      const [assetClass, symbol, dateTime, quantity, proceeds, ibCommission, netCash, origTradePrice, buySell] = fields;

      // Parse date (format: "2026-02-02;095125")
      const date = dateTime.split(';')[0];

      // Parse amounts
      const netCashValue = parseFloat(netCash);
      const amount = Math.abs(netCashValue);
      const fees = Math.abs(parseFloat(ibCommission));

      // Determine type based on NetCash
      let type;
      if (Math.abs(netCashValue) < 0.01) {
        type = 'break-even';
      } else if (netCashValue > 0) {
        type = 'profit';
      } else {
        type = 'loss';
      }

      // Convert symbol and category
      const convertedSymbol = symbol === 'MESH6' ? 'MES' : symbol;
      const convertedCategory = assetClass === 'FUT' ? 'Futures' : assetClass;

      // Insert trade
      insertStmt.run(user.id, date, type, convertedSymbol, amount, convertedCategory, fees);
      imported++;

    } catch (error) {
      console.error(`⚠️  Skipped row: ${error.message}`);
      skipped++;
    }
  }
});

// Execute batch insert
insertMany(trades);

console.log('\n✅ Import complete!\n');
console.log(`   Imported: ${imported} trades`);
if (skipped > 0) {
  console.log(`   Skipped:  ${skipped} trades`);
}
console.log('');

db.close();
