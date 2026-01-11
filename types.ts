// Product OS — TypeScript Type Definitions
// This file serves as a reference for Claude Code

// ============================================
// Core Enums and Constants
// ============================================

export type EntityType = 'capture' | 'problem' | 'hypothesis' | 'experiment' | 'decision' | 'artifact';

export type ProblemStatus = 'active' | 'exploring' | 'blocked' | 'solved' | 'archived';
export type HypothesisStatus = 'draft' | 'active' | 'invalidated' | 'archived';
export type ExperimentStatus = 'planned' | 'running' | 'paused' | 'complete' | 'archived';
export type ArtifactStatus = 'draft' | 'final' | 'archived';
export type DecisionType = 'reversible' | 'irreversible';

export type RelationshipType = 'supports' | 'tests' | 'informs' | 'evidence' | 'relates_to';

export type ExportMode = 'full' | 'incremental';
export type ExportScopeType = 'product' | 'all';
export type IncrementalRange = 'since_last_export' | 'last_7_days' | 'last_30_days' | 'custom';

// ============================================
// Products
// ============================================

export interface Product {
  id: string;                    // prod_xxx
  name: string;
  description?: string;
  icon?: string;
  createdAt: string;             // ISO 8601
  updatedAt: string;             // ISO 8601
  lastActivityAt: string;        // ISO 8601
}

export interface CreateProductData {
  name: string;
  description?: string;
  icon?: string;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  icon?: string;
}

// ============================================
// Taxonomy
// ============================================

export interface Persona {
  id: string;                    // pers_xxx
  productId: string;
  name: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Feature {
  id: string;                    // feat_xxx
  productId: string;
  name: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Dimension {
  id: string;                    // dim_xxx
  productId: string;
  name: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  values: DimensionValue[];      // loaded with dimension
}

export interface DimensionValue {
  id: string;                    // dimval_xxx
  dimensionId: string;
  name: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Taxonomy {
  personas: Persona[];
  features: Feature[];
  dimensions: Dimension[];
}

// ============================================
// Entities
// ============================================

// Base fields shared by all entities
export interface BaseEntity {
  id: string;
  productId: string;
  type: EntityType;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  
  // Context tags (resolved IDs)
  personaIds: string[];
  featureIds: string[];
  dimensionValueIds: string[];
}

export interface Capture extends BaseEntity {
  type: 'capture';
  promotedToId?: string;         // ID of entity this was promoted to
}

export interface Problem extends BaseEntity {
  type: 'problem';
  status: ProblemStatus;
}

export interface Hypothesis extends BaseEntity {
  type: 'hypothesis';
  status: HypothesisStatus;
  confidence?: number;           // 0-100
}

export interface Experiment extends BaseEntity {
  type: 'experiment';
  status: ExperimentStatus;
  metrics?: string[];
  startDate?: string;
  endDate?: string;
  outcome?: 'win' | 'partial' | 'inconclusive' | 'fail';
}

export interface Decision extends BaseEntity {
  type: 'decision';
  decisionType?: DecisionType;
  decidedAt?: string;
}

export interface Artifact extends BaseEntity {
  type: 'artifact';
  status?: ArtifactStatus;
  artifactType?: 'link' | 'image' | 'file' | 'note' | 'query';
  source?: string;               // URL or file reference
}

// Union type for all entities
export type Entity = Capture | Problem | Hypothesis | Experiment | Decision | Artifact;

// For creating entities
export interface CreateEntityData {
  productId: string;
  type: EntityType;
  title?: string;
  body?: string;
  status?: string;
  personaIds?: string[];
  featureIds?: string[];
  dimensionValueIds?: string[];
  metadata?: Record<string, unknown>;  // Type-specific fields
}

// For updating entities
export interface UpdateEntityData {
  title?: string;
  body?: string;
  status?: string;
  personaIds?: string[];
  featureIds?: string[];
  dimensionValueIds?: string[];
  metadata?: Record<string, unknown>;
}

// For list views (lighter weight)
export interface EntitySummary {
  id: string;
  productId: string;
  type: EntityType;
  title: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
}

// Filter options for entity queries
export interface EntityFilters {
  type?: EntityType;
  status?: string;
  search?: string;
  personaIds?: string[];
  featureIds?: string[];
  dimensionValueIds?: string[];
}

// ============================================
// Relationships
// ============================================

export interface Relationship {
  id: string;                    // rel_xxx
  productId: string;
  sourceId: string;
  targetId: string;
  relationshipType?: RelationshipType;
  createdAt: string;
  updatedAt: string;
}

// Relationship with resolved entity info for display
export interface RelationshipWithEntity extends Relationship {
  targetEntity?: EntitySummary;
  sourceEntity?: EntitySummary;
}

export interface CreateRelationshipData {
  productId: string;
  sourceId: string;
  targetId: string;
  relationshipType?: RelationshipType;
}

// ============================================
// Exports
// ============================================

export interface ExportRecord {
  id: string;                    // exp_xxx (different from experiment!)
  productId?: string;
  mode: ExportMode;
  scopeType: ExportScopeType;
  startDate?: string;            // For incremental
  endDate: string;
  counts: ExportCounts;
  outputPath?: string;
  createdAt: string;
}

export interface ExportCounts {
  total: number;
  byType: Record<EntityType, number>;
  newCount?: number;             // For incremental
  updatedCount?: number;         // For incremental
}

export interface ExportOptions {
  mode: ExportMode;
  productId?: string;            // undefined = all products
  startDate?: string;            // For incremental
  endDate?: string;              // Defaults to now
  includeLinkedContext?: boolean;
}

export interface ExportPreview {
  counts: ExportCounts;
  entities: EntitySummary[];
}

export interface ExportResult {
  success: boolean;
  exportId: string;
  outputPath: string;
  counts: ExportCounts;
}

// ============================================
// Settings
// ============================================

export interface Settings {
  workspacePath?: string;
  lastProductId?: string;
  restoreLastContext: boolean;
  defaultExportMode: ExportMode;
  defaultIncrementalRange: IncrementalRange;
  includeLinkedContextDefault: boolean;
}

export interface UpdateSettingsData {
  lastProductId?: string;
  restoreLastContext?: boolean;
  defaultExportMode?: ExportMode;
  defaultIncrementalRange?: IncrementalRange;
  includeLinkedContextDefault?: boolean;
}

// ============================================
// Workspace
// ============================================

export interface WorkspaceInfo {
  isConfigured: boolean;
  path?: string;
}

// ============================================
// IPC API Types
// ============================================

// This interface defines what's exposed to the renderer via preload
export interface ProductOSAPI {
  products: {
    getAll(): Promise<Product[]>;
    getById(id: string): Promise<Product | null>;
    create(data: CreateProductData): Promise<Product>;
    update(id: string, data: UpdateProductData): Promise<Product>;
    delete(id: string): Promise<void>;
  };
  
  entities: {
    getAll(productId: string, filters?: EntityFilters): Promise<Entity[]>;
    getById(id: string): Promise<Entity | null>;
    create(data: CreateEntityData): Promise<Entity>;
    update(id: string, data: UpdateEntityData): Promise<Entity>;
    delete(id: string): Promise<void>;
    promote(captureId: string, targetType: EntityType): Promise<Entity>;
  };
  
  taxonomy: {
    getAll(productId: string): Promise<Taxonomy>;
    createPersona(productId: string, name: string): Promise<Persona>;
    createFeature(productId: string, name: string): Promise<Feature>;
    createDimension(productId: string, name: string): Promise<Dimension>;
    createDimensionValue(dimensionId: string, name: string): Promise<DimensionValue>;
    updatePersona(id: string, data: { name?: string }): Promise<Persona>;
    updateFeature(id: string, data: { name?: string }): Promise<Feature>;
    updateDimension(id: string, data: { name?: string }): Promise<Dimension>;
    updateDimensionValue(id: string, data: { name?: string }): Promise<DimensionValue>;
    archivePersona(id: string): Promise<void>;
    archiveFeature(id: string): Promise<void>;
    archiveDimension(id: string): Promise<void>;
    archiveDimensionValue(id: string): Promise<void>;
  };
  
  relationships: {
    getForEntity(entityId: string): Promise<RelationshipWithEntity[]>;
    create(data: CreateRelationshipData): Promise<Relationship>;
    delete(id: string): Promise<void>;
  };
  
  workspace: {
    getInfo(): Promise<WorkspaceInfo>;
    selectFolder(): Promise<string | null>;
    initialize(folderPath: string): Promise<void>;
    openFolder(): Promise<void>;
  };
  
  exports: {
    preview(options: ExportOptions): Promise<ExportPreview>;
    execute(options: ExportOptions): Promise<ExportResult>;
    getHistory(): Promise<ExportRecord[]>;
    clearHistory(): Promise<void>;
    copySnapshot(productId?: string): Promise<string>;
  };
  
  settings: {
    get(): Promise<Settings>;
    update(data: UpdateSettingsData): Promise<Settings>;
  };
}

// Augment the Window interface
declare global {
  interface Window {
    api: ProductOSAPI;
  }
}
