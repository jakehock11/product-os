import { nanoid } from 'nanoid';
import { getDatabase } from '../db';
import type { EntityType } from './entities';

// ============================================
// Types
// ============================================

export interface Relationship {
  id: string;
  productId: string;
  sourceId: string;
  targetId: string;
  relationshipType: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RelationshipWithEntity extends Relationship {
  linkedEntity: {
    id: string;
    type: EntityType;
    title: string;
    status: string | null;
  };
  direction: 'outgoing' | 'incoming';
}

export interface CreateRelationshipData {
  sourceId: string;
  targetId: string;
  relationshipType?: string;
  productId: string;
}

// ============================================
// Row Types (from database)
// ============================================

interface RelationshipRow {
  id: string;
  product_id: string;
  source_id: string;
  target_id: string;
  relationship_type: string | null;
  created_at: string;
  updated_at: string;
}

interface RelationshipWithEntityRow extends RelationshipRow {
  entity_id: string;
  entity_type: string;
  entity_title: string;
  entity_status: string | null;
}

// ============================================
// Helpers
// ============================================

function rowToRelationship(row: RelationshipRow): Relationship {
  return {
    id: row.id,
    productId: row.product_id,
    sourceId: row.source_id,
    targetId: row.target_id,
    relationshipType: row.relationship_type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToRelationshipWithEntity(
  row: RelationshipWithEntityRow,
  direction: 'outgoing' | 'incoming'
): RelationshipWithEntity {
  return {
    id: row.id,
    productId: row.product_id,
    sourceId: row.source_id,
    targetId: row.target_id,
    relationshipType: row.relationship_type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    linkedEntity: {
      id: row.entity_id,
      type: row.entity_type as EntityType,
      title: row.entity_title,
      status: row.entity_status,
    },
    direction,
  };
}

// ============================================
// Query Functions
// ============================================

// Get all relationships for an entity (both directions)
export function getRelationshipsForEntity(entityId: string): RelationshipWithEntity[] {
  const outgoing = getOutgoingRelationships(entityId);
  const incoming = getIncomingRelationships(entityId);
  return [...outgoing, ...incoming];
}

// Get outgoing relationships (where entity is the source)
export function getOutgoingRelationships(entityId: string): RelationshipWithEntity[] {
  const db = getDatabase();

  const rows = db.prepare(`
    SELECT
      r.id,
      r.product_id,
      r.source_id,
      r.target_id,
      r.relationship_type,
      r.created_at,
      r.updated_at,
      e.id as entity_id,
      e.type as entity_type,
      e.title as entity_title,
      e.status as entity_status
    FROM relationships r
    JOIN entities e ON r.target_id = e.id
    WHERE r.source_id = ?
    ORDER BY r.created_at DESC
  `).all(entityId) as RelationshipWithEntityRow[];

  return rows.map(row => rowToRelationshipWithEntity(row, 'outgoing'));
}

// Get incoming relationships (where entity is the target)
export function getIncomingRelationships(entityId: string): RelationshipWithEntity[] {
  const db = getDatabase();

  const rows = db.prepare(`
    SELECT
      r.id,
      r.product_id,
      r.source_id,
      r.target_id,
      r.relationship_type,
      r.created_at,
      r.updated_at,
      e.id as entity_id,
      e.type as entity_type,
      e.title as entity_title,
      e.status as entity_status
    FROM relationships r
    JOIN entities e ON r.source_id = e.id
    WHERE r.target_id = ?
    ORDER BY r.created_at DESC
  `).all(entityId) as RelationshipWithEntityRow[];

  return rows.map(row => rowToRelationshipWithEntity(row, 'incoming'));
}

// Create a new relationship
export function createRelationship(data: CreateRelationshipData): Relationship {
  const db = getDatabase();
  const now = new Date().toISOString();
  const id = `rel_${nanoid()}`;

  db.prepare(`
    INSERT INTO relationships (id, product_id, source_id, target_id, relationship_type, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.productId,
    data.sourceId,
    data.targetId,
    data.relationshipType || null,
    now,
    now
  );

  return getRelationshipById(id)!;
}

// Get a relationship by ID
export function getRelationshipById(id: string): Relationship | null {
  const db = getDatabase();

  const row = db.prepare(`
    SELECT * FROM relationships WHERE id = ?
  `).get(id) as RelationshipRow | undefined;

  return row ? rowToRelationship(row) : null;
}

// Delete a relationship
export function deleteRelationship(id: string): void {
  const db = getDatabase();
  db.prepare('DELETE FROM relationships WHERE id = ?').run(id);
}

// Check if a relationship already exists between two entities
export function relationshipExists(sourceId: string, targetId: string): boolean {
  const db = getDatabase();

  const row = db.prepare(`
    SELECT id FROM relationships
    WHERE source_id = ? AND target_id = ?
  `).get(sourceId, targetId);

  return !!row;
}
