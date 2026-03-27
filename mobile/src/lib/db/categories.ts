import { getDb } from './db';
import { Category } from '../../types';
import { SYSTEM_CATEGORIES } from '../../features/categories/systemCategories';

export async function seedSystemCategories(): Promise<void> {
  const db = await getDb();
  for (const cat of SYSTEM_CATEGORIES) {
    await db.runAsync(
      `INSERT OR IGNORE INTO categories (id, user_id, name, color, icon, is_system, sort_order, synced)
       VALUES (?, ?, ?, ?, ?, 1, ?, 1)`,
      [cat.id, cat.user_id, cat.name, cat.color, cat.icon, cat.sort_order]
    );
  }
}

export async function getCategories(userId: string): Promise<Category[]> {
  const db = await getDb();
  return db.getAllAsync<Category>(
    `SELECT * FROM categories
     WHERE user_id IS NULL OR user_id = ?
     ORDER BY is_system DESC, sort_order ASC`,
    [userId]
  );
}
