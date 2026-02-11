/**
 * Default tags created for new users
 * Psychology/Emotional tags to help track trading discipline
 */
export const defaultTags = [
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
