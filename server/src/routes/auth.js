import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { registerValidation, loginValidation } from '../middleware/validation.js';
import { createDefaultTagsForUser } from '../utils/defaultTags.js';

const router = express.Router();

// Register new user
router.post('/register', authLimiter, registerValidation, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 10);
    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash)
      VALUES (?, ?, ?)
    `).run(name, email, passwordHash);

    const userId = result.lastInsertRowid;

    // Create default tags for the new user
    createDefaultTagsForUser(db, userId);

    // Generate JWT token
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: '24h'
    });

    res.status(201).json({
      user: {
        id: userId,
        name,
        email,
        currency: 'USD'
      },
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Login
router.post('/login', authLimiter, loginValidation, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    // Use a dummy hash to prevent timing attacks
    const dummyHash = '$2a$10$XQFw5KYKzLk8OHBmGVvCaO7u8tVz.jxJZz1JVGxJ4SJ7bHBnJq9h6';
    const hashToCompare = user ? user.password_hash : dummyHash;

    // Always call bcrypt.compare to prevent timing attacks
    const isValidPassword = await bcrypt.compare(password, hashToCompare);

    if (!user || !isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '24h'
    });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        currency: user.currency || 'USD'
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Get current user profile
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, name, email, currency, created_at FROM users WHERE id = ?').get(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    // Check if email is taken by another user
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, req.userId);
    if (existingUser) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    // Update user
    db.prepare(`
      UPDATE users
      SET name = ?, email = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, email, req.userId);

    const user = db.prepare('SELECT id, name, email, currency FROM users WHERE id = ?').get(req.userId);
    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Update password
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    // Verify current password
    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.userId);
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    db.prepare(`
      UPDATE users
      SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newPasswordHash, req.userId);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ message: 'Failed to update password' });
  }
});

// Update currency preference
router.put('/currency', authenticateToken, (req, res) => {
  try {
    const { currency } = req.body;

    if (!currency || !['USD', 'EUR'].includes(currency)) {
      return res.status(400).json({ message: 'Valid currency is required (USD or EUR)' });
    }

    // Update currency
    db.prepare(`
      UPDATE users
      SET currency = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(currency, req.userId);

    const user = db.prepare('SELECT id, name, email, currency FROM users WHERE id = ?').get(req.userId);
    res.json(user);
  } catch (error) {
    console.error('Update currency error:', error);
    res.status(500).json({ message: 'Failed to update currency' });
  }
});

export default router;
