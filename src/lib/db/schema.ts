// Product OS Data Model - exactly as specified in the build spec

export interface Product {
  id: string;
  name: string;
  icon?: { type: "initials" | "image"; data?: string };
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
  taxonomy: Taxonomy;
}

export interface Taxonomy {
  personas: TaxonomyItem[];
  featureAreas: TaxonomyItem[];
  dimensions: TaxonomyDimension[];
}

export interface TaxonomyItem {
  id: string;
  name: string;
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaxonomyDimension {
  id: string;
  name: string;
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
  values: TaxonomyItem[];
}

export type EntityType = 
  | "problem" 
  | "hypothesis" 
  | "experiment" 
  | "decision" 
  | "artifact" 
  | "quick_capture";

export interface LinkedIds {
  problems?: string[];
  hypotheses?: string[];
  experiments?: string[];
  decisions?: string[];
  artifacts?: string[];
  quickCaptures?: string[];
}

export interface BaseEntity {
  id: string;
  productId: string;
  type: EntityType;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  personaIds: string[];
  featureAreaIds: string[];
  dimensionValueIdsByDimension: Record<string, string[]>;
  linkedIds?: LinkedIds;
}

export type ProblemStatus = "active" | "exploring" | "blocked" | "solved" | "archived";

export interface Problem extends BaseEntity {
  type: "problem";
  status: ProblemStatus;
}

export type ExperimentStatus = "planned" | "running" | "paused" | "complete";
export type ExperimentOutcome = "win" | "partial" | "inconclusive" | "fail";

export interface Experiment extends BaseEntity {
  type: "experiment";
  status: ExperimentStatus;
  startDate?: string;
  endDate?: string;
  metrics?: string[];
  outcome?: ExperimentOutcome;
}

export type DecisionType = "reversible" | "irreversible";

export interface Decision extends BaseEntity {
  type: "decision";
  decisionType?: DecisionType;
  decidedAt?: string;
}

export type ArtifactType = "link" | "image" | "file" | "note" | "query";

export interface Attachment {
  id: string;
  kind: "image" | "file";
  filename: string;
  mimeType?: string;
  localRef: string; // base64 or objectURL for web
}

export interface Artifact extends BaseEntity {
  type: "artifact";
  artifactType: ArtifactType;
  source?: string;
  attachments?: Attachment[];
}

export interface Hypothesis extends BaseEntity {
  type: "hypothesis";
}

export interface QuickCapture extends BaseEntity {
  type: "quick_capture";
  promotedToId?: string;
}

export type Entity = Problem | Hypothesis | Experiment | Decision | Artifact | QuickCapture;

// Export history tracking
export interface ExportRecord {
  id: string;
  productId: string;
  timestamp: string;
  mode: "full" | "incremental";
  startDate?: string;
  endDate?: string;
  counts: Record<EntityType, number>;
}

// Settings per product
export interface ProductSettings {
  productId: string;
  exportDefaults: {
    mode: "full" | "incremental";
    incrementalRange: "since_last_export" | "custom";
    includeParentContext: boolean;
  };
}
