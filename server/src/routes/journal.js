import express from 'express';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all journal entries for the authenticated user
router.get('/', (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = 'SELECT date, content FROM journal_entries WHERE user_id = ?';
    const params = [req.userId];

    if (startDate) {
      query += ' AND date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND date <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY date DESC';

    const entries = db.prepare(query).all(...params);

    // Convert to object format { "2024-01-15": "content", ... }
    const entriesObject = {};
    entries.forEach(entry => {
      entriesObject[entry.date] = entry.content;
    });

    res.json({ entries: entriesObject });
  } catch (error) {
    console.error('Get journal entries error:', error);
    res.status(500).json({ message: 'Failed to fetch journal entries' });
  }
});

// Get journal entry for specific date
router.get('/:date', (req, res) => {
  try {
    const { date } = req.params;

    const entry = db.prepare(
      'SELECT date, content FROM journal_entries WHERE user_id = ? AND date = ?'
    ).get(req.userId, date);

    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }

    res.json(entry);
  } catch (error) {
    console.error('Get journal entry error:', error);
    res.status(500).json({ message: 'Failed to fetch journal entry' });
  }
});

// Create or update journal entry for specific date
router.put('/:date', (req, res) => {
  try {
    const { date } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    // Check if entry exists
    const existingEntry = db.prepare(
      'SELECT id FROM journal_entries WHERE user_id = ? AND date = ?'
    ).get(req.userId, date);

    if (existingEntry) {
      // Update existing entry
      db.prepare(`
        UPDATE journal_entries
        SET content = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND date = ?
      `).run(content, req.userId, date);
    } else {
      // Create new entry
      db.prepare(`
        INSERT INTO journal_entries (user_id, date, content)
        VALUES (?, ?, ?)
      `).run(req.userId, date, content);
    }

    res.json({ date, content });
  } catch (error) {
    console.error('Save journal entry error:', error);
    res.status(500).json({ message: 'Failed to save journal entry' });
  }
});

// Delete journal entry
router.delete('/:date', (req, res) => {
  try {
    const { date } = req.params;

    const result = db.prepare(
      'DELETE FROM journal_entries WHERE user_id = ? AND date = ?'
    ).run(req.userId, date);

    if (result.changes === 0) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }

    res.json({ message: 'Journal entry deleted successfully' });
  } catch (error) {
    console.error('Delete journal entry error:', error);
    res.status(500).json({ message: 'Failed to delete journal entry' });
  }
});

export default router;
