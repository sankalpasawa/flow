import { getDb, generateId } from './db';
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

export async function createCategory(
  userId: string,
  name: string,
  color: string,
  icon: string
): Promise<Category> {
  const db = await getDb();
  const id = generateId();
  const cats = await getCategories(userId);
  const sortOrder = cats.length;
  await db.runAsync(
    `INSERT INTO categories (id, user_id, name, color, icon, is_system, sort_order, synced)
     VALUES (?, ?, ?, ?, ?, 0, ?, 0)`,
    [id, userId, name, color, icon, sortOrder]
  );
  return { id, user_id: userId, name, color, icon, is_system: false, sort_order: sortOrder };
}

export async function updateCategory(
  id: string,
  updates: { name?: string; color?: string; icon?: string }
): Promise<void> {
  const db = await getDb();
  const fields: string[] = [];
  const values: unknown[] = [];
  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
  if (updates.color !== undefined) { fields.push('color = ?'); values.push(updates.color); }
  if (updates.icon !== undefined) { fields.push('icon = ?'); values.push(updates.icon); }
  if (fields.length === 0) return;
  values.push(id);
  await db.runAsync(
    `UPDATE categories SET ${fields.join(', ')} WHERE id = ? AND is_system = 0`,
    values
  );
}

export async function deleteCategory(id: string): Promise<void> {
  const db = await getDb();
  // Only delete custom categories
  await db.runAsync('DELETE FROM categories WHERE id = ? AND is_system = 0', [id]);
}
