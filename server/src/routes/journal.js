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

    let query = 'SELECT id, date, content FROM journal_entries WHERE user_id = ?';
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

    // Get tags for all entries
    const entriesWithTags = entries.map(entry => {
      const tags = db.prepare(`
        SELECT t.name, t.color
        FROM journal_tags jt
        JOIN tags t ON jt.tag_id = t.id
        WHERE jt.journal_entry_id = ?
      `).all(entry.id);

      return {
        date: entry.date,
        content: entry.content,
        tags: tags.map(tag => tag.name)
      };
    });

    // Convert to object format { "2024-01-15": { content: "...", tags: [...] }, ... }
    const entriesObject = {};
    entriesWithTags.forEach(entry => {
      entriesObject[entry.date] = {
        content: entry.content,
        tags: entry.tags
      };
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
      'SELECT id, date, content FROM journal_entries WHERE user_id = ? AND date = ?'
    ).get(req.userId, date);

    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }

    // Get tags for this entry
    const tags = db.prepare(`
      SELECT t.name, t.color
      FROM journal_tags jt
      JOIN tags t ON jt.tag_id = t.id
      WHERE jt.journal_entry_id = ?
    `).all(entry.id);

    res.json({
      date: entry.date,
      content: entry.content,
      tags: tags.map(tag => tag.name)
    });
  } catch (error) {
    console.error('Get journal entry error:', error);
    res.status(500).json({ message: 'Failed to fetch journal entry' });
  }
});

// Create or update journal entry for specific date
router.put('/:date', (req, res) => {
  try {
    const { date } = req.params;
    const { content, tags = [] } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    // Use transaction for atomic operations
    const saveJournal = db.transaction(() => {
      // Check if entry exists
      const existingEntry = db.prepare(
        'SELECT id FROM journal_entries WHERE user_id = ? AND date = ?'
      ).get(req.userId, date);

      let journalEntryId;

      if (existingEntry) {
        // Update existing entry
        db.prepare(`
          UPDATE journal_entries
          SET content = ?, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ? AND date = ?
        `).run(content, req.userId, date);
        journalEntryId = existingEntry.id;
      } else {
        // Create new entry
        const result = db.prepare(`
          INSERT INTO journal_entries (user_id, date, content)
          VALUES (?, ?, ?)
        `).run(req.userId, date, content);
        journalEntryId = result.lastInsertRowid;
      }

      // Delete existing journal tags
      db.prepare('DELETE FROM journal_tags WHERE journal_entry_id = ?').run(journalEntryId);

      // Add new tags if provided
      if (tags && tags.length > 0) {
        const insertJournalTag = db.prepare('INSERT INTO journal_tags (journal_entry_id, tag_id) VALUES (?, ?)');

        tags.forEach(tagName => {
          // Find tag by name and user_id
          const tag = db.prepare('SELECT id FROM tags WHERE user_id = ? AND name = ?').get(req.userId, tagName);
          if (tag) {
            insertJournalTag.run(journalEntryId, tag.id);
          }
        });
      }

      return journalEntryId;
    });

    saveJournal();

    res.json({ date, content, tags });
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
