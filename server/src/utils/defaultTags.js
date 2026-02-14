/**
 * Default tags created for new users
 * Discipline-level tags to help track trading execution quality
 */
export const defaultTags = [
  {
    name: 'FATAL',
    color: '#991b1b',
    description: 'Complete system breakdown. You blew past risk limits, traded on pure tilt, or removed a stop-loss. This is the gambler taking the wheel.'
  },
  {
    name: 'VALID',
    color: '#6b7280',
    description: 'The baseline acceptable standard. You checked the parameters and executed the logic, even if it felt uncomfortable or you hesitated slightly.'
  },
  {
    name: 'OPTIMAL',
    color: '#3b82f6',
    description: 'Absolute algorithmic discipline. A textbook setup met with flawless, robotic execution. You were completely detached from the monetary outcome.'
  }
];

/**
 * Creates default tags for a user
 * @param {Object} db - Database instance
 * @param {number} userId - User ID to create tags for
 */
export function createDefaultTagsForUser(db, userId) {
  const insertTag = db.prepare('INSERT INTO tags (user_id, name, color, description) VALUES (?, ?, ?, ?)');

  for (const tag of defaultTags) {
    insertTag.run(userId, tag.name, tag.color, tag.description || null);
  }
}
