import { getDatabase } from '../database/db';
import type { Entity, EntityType } from '../database/queries/entities';

// ============================================
// Types for Context Resolution
// ============================================

interface ResolvedContext {
  personas: string[];
  features: string[];
  dimensions: Record<string, string[]>; // dimensionName -> valueNames[]
}

interface ResolvedLink {
  target_id: string;
  type: EntityType;
  title: string;
  relationship: string | null;
}

// ============================================
// Context Resolution Functions
// ============================================

function resolvePersonaNames(personaIds: string[]): string[] {
  if (personaIds.length === 0) return [];

  const db = getDatabase();
  const placeholders = personaIds.map(() => '?').join(',');
  const rows = db.prepare(
    `SELECT name FROM personas WHERE id IN (${placeholders})`
  ).all(...personaIds) as { name: string }[];

  return rows.map(r => r.name);
}

function resolveFeatureNames(featureIds: string[]): string[] {
  if (featureIds.length === 0) return [];

  const db = getDatabase();
  const placeholders = featureIds.map(() => '?').join(',');
  const rows = db.prepare(
    `SELECT name FROM features WHERE id IN (${placeholders})`
  ).all(...featureIds) as { name: string }[];

  return rows.map(r => r.name);
}

function resolveDimensionValues(dimensionValueIds: string[]): Record<string, string[]> {
  if (dimensionValueIds.length === 0) return {};

  const db = getDatabase();
  const placeholders = dimensionValueIds.map(() => '?').join(',');
  const rows = db.prepare(`
    SELECT d.name as dimension_name, dv.name as value_name
    FROM dimension_values dv
    JOIN dimensions d ON dv.dimension_id = d.id
    WHERE dv.id IN (${placeholders})
  `).all(...dimensionValueIds) as { dimension_name: string; value_name: string }[];

  const result: Record<string, string[]> = {};
  for (const row of rows) {
    if (!result[row.dimension_name]) {
      result[row.dimension_name] = [];
    }
    result[row.dimension_name].push(row.value_name);
  }

  return result;
}

export function resolveContext(entity: Entity): ResolvedContext {
  return {
    personas: resolvePersonaNames(entity.personaIds),
    features: resolveFeatureNames(entity.featureIds),
    dimensions: resolveDimensionValues(entity.dimensionValueIds),
  };
}

// ============================================
// Link Resolution
// ============================================

export function resolveLinks(entityId: string): ResolvedLink[] {
  const db = getDatabase();

  // Get outgoing relationships
  const rows = db.prepare(`
    SELECT
      r.target_id,
      r.relationship_type,
      e.type,
      e.title
    FROM relationships r
    JOIN entities e ON r.target_id = e.id
    WHERE r.source_id = ?
  `).all(entityId) as {
    target_id: string;
    relationship_type: string | null;
    type: string;
    title: string;
  }[];

  return rows.map(row => ({
    target_id: row.target_id,
    type: row.type as EntityType,
    title: row.title,
    relationship: row.relationship_type,
  }));
}

// ============================================
// YAML Helpers
// ============================================

function escapeYamlString(str: string): string {
  // If string contains special characters or newlines, quote it
  if (/[:\{\}\[\],&\*#\?|\-<>=!%@\\"\n]/.test(str) || str.trim() !== str) {
    return `"${str.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
  }
  return str;
}

function formatYamlArray(items: string[], indent: number = 2): string {
  if (items.length === 0) return '[]';
  const spaces = ' '.repeat(indent);
  return `[${items.map(item => escapeYamlString(item)).join(', ')}]`;
}

// ============================================
// Frontmatter Generation
// ============================================

export function generateFrontmatter(entity: Entity): string {
  const context = resolveContext(entity);
  const links = resolveLinks(entity.id);

  const lines: string[] = ['---'];

  // Basic fields
  lines.push(`id: ${entity.id}`);
  lines.push(`type: ${entity.type}`);
  lines.push(`title: ${escapeYamlString(entity.title)}`);

  if (entity.status) {
    lines.push(`status: ${entity.status}`);
  }

  lines.push(`created_at: "${entity.createdAt}"`);
  lines.push(`updated_at: "${entity.updatedAt}"`);

  // Type-specific fields
  if (entity.type === 'capture' && entity.promotedToId) {
    lines.push(`promoted_to: ${entity.promotedToId}`);
  }

  if (entity.metadata) {
    // Add type-specific metadata fields
    const meta = entity.metadata;

    if (entity.type === 'hypothesis' && meta.confidence !== undefined) {
      lines.push(`confidence: ${meta.confidence}`);
    }

    if (entity.type === 'experiment') {
      if (meta.startDate) lines.push(`start_date: "${meta.startDate}"`);
      if (meta.endDate) lines.push(`end_date: "${meta.endDate}"`);
      if (meta.outcome) lines.push(`outcome: ${meta.outcome}`);
      if (meta.metrics && Array.isArray(meta.metrics)) {
        lines.push(`metrics: ${formatYamlArray(meta.metrics as string[])}`);
      }
    }

    if (entity.type === 'decision') {
      if (meta.decisionType) lines.push(`decision_type: ${meta.decisionType}`);
      if (meta.decidedAt) lines.push(`decided_at: "${meta.decidedAt}"`);
    }

    if (entity.type === 'artifact') {
      if (meta.artifactType) lines.push(`artifact_type: ${meta.artifactType}`);
      if (meta.source) lines.push(`source: ${escapeYamlString(meta.source as string)}`);
    }
  }

  // Context section
  const hasContext = context.personas.length > 0 ||
    context.features.length > 0 ||
    Object.keys(context.dimensions).length > 0;

  if (hasContext) {
    lines.push('context:');

    if (context.personas.length > 0) {
      lines.push(`  personas: ${formatYamlArray(context.personas)}`);
    }

    if (context.features.length > 0) {
      lines.push(`  features: ${formatYamlArray(context.features)}`);
    }

    if (Object.keys(context.dimensions).length > 0) {
      lines.push('  dimensions:');
      for (const [dimName, values] of Object.entries(context.dimensions)) {
        lines.push(`    ${escapeYamlString(dimName)}: ${formatYamlArray(values)}`);
      }
    }
  }

  // Links section
  if (links.length > 0) {
    lines.push('links:');
    for (const link of links) {
      lines.push(`  - target_id: ${link.target_id}`);
      lines.push(`    type: ${link.type}`);
      lines.push(`    title: ${escapeYamlString(link.title)}`);
      if (link.relationship) {
        lines.push(`    relationship: ${link.relationship}`);
      }
    }
  }

  lines.push('---');

  return lines.join('\n');
}

// ============================================
// Full Markdown Generation
// ============================================

export function generateMarkdown(entity: Entity): string {
  const frontmatter = generateFrontmatter(entity);
  const body = entity.body || '';

  return `${frontmatter}\n\n${body}`;
}
