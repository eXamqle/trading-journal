import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../database/trading-journal.db');

const db = new Database(dbPath);
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

    CREATE INDEX IF NOT EXISTS idx_trades_user_date ON trades(user_id, date DESC);
    CREATE INDEX IF NOT EXISTS idx_trades_user_category ON trades(user_id, category);
    CREATE INDEX IF NOT EXISTS idx_journal_user_date ON journal_entries(user_id, date DESC);
    CREATE INDEX IF NOT EXISTS idx_tags_user ON tags(user_id);
    CREATE INDEX IF NOT EXISTS idx_trade_tags_trade ON trade_tags(trade_id);
    CREATE INDEX IF NOT EXISTS idx_trade_tags_tag ON trade_tags(tag_id);
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
    createDefaultTags(result.lastInsertRowid);
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
    createDefaultTags(user.id);
  });

  if (usersWithoutTags.length > 0) {
    console.log(`✓ Default tags created for ${usersWithoutTags.length} user(s)`);
  }
}

function createDefaultTags(userId) {
  const defaultTags = [
    // Strategy tags
    { name: 'Scalp', color: '#10b981' },
    { name: 'Day Trade', color: '#3b82f6' },
    { name: 'Swing', color: '#8b5cf6' },
    { name: 'Breakout', color: '#f59e0b' },
    { name: 'Reversal', color: '#ef4444' },
    { name: 'Trend Following', color: '#06b6d4' },
    // Psychology/Emotional tags
    { name: 'FOMO', color: '#dc2626' },
    { name: 'Revenge Trade', color: '#991b1b' },
    { name: 'Overtrading', color: '#ea580c' },
    { name: 'Emotional', color: '#9333ea' },
    { name: 'Disciplined', color: '#059669' },
    { name: 'Patient', color: '#0891b2' }
  ];

  const insertTag = db.prepare('INSERT INTO tags (user_id, name, color) VALUES (?, ?, ?)');

  for (const tag of defaultTags) {
    insertTag.run(userId, tag.name, tag.color);
  }
}

export default db;
