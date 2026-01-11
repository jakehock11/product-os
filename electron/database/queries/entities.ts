import { getDatabase } from '../db';
import { nanoid } from 'nanoid';
import { touchProduct } from './products';

// ============================================
// Type Definitions
// ============================================

export type EntityType = 'capture' | 'problem' | 'hypothesis' | 'experiment' | 'decision' | 'artifact';

export interface Entity {
  id: string;
  productId: string;
  type: EntityType;
  title: string;
  body: string;
  status: string | null;
  metadata: Record<string, unknown> | null;
  promotedToId: string | null;
  createdAt: string;
  updatedAt: string;
  // Context tags
  personaIds: string[];
  featureIds: string[];
  dimensionValueIds: string[];
}

export interface CreateEntityData {
  productId: string;
  type: EntityType;
  title?: string;
  body?: string;
  status?: string;
  personaIds?: string[];
  featureIds?: string[];
  dimensionValueIds?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateEntityData {
  title?: string;
  body?: string;
  status?: string;
  personaIds?: string[];
  featureIds?: string[];
  dimensionValueIds?: string[];
  metadata?: Record<string, unknown>;
}

export interface EntityFilters {
  type?: EntityType;
  status?: string;
  search?: string;
  personaIds?: string[];
  featureIds?: string[];
  dimensionValueIds?: string[];
}

// Database row type
interface EntityRow {
  id: string;
  product_id: string;
  type: string;
  title: string;
  body: string;
  status: string | null;
  metadata: string | null;
  promoted_to_id: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// ID Generation
// ============================================

const ID_PREFIXES: Record<EntityType, string> = {
  capture: 'cap_',
  problem: 'prob_',
  hypothesis: 'hyp_',
  experiment: 'exp_',
  decision: 'dec_',
  artifact: 'art_',
};

function generateEntityId(type: EntityType): string {
  return `${ID_PREFIXES[type]}${nanoid(12)}`;
}

// ============================================
// Row Converters
// ============================================

function rowToEntity(row: EntityRow, personaIds: string[], featureIds: string[], dimensionValueIds: string[]): Entity {
  return {
    id: row.id,
    productId: row.product_id,
    type: row.type as EntityType,
    title: row.title,
    body: row.body,
    status: row.status,
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
    promotedToId: row.promoted_to_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    personaIds,
    featureIds,
    dimensionValueIds,
  };
}

// ============================================
// Junction Table Helpers
// ============================================

function getEntityPersonaIds(entityId: string): string[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT persona_id FROM entity_personas WHERE entity_id = ?').all(entityId) as { persona_id: string }[];
  return rows.map(r => r.persona_id);
}

function getEntityFeatureIds(entityId: string): string[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT feature_id FROM entity_features WHERE entity_id = ?').all(entityId) as { feature_id: string }[];
  return rows.map(r => r.feature_id);
}

function getEntityDimensionValueIds(entityId: string): string[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT dimension_value_id FROM entity_dimension_values WHERE entity_id = ?').all(entityId) as { dimension_value_id: string }[];
  return rows.map(r => r.dimension_value_id);
}

function setEntityPersonas(entityId: string, personaIds: string[]): void {
  const db = getDatabase();
  // Delete existing
  db.prepare('DELETE FROM entity_personas WHERE entity_id = ?').run(entityId);
  // Insert new
  const insert = db.prepare('INSERT INTO entity_personas (entity_id, persona_id) VALUES (?, ?)');
  for (const personaId of personaIds) {
    insert.run(entityId, personaId);
  }
}

function setEntityFeatures(entityId: string, featureIds: string[]): void {
  const db = getDatabase();
  // Delete existing
  db.prepare('DELETE FROM entity_features WHERE entity_id = ?').run(entityId);
  // Insert new
  const insert = db.prepare('INSERT INTO entity_features (entity_id, feature_id) VALUES (?, ?)');
  for (const featureId of featureIds) {
    insert.run(entityId, featureId);
  }
}

function setEntityDimensionValues(entityId: string, dimensionValueIds: string[]): void {
  const db = getDatabase();
  // Delete existing
  db.prepare('DELETE FROM entity_dimension_values WHERE entity_id = ?').run(entityId);
  // Insert new
  const insert = db.prepare('INSERT INTO entity_dimension_values (entity_id, dimension_value_id) VALUES (?, ?)');
  for (const valueId of dimensionValueIds) {
    insert.run(entityId, valueId);
  }
}

// ============================================
// CRUD Functions
// ============================================

export function getEntities(productId: string, filters: EntityFilters = {}): Entity[] {
  const db = getDatabase();

  let query = `SELECT * FROM entities WHERE product_id = ?`;
  const params: (string | number)[] = [productId];

  // Type filter
  if (filters.type) {
    query += ` AND type = ?`;
    params.push(filters.type);
  }

  // Status filter
  if (filters.status) {
    query += ` AND status = ?`;
    params.push(filters.status);
  }

  // Search filter (LIKE on title and body)
  if (filters.search) {
    query += ` AND (title LIKE ? OR body LIKE ?)`;
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm);
  }

  query += ` ORDER BY updated_at DESC`;

  const rows = db.prepare(query).all(...params) as EntityRow[];

  // Load context tags for each entity
  return rows.map(row => {
    const personaIds = getEntityPersonaIds(row.id);
    const featureIds = getEntityFeatureIds(row.id);
    const dimensionValueIds = getEntityDimensionValueIds(row.id);
    return rowToEntity(row, personaIds, featureIds, dimensionValueIds);
  });
}

export function getEntityById(id: string): Entity | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM entities WHERE id = ?').get(id) as EntityRow | undefined;

  if (!row) return null;

  const personaIds = getEntityPersonaIds(id);
  const featureIds = getEntityFeatureIds(id);
  const dimensionValueIds = getEntityDimensionValueIds(id);

  return rowToEntity(row, personaIds, featureIds, dimensionValueIds);
}

export function createEntity(data: CreateEntityData): Entity {
  const db = getDatabase();
  const id = generateEntityId(data.type);
  const now = new Date().toISOString();

  // Determine default status based on type
  let defaultStatus: string | null = null;
  switch (data.type) {
    case 'problem':
      defaultStatus = 'active';
      break;
    case 'hypothesis':
      defaultStatus = 'draft';
      break;
    case 'experiment':
      defaultStatus = 'planned';
      break;
    case 'artifact':
      defaultStatus = 'draft';
      break;
    // capture and decision have no status
  }

  const status = data.status || defaultStatus;

  db.prepare(`
    INSERT INTO entities (id, product_id, type, title, body, status, metadata, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.productId,
    data.type,
    data.title || '',
    data.body || '',
    status,
    data.metadata ? JSON.stringify(data.metadata) : null,
    now,
    now
  );

  // Set context tags
  if (data.personaIds?.length) {
    setEntityPersonas(id, data.personaIds);
  }
  if (data.featureIds?.length) {
    setEntityFeatures(id, data.featureIds);
  }
  if (data.dimensionValueIds?.length) {
    setEntityDimensionValues(id, data.dimensionValueIds);
  }

  // Touch the product's last_activity_at
  touchProduct(data.productId);

  const entity = getEntityById(id);
  if (!entity) throw new Error('Failed to create entity');
  return entity;
}

export function updateEntity(id: string, data: UpdateEntityData): Entity {
  const db = getDatabase();
  const now = new Date().toISOString();

  // Build dynamic update query
  const updates: string[] = [];
  const values: (string | null)[] = [];

  if (data.title !== undefined) {
    updates.push('title = ?');
    values.push(data.title);
  }
  if (data.body !== undefined) {
    updates.push('body = ?');
    values.push(data.body);
  }
  if (data.status !== undefined) {
    updates.push('status = ?');
    values.push(data.status);
  }
  if (data.metadata !== undefined) {
    updates.push('metadata = ?');
    values.push(data.metadata ? JSON.stringify(data.metadata) : null);
  }

  // Always update timestamp
  updates.push('updated_at = ?');
  values.push(now);

  values.push(id);

  const result = db.prepare(`UPDATE entities SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  if (result.changes === 0) throw new Error(`Entity not found: ${id}`);

  // Update context tags if provided
  if (data.personaIds !== undefined) {
    setEntityPersonas(id, data.personaIds);
  }
  if (data.featureIds !== undefined) {
    setEntityFeatures(id, data.featureIds);
  }
  if (data.dimensionValueIds !== undefined) {
    setEntityDimensionValues(id, data.dimensionValueIds);
  }

  // Get the entity to find productId and touch it
  const entity = getEntityById(id);
  if (!entity) throw new Error('Failed to retrieve updated entity');

  touchProduct(entity.productId);

  return entity;
}

export function deleteEntity(id: string): void {
  const db = getDatabase();

  // Get productId before deletion to touch the product
  const entity = getEntityById(id);
  if (!entity) throw new Error(`Entity not found: ${id}`);

  const result = db.prepare('DELETE FROM entities WHERE id = ?').run(id);
  if (result.changes === 0) throw new Error(`Entity not found: ${id}`);

  // Touch the product
  touchProduct(entity.productId);
}

export function promoteCapture(captureId: string, targetType: EntityType): Entity {
  const db = getDatabase();

  // Get the capture
  const capture = getEntityById(captureId);
  if (!capture) throw new Error(`Capture not found: ${captureId}`);
  if (capture.type !== 'capture') throw new Error(`Entity ${captureId} is not a capture`);
  if (capture.promotedToId) throw new Error(`Capture ${captureId} has already been promoted`);

  // Create new entity of target type
  const newEntity = createEntity({
    productId: capture.productId,
    type: targetType,
    title: capture.title,
    body: capture.body,
    personaIds: capture.personaIds,
    featureIds: capture.featureIds,
    dimensionValueIds: capture.dimensionValueIds,
  });

  // Update capture's promoted_to_id
  const now = new Date().toISOString();
  db.prepare('UPDATE entities SET promoted_to_id = ?, updated_at = ? WHERE id = ?')
    .run(newEntity.id, now, captureId);

  return newEntity;
}

// ============================================
// Utility Functions
// ============================================

// Get entities by IDs (useful for relationship display)
export function getEntitiesByIds(ids: string[]): Entity[] {
  if (ids.length === 0) return [];

  const db = getDatabase();
  const placeholders = ids.map(() => '?').join(',');
  const rows = db.prepare(`SELECT * FROM entities WHERE id IN (${placeholders})`).all(...ids) as EntityRow[];

  return rows.map(row => {
    const personaIds = getEntityPersonaIds(row.id);
    const featureIds = getEntityFeatureIds(row.id);
    const dimensionValueIds = getEntityDimensionValueIds(row.id);
    return rowToEntity(row, personaIds, featureIds, dimensionValueIds);
  });
}

// Get entity summary (lighter weight, for lists)
export function getEntitySummary(id: string): { id: string; type: EntityType; title: string; status: string | null } | null {
  const db = getDatabase();
  const row = db.prepare('SELECT id, type, title, status FROM entities WHERE id = ?').get(id) as { id: string; type: string; title: string; status: string | null } | undefined;

  if (!row) return null;

  return {
    id: row.id,
    type: row.type as EntityType,
    title: row.title,
    status: row.status,
  };
}
