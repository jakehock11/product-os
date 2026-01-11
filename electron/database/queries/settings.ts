import { getDatabase } from '../db';

// Settings interface (matches types.ts)
export interface Settings {
  id: number;
  workspacePath: string | null;
  lastProductId: string | null;
  restoreLastContext: boolean;
  defaultExportMode: 'full' | 'incremental';
  defaultIncrementalRange: 'since_last_export' | 'last_7_days' | 'last_30_days' | 'custom';
  includeLinkedContext: boolean;
  createdAt: string;
  updatedAt: string;
}

// Database row type (snake_case)
interface SettingsRow {
  id: number;
  workspace_path: string | null;
  last_product_id: string | null;
  restore_last_context: number;
  default_export_mode: string;
  default_incremental_range: string;
  include_linked_context: number;
  created_at: string;
  updated_at: string;
}

// Update data type
export interface UpdateSettingsData {
  workspacePath?: string | null;
  lastProductId?: string | null;
  restoreLastContext?: boolean;
  defaultExportMode?: 'full' | 'incremental';
  defaultIncrementalRange?: string;
  includeLinkedContext?: boolean;
}

// Convert database row to Settings object (snake_case to camelCase)
function rowToSettings(row: SettingsRow): Settings {
  return {
    id: row.id,
    workspacePath: row.workspace_path,
    lastProductId: row.last_product_id,
    restoreLastContext: row.restore_last_context === 1,
    defaultExportMode: row.default_export_mode as 'full' | 'incremental',
    defaultIncrementalRange: row.default_incremental_range as Settings['defaultIncrementalRange'],
    includeLinkedContext: row.include_linked_context === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Initialize settings row if it doesn't exist
function ensureSettingsRow(): void {
  const db = getDatabase();
  const now = new Date().toISOString();

  // Insert default settings if the row doesn't exist
  db.prepare(`
    INSERT OR IGNORE INTO settings (
      id, workspace_path, last_product_id, restore_last_context,
      default_export_mode, default_incremental_range, include_linked_context,
      created_at, updated_at
    )
    VALUES (1, NULL, NULL, 1, 'incremental', 'since_last_export', 1, ?, ?)
  `).run(now, now);
}

// Get settings
export function getSettings(): Settings {
  const db = getDatabase();
  ensureSettingsRow();

  const row = db.prepare(`
    SELECT id, workspace_path, last_product_id, restore_last_context,
           default_export_mode, default_incremental_range, include_linked_context,
           created_at, updated_at
    FROM settings
    WHERE id = 1
  `).get() as SettingsRow;

  return rowToSettings(row);
}

// Update settings
export function updateSettings(data: UpdateSettingsData): Settings {
  const db = getDatabase();
  ensureSettingsRow();

  const now = new Date().toISOString();
  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (data.workspacePath !== undefined) {
    updates.push('workspace_path = ?');
    values.push(data.workspacePath);
  }
  if (data.lastProductId !== undefined) {
    updates.push('last_product_id = ?');
    values.push(data.lastProductId);
  }
  if (data.restoreLastContext !== undefined) {
    updates.push('restore_last_context = ?');
    values.push(data.restoreLastContext ? 1 : 0);
  }
  if (data.defaultExportMode !== undefined) {
    updates.push('default_export_mode = ?');
    values.push(data.defaultExportMode);
  }
  if (data.defaultIncrementalRange !== undefined) {
    updates.push('default_incremental_range = ?');
    values.push(data.defaultIncrementalRange);
  }
  if (data.includeLinkedContext !== undefined) {
    updates.push('include_linked_context = ?');
    values.push(data.includeLinkedContext ? 1 : 0);
  }

  if (updates.length === 0) {
    return getSettings();
  }

  // Always update the updated_at timestamp
  updates.push('updated_at = ?');
  values.push(now);

  db.prepare(`
    UPDATE settings
    SET ${updates.join(', ')}
    WHERE id = 1
  `).run(...values);

  return getSettings();
}

// Clear all data (products, entities, taxonomy, relationships)
export function clearAllData(): void {
  const db = getDatabase();

  // Delete in order to respect foreign key constraints
  // (though CASCADE should handle it, being explicit is safer)
  db.exec(`
    DELETE FROM entity_dimension_values;
    DELETE FROM entity_features;
    DELETE FROM entity_personas;
    DELETE FROM relationships;
    DELETE FROM entities;
    DELETE FROM dimension_values;
    DELETE FROM dimensions;
    DELETE FROM features;
    DELETE FROM personas;
    DELETE FROM exports;
    DELETE FROM products;
  `);
}
