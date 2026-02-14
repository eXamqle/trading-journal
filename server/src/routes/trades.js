import express from 'express';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { modifyLimiter } from '../middleware/rateLimiter.js';
import {
  createTradeValidation,
  updateTradeValidation,
  deleteTradeValidation
} from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

const normalizeTagName = (tag) => {
  if (typeof tag === 'string') {
    const trimmed = tag.trim();
    return trimmed || null;
  }

  if (tag && typeof tag === 'object' && typeof tag.name === 'string') {
    const trimmed = tag.name.trim();
    return trimmed || null;
  }

  return null;
};

const normalizeTagNames = (tags) => {
  if (!Array.isArray(tags)) {
    return [];
  }

  const uniqueNames = [];
  const seen = new Set();

  for (const tag of tags) {
    const name = normalizeTagName(tag);
    if (!name) continue;

    const key = name.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    uniqueNames.push(name);
  }

  return uniqueNames;
};

// Get all trades for the authenticated user
router.get('/', (req, res) => {
  try {
    const { startDate, endDate, category, type } = req.query;

    let query = 'SELECT * FROM trades WHERE user_id = ?';
    const params = [req.userId];

    if (startDate) {
      query += ' AND date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND date <= ?';
      params.push(endDate);
    }

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY date DESC, created_at DESC';

    const trades = db.prepare(query).all(...params);

    // Fetch all tags for all trades in one query (fix N+1 problem)
    if (trades.length > 0) {
      const tradeIds = trades.map(t => t.id);
      const placeholders = tradeIds.map(() => '?').join(',');

      const allTags = db.prepare(`
        SELECT tt.trade_id, t.id, t.name, t.color
        FROM tags t
        INNER JOIN trade_tags tt ON t.id = tt.tag_id
        WHERE tt.trade_id IN (${placeholders})
      `).all(...tradeIds);

      // Group tags by trade_id
      const tagsByTradeId = {};
      allTags.forEach(tag => {
        if (!tagsByTradeId[tag.trade_id]) {
          tagsByTradeId[tag.trade_id] = [];
        }
        tagsByTradeId[tag.trade_id].push({
          id: tag.id,
          name: tag.name,
          color: tag.color
        });
      });

      // Attach tags to trades
      const tradesWithTags = trades.map(trade => ({
        ...trade,
        tags: tagsByTradeId[trade.id] || []
      }));

      res.json({ trades: tradesWithTags });
    } else {
      res.json({ trades: [] });
    }
  } catch (error) {
    console.error('Get trades error:', error);
    res.status(500).json({ message: 'Failed to fetch trades' });
  }
});

// Create new trade
router.post('/', modifyLimiter, createTradeValidation, (req, res) => {
  try {
    const { date, type, symbol, amount, category, fees, notes, tags } = req.body;

    // Validation
    if (!date || !type || !symbol || !amount || !category) {
      return res.status(400).json({
        message: 'Date, type, symbol, amount, and category are required'
      });
    }

    if (!['profit', 'loss', 'break-even'].includes(type)) {
      return res.status(400).json({
        message: 'Type must be profit, loss, or break-even'
      });
    }

    const result = db.prepare(`
      INSERT INTO trades (user_id, date, type, symbol, amount, category, fees, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.userId,
      new Date(date).toISOString().split('T')[0], // Format as YYYY-MM-DD
      type,
      symbol,
      parseFloat(amount),
      category,
      fees ? parseFloat(fees) : 0,
      notes || ''
    );

    const tradeId = result.lastInsertRowid;

    // Handle tags if provided
    const normalizedTags = normalizeTagNames(tags);
    if (normalizedTags.length > 0) {
      const insertTradeTag = db.prepare('INSERT INTO trade_tags (trade_id, tag_id) VALUES (?, ?)');
      const findTagByName = db.prepare('SELECT id FROM tags WHERE user_id = @userId AND LOWER(name) = LOWER(@tagName)');
      const createTag = db.prepare(`
        INSERT INTO tags (user_id, name, color, description)
        VALUES (@userId, @tagName, @color, @description)
      `);

      for (const tagName of normalizedTags) {
        // Find or create the tag
        let tag = findTagByName.get({ userId: req.userId, tagName });

        if (!tag) {
          // Create new tag with a random color
          const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6'];
          const randomColor = colors[Math.floor(Math.random() * colors.length)];
          const tagResult = createTag.run({
            userId: req.userId,
            tagName,
            color: randomColor,
            description: null
          });
          tag = { id: tagResult.lastInsertRowid };
        }

        // Link trade to tag
        try {
          insertTradeTag.run(tradeId, tag.id);
        } catch (err) {
          // Ignore duplicate key errors
          if (!err.message.includes('UNIQUE constraint failed')) {
            throw err;
          }
        }
      }
    }

    // Fetch the trade with tags
    const trade = db.prepare('SELECT * FROM trades WHERE id = ?').get(tradeId);
    const tradeTags = db.prepare(`
      SELECT t.id, t.name, t.color
      FROM tags t
      INNER JOIN trade_tags tt ON t.id = tt.tag_id
      WHERE tt.trade_id = ?
    `).all(tradeId);

    res.status(201).json({ trade: { ...trade, tags: tradeTags } });
  } catch (error) {
    console.error('Create trade error:', error);
    res.status(500).json({ message: 'Failed to create trade' });
  }
});

// Update trade
router.put('/:id', modifyLimiter, updateTradeValidation, (req, res) => {
  try {
    const { id } = req.params;
    const { date, type, symbol, amount, category, fees, notes, tags } = req.body;

    // Check if trade exists and belongs to user
    const existingTrade = db.prepare('SELECT * FROM trades WHERE id = ? AND user_id = ?').get(id, req.userId);
    if (!existingTrade) {
      return res.status(404).json({ message: 'Trade not found' });
    }

    // Validation
    if (type && !['profit', 'loss', 'break-even'].includes(type)) {
      return res.status(400).json({
        message: 'Type must be profit, loss, or break-even'
      });
    }

    db.prepare(`
      UPDATE trades
      SET date = ?,
          type = ?,
          symbol = ?,
          amount = ?,
          category = ?,
          fees = ?,
          notes = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(
      date ? new Date(date).toISOString().split('T')[0] : existingTrade.date,
      type || existingTrade.type,
      symbol || existingTrade.symbol,
      amount ? parseFloat(amount) : existingTrade.amount,
      category || existingTrade.category,
      fees !== undefined ? parseFloat(fees) : existingTrade.fees,
      notes !== undefined ? notes : existingTrade.notes,
      id,
      req.userId
    );

    // Update tags if provided
    if (tags !== undefined && Array.isArray(tags)) {
      const normalizedTags = normalizeTagNames(tags);

      // Remove existing tag associations
      db.prepare('DELETE FROM trade_tags WHERE trade_id = ?').run(id);

      // Add new tag associations
      if (normalizedTags.length > 0) {
        const insertTradeTag = db.prepare('INSERT INTO trade_tags (trade_id, tag_id) VALUES (?, ?)');
        const findTagByName = db.prepare('SELECT id FROM tags WHERE user_id = @userId AND LOWER(name) = LOWER(@tagName)');
        const createTag = db.prepare(`
          INSERT INTO tags (user_id, name, color, description)
          VALUES (@userId, @tagName, @color, @description)
        `);

        for (const tagName of normalizedTags) {
          // Find or create the tag
          let tag = findTagByName.get({ userId: req.userId, tagName });

          if (!tag) {
            // Create new tag with a random color
            const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            const tagResult = createTag.run({
              userId: req.userId,
              tagName,
              color: randomColor,
              description: null
            });
            tag = { id: tagResult.lastInsertRowid };
          }

          // Link trade to tag
          try {
            insertTradeTag.run(id, tag.id);
          } catch (err) {
            // Ignore duplicate key errors
            if (!err.message.includes('UNIQUE constraint failed')) {
              throw err;
            }
          }
        }
      }
    }

    // Fetch the trade with tags
    const trade = db.prepare('SELECT * FROM trades WHERE id = ?').get(id);
    const tradeTags = db.prepare(`
      SELECT t.id, t.name, t.color
      FROM tags t
      INNER JOIN trade_tags tt ON t.id = tt.tag_id
      WHERE tt.trade_id = ?
    `).all(id);

    res.json({ trade: { ...trade, tags: tradeTags } });
  } catch (error) {
    console.error('Update trade error:', error);
    res.status(500).json({ message: 'Failed to update trade' });
  }
});

// Delete trade
router.delete('/:id', modifyLimiter, deleteTradeValidation, (req, res) => {
  try {
    const { id } = req.params;

    const result = db.prepare('DELETE FROM trades WHERE id = ? AND user_id = ?').run(id, req.userId);

    if (result.changes === 0) {
      return res.status(404).json({ message: 'Trade not found' });
    }

    res.json({ message: 'Trade deleted successfully' });
  } catch (error) {
    console.error('Delete trade error:', error);
    res.status(500).json({ message: 'Failed to delete trade' });
  }
});

export default router;
