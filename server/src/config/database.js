import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';
import bcrypt from 'bcryptjs';
import { createDefaultTagsForUser } from '../utils/defaultTags.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../database/trading-journal.db');

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
import { mkdirSync } from 'fs';
try {
  mkdirSync(dbDir, { recursive: true });
} catch (error) {
  // Directory might already exist
}

const db = new Database(dbPath);
console.log(`✓ Database location: ${dbPath}`);
db.pragma('journal_mode = WAL'); // Better concurrency

// Initialize tables
export function initDatabase() {
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      currency TEXT DEFAULT 'USD',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS trades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date DATE NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('profit', 'loss', 'break-even')),
      symbol TEXT NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      category TEXT NOT NULL,
      fees DECIMAL(10, 2) DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS journal_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date DATE NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, date)
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS trade_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trade_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (trade_id) REFERENCES trades(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
      UNIQUE(trade_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS journal_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      journal_entry_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
      UNIQUE(journal_entry_id, tag_id)
    );

    CREATE INDEX IF NOT EXISTS idx_trades_user_date ON trades(user_id, date DESC);
    CREATE INDEX IF NOT EXISTS idx_trades_user_category ON trades(user_id, category);
    CREATE INDEX IF NOT EXISTS idx_journal_user_date ON journal_entries(user_id, date DESC);
    CREATE INDEX IF NOT EXISTS idx_tags_user ON tags(user_id);
    CREATE INDEX IF NOT EXISTS idx_trade_tags_trade ON trade_tags(trade_id);
    CREATE INDEX IF NOT EXISTS idx_trade_tags_tag ON trade_tags(tag_id);
    CREATE INDEX IF NOT EXISTS idx_journal_tags_entry ON journal_tags(journal_entry_id);
    CREATE INDEX IF NOT EXISTS idx_journal_tags_tag ON journal_tags(tag_id);
  `);

  // Create default user if none exists
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    const hash = bcrypt.hashSync('password123', 10);
    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash)
      VALUES (?, ?, ?)
    `).run('John Doe', 'john@example.com', hash);
    console.log('✓ Default user created: john@example.com / password123');

    // Create default tags for the new user
    createDefaultTagsForUser(db, result.lastInsertRowid);
  }

  // Create default tags for existing users who don't have any
  const usersWithoutTags = db.prepare(`
    SELECT u.id
    FROM users u
    LEFT JOIN tags t ON u.id = t.user_id
    GROUP BY u.id
    HAVING COUNT(t.id) = 0
  `).all();

  usersWithoutTags.forEach(user => {
    createDefaultTagsForUser(db, user.id);
  });

  if (usersWithoutTags.length > 0) {
    console.log(`✓ Default tags created for ${usersWithoutTags.length} user(s)`);
  }

  // Add currency column to existing users table if it doesn't exist
  try {
    const tableInfo = db.prepare("PRAGMA table_info(users)").all();
    const hasCurrencyColumn = tableInfo.some(col => col.name === 'currency');

    if (!hasCurrencyColumn) {
      db.exec(`ALTER TABLE users ADD COLUMN currency TEXT DEFAULT 'USD'`);
      console.log('✓ Added currency column to users table');
    }
  } catch (error) {
    // Column might already exist, ignore error
  }
}

export default db;
