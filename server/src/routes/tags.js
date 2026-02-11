import express from 'express';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { modifyLimiter } from '../middleware/rateLimiter.js';
import {
  createTagValidation,
  updateTagValidation,
  deleteTagValidation
} from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all tags for the authenticated user
router.get('/', (req, res) => {
  try {
    const tags = db.prepare('SELECT * FROM tags WHERE user_id = ? ORDER BY created_at ASC').all(req.userId);
    res.json({ tags });
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ message: 'Failed to fetch tags' });
  }
});

// Create new tag
router.post('/', modifyLimiter, createTagValidation, (req, res) => {
  try {
    const { name, color } = req.body;

    // Validation
    if (!name || !color) {
      return res.status(400).json({
        message: 'Name and color are required'
      });
    }

    // Check for duplicate tag name for this user
    const existing = db.prepare('SELECT id FROM tags WHERE user_id = ? AND LOWER(name) = LOWER(?)').get(req.userId, name);
    if (existing) {
      return res.status(400).json({
        message: 'A tag with this name already exists'
      });
    }

    const result = db.prepare(`
      INSERT INTO tags (user_id, name, color)
      VALUES (?, ?, ?)
    `).run(req.userId, name, color);

    const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ tag });
  } catch (error) {
    console.error('Create tag error:', error);
    res.status(500).json({ message: 'Failed to create tag' });
  }
});

// Update tag
router.put('/:id', modifyLimiter, updateTagValidation, (req, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;

    // Check if tag exists and belongs to user
    const existingTag = db.prepare('SELECT * FROM tags WHERE id = ? AND user_id = ?').get(id, req.userId);
    if (!existingTag) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    // If name is being updated, check for duplicates
    if (name && name.toLowerCase() !== existingTag.name.toLowerCase()) {
      const duplicate = db.prepare('SELECT id FROM tags WHERE user_id = ? AND LOWER(name) = LOWER(?) AND id != ?').get(req.userId, name, id);
      if (duplicate) {
        return res.status(400).json({
          message: 'A tag with this name already exists'
        });
      }
    }

    db.prepare(`
      UPDATE tags
      SET name = ?,
          color = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(
      name || existingTag.name,
      color || existingTag.color,
      id,
      req.userId
    );

    const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(id);

    res.json({ tag });
  } catch (error) {
    console.error('Update tag error:', error);
    res.status(500).json({ message: 'Failed to update tag' });
  }
});

// Delete tag
router.delete('/:id', modifyLimiter, deleteTagValidation, (req, res) => {
  try {
    const { id } = req.params;

    const result = db.prepare('DELETE FROM tags WHERE id = ? AND user_id = ?').run(id, req.userId);

    if (result.changes === 0) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Delete tag error:', error);
    res.status(500).json({ message: 'Failed to delete tag' });
  }
});

export default router;
