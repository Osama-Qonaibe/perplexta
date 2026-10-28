import { pool } from '../db/index.js';

/**
 * Service utility to verify if a user owns or has management rights over a bulletin page.
 */
export async function verifyRecordOwnership(userId: number, recordType: 'bulletin_page', recordId: number): Promise<boolean> {
  if (!userId || !recordId) return false;

  try {
    if (recordType === 'bulletin_page') {
      const res = await pool.query(
        'SELECT id FROM bulletin_pages WHERE id = $1 AND (owner_id = $2 OR user_id = $2)',
        [recordId, userId]
      );
      return (res.rowCount ?? 0) > 0;
    }
  } catch (err: any) {
    console.error(`[Auth Service] Error verifying ${recordType} ownership:`, err.message);
  }
  return false;
}
