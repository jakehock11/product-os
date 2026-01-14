-- Product OS SQLite Schema
-- All timestamps stored as ISO 8601 TEXT

PRAGMA foreign_keys = ON;

-- ============================================
-- Products (top-level container)
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_activity_at TEXT NOT NULL
);

-- ============================================
-- Taxonomy Tables (per-product)
-- ============================================

CREATE TABLE IF NOT EXISTS personas (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_archived INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS features (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_archived INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS dimensions (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_archived INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS dimension_values (
  id TEXT PRIMARY KEY,
  dimension_id TEXT NOT NULL REFERENCES dimensions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_archived INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- ============================================
-- Entities (all reasoning objects)
-- ============================================

CREATE TABLE IF NOT EXISTS entities (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('capture', 'problem', 'hypothesis', 'experiment', 'decision', 'artifact', 'feedback', 'feature_request', 'feature')),
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  status TEXT,
  metadata TEXT, -- JSON for type-specific fields
  promoted_to_id TEXT REFERENCES entities(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- ============================================
-- Entity-Taxonomy Junction Tables
-- ============================================

CREATE TABLE IF NOT EXISTS entity_personas (
  entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  persona_id TEXT NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  PRIMARY KEY (entity_id, persona_id)
);

CREATE TABLE IF NOT EXISTS entity_features (
  entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  feature_id TEXT NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  PRIMARY KEY (entity_id, feature_id)
);

CREATE TABLE IF NOT EXISTS entity_dimension_values (
  entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  dimension_value_id TEXT NOT NULL REFERENCES dimension_values(id) ON DELETE CASCADE,
  PRIMARY KEY (entity_id, dimension_value_id)
);

-- ============================================
-- Relationships (edges between entities)
-- ============================================

CREATE TABLE IF NOT EXISTS relationships (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  source_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  target_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  relationship_type TEXT, -- 'supports', 'tests', 'informs', 'evidence', etc.
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- ============================================
-- Export History
-- ============================================

CREATE TABLE IF NOT EXISTS exports (
  id TEXT PRIMARY KEY,
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  mode TEXT NOT NULL CHECK (mode IN ('full', 'incremental')),
  scope_type TEXT NOT NULL, -- 'product', 'all'
  start_date TEXT, -- for incremental exports
  end_date TEXT NOT NULL,
  counts TEXT NOT NULL, -- JSON: { total, byType, newCount, updatedCount }
  output_path TEXT,
  created_at TEXT NOT NULL
);

-- ============================================
-- Settings (single row)
-- ============================================

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1), -- ensures single row
  workspace_path TEXT,
  last_product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  restore_last_context INTEGER DEFAULT 1,
  default_export_mode TEXT DEFAULT 'incremental',
  default_incremental_range TEXT DEFAULT 'since_last_export',
  include_linked_context INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- ============================================
-- Indexes
-- ============================================

-- Entity queries
CREATE INDEX IF NOT EXISTS idx_entities_product_id ON entities(product_id);
CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type);
CREATE INDEX IF NOT EXISTS idx_entities_status ON entities(status);
CREATE INDEX IF NOT EXISTS idx_entities_updated_at ON entities(updated_at);
CREATE INDEX IF NOT EXISTS idx_entities_product_type ON entities(product_id, type);

-- Relationship queries
CREATE INDEX IF NOT EXISTS idx_relationships_source ON relationships(source_id);
CREATE INDEX IF NOT EXISTS idx_relationships_target ON relationships(target_id);
CREATE INDEX IF NOT EXISTS idx_relationships_product ON relationships(product_id);

-- Taxonomy queries
CREATE INDEX IF NOT EXISTS idx_personas_product ON personas(product_id);
CREATE INDEX IF NOT EXISTS idx_features_product ON features(product_id);
CREATE INDEX IF NOT EXISTS idx_dimensions_product ON dimensions(product_id);
CREATE INDEX IF NOT EXISTS idx_dimension_values_dimension ON dimension_values(dimension_id);

-- Junction table queries
CREATE INDEX IF NOT EXISTS idx_entity_personas_entity ON entity_personas(entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_personas_persona ON entity_personas(persona_id);
CREATE INDEX IF NOT EXISTS idx_entity_features_entity ON entity_features(entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_features_feature ON entity_features(feature_id);
CREATE INDEX IF NOT EXISTS idx_entity_dimension_values_entity ON entity_dimension_values(entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_dimension_values_value ON entity_dimension_values(dimension_value_id);

-- Export queries
CREATE INDEX IF NOT EXISTS idx_exports_product ON exports(product_id);
CREATE INDEX IF NOT EXISTS idx_exports_created ON exports(created_at);
