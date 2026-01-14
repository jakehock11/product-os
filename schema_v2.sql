-- Product OS Schema v2 — New Entity Types
-- Migration: 002_new_entity_types.sql
-- 
-- This migration adds support for:
-- - Feedback
-- - Feature Request  
-- - Feature (with check-ins)
--
-- Run AFTER verifying existing data is backed up.

-- ============================================
-- Update entity type enum values
-- ============================================
-- SQLite doesn't have enums, so this is enforced in application code.
-- New valid types: 'capture', 'problem', 'hypothesis', 'experiment', 
--                  'decision', 'artifact', 'feedback', 'feature_request', 'feature'


-- ============================================
-- Add new columns to entities table
-- ============================================

-- For Feedback entities
-- feedback_type: 'praise' | 'complaint' | 'bug' | 'suggestion' | 'question' | 'other'
ALTER TABLE entities ADD COLUMN feedback_type TEXT;

-- For Feedback and Feature Request entities
-- source: who/where it came from
ALTER TABLE entities ADD COLUMN source TEXT;

-- source_url: link to original (Slack, email, etc.)
ALTER TABLE entities ADD COLUMN source_url TEXT;

-- For Feature Request entities
-- priority: 'low' | 'medium' | 'high' | 'critical'
ALTER TABLE entities ADD COLUMN priority TEXT;

-- declined_reason: why a feature request was declined
ALTER TABLE entities ADD COLUMN declined_reason TEXT;

-- linked_problem_id: Problem this request addresses
ALTER TABLE entities ADD COLUMN linked_problem_id TEXT REFERENCES entities(id);

-- linked_feature_id: Feature that fulfilled this request
ALTER TABLE entities ADD COLUMN linked_feature_id TEXT REFERENCES entities(id);

-- For Feature entities
-- health: 'healthy' | 'needs_attention' | 'underperforming'
ALTER TABLE entities ADD COLUMN health TEXT;

-- shipped_at: when the feature shipped
ALTER TABLE entities ADD COLUMN shipped_at TEXT;

-- check_ins: JSON array of check-in objects
-- Structure: [{ id, date, health, notes, metrics }]
ALTER TABLE entities ADD COLUMN check_ins TEXT DEFAULT '[]';

-- promoted_from_id: link back to source entity when promoted
-- (captures already have promoted_to_id, this is the reverse link)
ALTER TABLE entities ADD COLUMN promoted_from_id TEXT REFERENCES entities(id);


-- ============================================
-- New status values by entity type
-- ============================================
-- 
-- Feedback statuses:
--   'new', 'reviewed', 'actioned', 'archived'
--
-- Feature Request statuses:
--   'new', 'considering', 'planned', 'in_progress', 'shipped', 'declined'
--
-- Feature statuses:
--   'building', 'shipped', 'monitoring', 'stable', 'deprecated'
--
-- These are enforced in application code, not database constraints.


-- ============================================
-- Indexes for new columns
-- ============================================

CREATE INDEX IF NOT EXISTS idx_entities_feedback_type ON entities(feedback_type);
CREATE INDEX IF NOT EXISTS idx_entities_priority ON entities(priority);
CREATE INDEX IF NOT EXISTS idx_entities_health ON entities(health);
CREATE INDEX IF NOT EXISTS idx_entities_shipped_at ON entities(shipped_at);
CREATE INDEX IF NOT EXISTS idx_entities_promoted_from_id ON entities(promoted_from_id);


-- ============================================
-- Feature-to-Decision linking table
-- ============================================
-- Features can link to multiple decisions (the decisions that led to shipping)

CREATE TABLE IF NOT EXISTS feature_decisions (
  feature_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  decision_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  PRIMARY KEY (feature_id, decision_id)
);


-- ============================================
-- Feature-to-Experiment linking table
-- ============================================
-- Features can link to multiple experiments (that validated the feature)

CREATE TABLE IF NOT EXISTS feature_experiments (
  feature_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  experiment_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  PRIMARY KEY (feature_id, experiment_id)
);


-- ============================================
-- Feature-to-FeatureRequest linking table
-- ============================================
-- Features can link to multiple feature requests (that they fulfill)

CREATE TABLE IF NOT EXISTS feature_requests_fulfilled (
  feature_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  request_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  PRIMARY KEY (feature_id, request_id)
);


-- ============================================
-- Migration verification query
-- ============================================
-- Run this to verify the migration succeeded:
--
-- SELECT 
--   sql 
-- FROM 
--   sqlite_master 
-- WHERE 
--   type = 'table' AND name = 'entities';
--
-- Should show all new columns.
