import type { Category, ExpenseEntry } from '../../core/types';
import type { StoragePort } from '../../core/storage/storagePort';

export function canDeleteCategory(categoryId: string, entries: ExpenseEntry[]): boolean {
  return !entries.some((e) => e.category === categoryId);
}

export function addCategory(storage: StoragePort, categories: Category[], name: string): Category[] {
  const trimmed = name.trim();
  const updated = [...categories, { id: crypto.randomUUID(), name: trimmed }];
  storage.setCategories(updated);
  return updated;
}

export function renameCategory(storage: StoragePort, categories: Category[], id: string, newName: string): Category[] {
  const updated = categories.map((c) => (c.id === id ? { ...c, name: newName.trim() } : c));
  storage.setCategories(updated);
  return updated;
}

/** Returns null (blocked) if the category still has transactions referencing it — the
 * caller decides how to surface that (CR2 Q3: reassign/delete transactions first). */
export function deleteCategory(storage: StoragePort, categories: Category[], entries: ExpenseEntry[], id: string): Category[] | null {
  if (!canDeleteCategory(id, entries)) return null;
  const updated = categories.filter((c) => c.id !== id);
  storage.setCategories(updated);
  return updated;
}
