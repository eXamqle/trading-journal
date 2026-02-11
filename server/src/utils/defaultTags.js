/**
 * Default tags created for new users
 * These tags help users get started with common trading strategies and emotional patterns
 */
export const defaultTags = [
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

/**
 * Creates default tags for a user
 * @param {Object} db - Database instance
 * @param {number} userId - User ID to create tags for
 */
export function createDefaultTagsForUser(db, userId) {
  const insertTag = db.prepare('INSERT INTO tags (user_id, name, color) VALUES (?, ?, ?)');

  for (const tag of defaultTags) {
    insertTag.run(userId, tag.name, tag.color);
  }
}
