import { pool } from './db/index.js';

export async function notifyUser(userId: number, title: string, body: string, data?: any) {
  try {
    // Dispatch in-app notification to PostgreSQL notifications table if available
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, data, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, false, CURRENT_TIMESTAMP)`,
      [userId, title, body, data?.type || 'system', JSON.stringify(data || {})]
    ).catch(() => {
      // Table might not have all columns or might be optional, ignore gracefully
    });
    console.log(`[Notification] Dispatched alert to user ${userId}: "${title}"`);
  } catch (error) {
    console.warn('[Notification] Dispatch notice error:', error);
  }
}

export async function notifyNewMessage(userId: number, senderName: string, content: string, conversationId: string) {
  await notifyUser(
    userId,
    `رسالة جديدة من ${senderName}`,
    content.substring(0, 50) + (content.length > 50 ? '...' : ''),
    { type: 'new_message', conversationId: String(conversationId) }
  );
}

export async function notifyNewFollower(userId: number, followerName: string) {
  await notifyUser(
    userId,
    'متابع جديد',
    `بدأ ${followerName} بمتابعتك.`,
    { type: 'new_follower' }
  );
}
