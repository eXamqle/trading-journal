import express from 'express';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

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

    res.json({ trades });
  } catch (error) {
    console.error('Get trades error:', error);
    res.status(500).json({ message: 'Failed to fetch trades' });
  }
});

// Create new trade
router.post('/', (req, res) => {
  try {
    const { date, type, symbol, amount, category, fees, notes } = req.body;

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

    const trade = db.prepare('SELECT * FROM trades WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ trade });
  } catch (error) {
    console.error('Create trade error:', error);
    res.status(500).json({ message: 'Failed to create trade' });
  }
});

// Update trade
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { date, type, symbol, amount, category, fees, notes } = req.body;

    // Check if trade exists and belongs to user
    const existingTrade = db.prepare('SELECT id FROM trades WHERE id = ? AND user_id = ?').get(id, req.userId);
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

    const trade = db.prepare('SELECT * FROM trades WHERE id = ?').get(id);

    res.json({ trade });
  } catch (error) {
    console.error('Update trade error:', error);
    res.status(500).json({ message: 'Failed to update trade' });
  }
});

// Delete trade
router.delete('/:id', (req, res) => {
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
