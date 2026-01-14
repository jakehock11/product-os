// Product OS — New Entity Type Definitions
// Add these to src/lib/types.ts

// ============================================
// New Entity Type Enum Values
// ============================================

// Update EntityType to include new types
export type EntityType = 
  | 'capture' 
  | 'problem' 
  | 'hypothesis' 
  | 'experiment' 
  | 'decision' 
  | 'artifact'
  | 'feedback'        // NEW
  | 'feature_request' // NEW
  | 'feature';        // NEW


// ============================================
// Feedback
// ============================================

export type FeedbackType = 
  | 'praise' 
  | 'complaint' 
  | 'bug' 
  | 'suggestion' 
  | 'question' 
  | 'other';

export type FeedbackStatus = 
  | 'new' 
  | 'reviewed' 
  | 'actioned' 
  | 'archived';

export interface Feedback {
  id: string;                    // fdbk_xxx
  type: 'feedback';
  productId: string;
  
  title: string;
  body: string;
  
  feedbackType: FeedbackType;
  source?: string;               // Who/where it came from
  sourceUrl?: string;            // Link to original
  
  status: FeedbackStatus;
  promotedToId?: string;         // If promoted to another entity
  
  // Taxonomy
  personaIds: string[];
  featureAreaIds: string[];
  dimensionValueIdsByDimension: Record<string, string[]>;
  
  createdAt: string;             // ISO
  updatedAt: string;             // ISO
}

export interface CreateFeedbackData {
  productId: string;
  title: string;
  body?: string;
  feedbackType: FeedbackType;
  source?: string;
  sourceUrl?: string;
  status?: FeedbackStatus;       // Defaults to 'new'
  personaIds?: string[];
  featureAreaIds?: string[];
  dimensionValueIdsByDimension?: Record<string, string[]>;
}

export interface UpdateFeedbackData {
  title?: string;
  body?: string;
  feedbackType?: FeedbackType;
  source?: string;
  sourceUrl?: string;
  status?: FeedbackStatus;
  promotedToId?: string;
  personaIds?: string[];
  featureAreaIds?: string[];
  dimensionValueIdsByDimension?: Record<string, string[]>;
}


// ============================================
// Feature Request
// ============================================

export type FeatureRequestStatus = 
  | 'new' 
  | 'considering' 
  | 'planned' 
  | 'in_progress' 
  | 'shipped' 
  | 'declined';

export type FeatureRequestPriority = 
  | 'low' 
  | 'medium' 
  | 'high' 
  | 'critical';

export interface FeatureRequest {
  id: string;                    // freq_xxx
  type: 'feature_request';
  productId: string;
  
  title: string;
  body: string;
  
  source?: string;               // Who requested
  sourceUrl?: string;            // Link to original request
  
  status: FeatureRequestStatus;
  priority?: FeatureRequestPriority;
  declinedReason?: string;       // If declined, why
  
  linkedProblemId?: string;      // Problem this addresses
  linkedFeatureId?: string;      // Feature that fulfilled this
  
  // Taxonomy
  personaIds: string[];
  featureAreaIds: string[];
  dimensionValueIdsByDimension: Record<string, string[]>;
  
  createdAt: string;             // ISO
  updatedAt: string;             // ISO
}

export interface CreateFeatureRequestData {
  productId: string;
  title: string;
  body?: string;
  source?: string;
  sourceUrl?: string;
  status?: FeatureRequestStatus; // Defaults to 'new'
  priority?: FeatureRequestPriority;
  linkedProblemId?: string;
  personaIds?: string[];
  featureAreaIds?: string[];
  dimensionValueIdsByDimension?: Record<string, string[]>;
}

export interface UpdateFeatureRequestData {
  title?: string;
  body?: string;
  source?: string;
  sourceUrl?: string;
  status?: FeatureRequestStatus;
  priority?: FeatureRequestPriority;
  declinedReason?: string;
  linkedProblemId?: string;
  linkedFeatureId?: string;
  personaIds?: string[];
  featureAreaIds?: string[];
  dimensionValueIdsByDimension?: Record<string, string[]>;
}


// ============================================
// Feature
// ============================================

export type FeatureStatus = 
  | 'building' 
  | 'shipped' 
  | 'monitoring' 
  | 'stable' 
  | 'deprecated';

export type FeatureHealth = 
  | 'healthy' 
  | 'needs_attention' 
  | 'underperforming';

export interface FeatureCheckIn {
  id: string;                    // checkin_xxx
  date: string;                  // ISO
  health: FeatureHealth;
  notes: string;                 // Markdown
  metrics?: string;              // Optional metrics snapshot
}

export interface Feature {
  id: string;                    // feat_xxx
  type: 'feature';
  productId: string;
  
  title: string;
  body: string;
  
  status: FeatureStatus;
  health?: FeatureHealth;
  shippedAt?: string;            // ISO
  
  // Links
  linkedDecisionIds: string[];   // Decisions that led to this
  linkedExperimentIds: string[]; // Experiments that validated it
  linkedRequestIds: string[];    // Feature Requests this fulfills
  
  checkIns: FeatureCheckIn[];    // Periodic status updates
  
  // Taxonomy
  personaIds: string[];
  featureAreaIds: string[];
  dimensionValueIdsByDimension: Record<string, string[]>;
  
  createdAt: string;             // ISO
  updatedAt: string;             // ISO
}

export interface CreateFeatureData {
  productId: string;
  title: string;
  body?: string;
  status?: FeatureStatus;        // Defaults to 'building'
  health?: FeatureHealth;
  shippedAt?: string;
  linkedDecisionIds?: string[];
  linkedExperimentIds?: string[];
  linkedRequestIds?: string[];
  personaIds?: string[];
  featureAreaIds?: string[];
  dimensionValueIdsByDimension?: Record<string, string[]>;
}

export interface UpdateFeatureData {
  title?: string;
  body?: string;
  status?: FeatureStatus;
  health?: FeatureHealth;
  shippedAt?: string;
  linkedDecisionIds?: string[];
  linkedExperimentIds?: string[];
  linkedRequestIds?: string[];
  personaIds?: string[];
  featureAreaIds?: string[];
  dimensionValueIdsByDimension?: Record<string, string[]>;
}

export interface CreateCheckInData {
  featureId: string;
  health: FeatureHealth;
  notes: string;
  metrics?: string;
}


// ============================================
// Promotion
// ============================================

export type PromotionSource = 'capture' | 'feedback' | 'feature_request';

export type PromotionTarget = 
  | 'problem' 
  | 'hypothesis' 
  | 'feedback' 
  | 'feature_request' 
  | 'artifact';

// Which types can be promoted to which targets
export const PROMOTION_TARGETS: Record<PromotionSource, PromotionTarget[]> = {
  capture: ['problem', 'hypothesis', 'feedback', 'feature_request', 'artifact'],
  feedback: ['problem', 'hypothesis', 'feature_request', 'artifact'],
  feature_request: ['problem', 'hypothesis'],
};


// ============================================
// Navigation Buckets
// ============================================

export type BucketType = 'inbox' | 'thinking' | 'work' | 'evidence';

export const BUCKET_ENTITY_TYPES: Record<BucketType, EntityType[]> = {
  inbox: ['capture', 'feedback', 'feature_request'],
  thinking: ['problem', 'hypothesis'],
  work: ['experiment', 'decision', 'feature'],
  evidence: ['artifact'],
};

export interface BucketConfig {
  id: BucketType;
  label: string;
  icon: string;            // Lucide icon name
  entityTypes: EntityType[];
  route: string;
}

export const BUCKETS: BucketConfig[] = [
  {
    id: 'inbox',
    label: 'Inbox',
    icon: 'inbox',
    entityTypes: ['capture', 'feedback', 'feature_request'],
    route: '/inbox',
  },
  {
    id: 'thinking',
    label: 'Thinking',
    icon: 'brain',
    entityTypes: ['problem', 'hypothesis'],
    route: '/thinking',
  },
  {
    id: 'work',
    label: 'Work',
    icon: 'flask-conical',
    entityTypes: ['experiment', 'decision', 'feature'],
    route: '/work',
  },
  {
    id: 'evidence',
    label: 'Evidence',
    icon: 'paperclip',
    entityTypes: ['artifact'],
    route: '/evidence',
  },
];


// ============================================
// Entity Type Metadata
// ============================================

export interface EntityTypeConfig {
  type: EntityType;
  label: string;
  labelPlural: string;
  icon: string;            // Lucide icon name
  bucket: BucketType;
  color: string;           // Tailwind color class
}

export const ENTITY_TYPE_CONFIG: Record<EntityType, EntityTypeConfig> = {
  capture: {
    type: 'capture',
    label: 'Capture',
    labelPlural: 'Captures',
    icon: 'zap',
    bucket: 'inbox',
    color: 'yellow',
  },
  feedback: {
    type: 'feedback',
    label: 'Feedback',
    labelPlural: 'Feedback',
    icon: 'message-circle',
    bucket: 'inbox',
    color: 'blue',
  },
  feature_request: {
    type: 'feature_request',
    label: 'Request',
    labelPlural: 'Requests',
    icon: 'lightbulb',
    bucket: 'inbox',
    color: 'purple',
  },
  problem: {
    type: 'problem',
    label: 'Problem',
    labelPlural: 'Problems',
    icon: 'circle-dot',
    bucket: 'thinking',
    color: 'red',
  },
  hypothesis: {
    type: 'hypothesis',
    label: 'Hypothesis',
    labelPlural: 'Hypotheses',
    icon: 'flask-round',
    bucket: 'thinking',
    color: 'orange',
  },
  experiment: {
    type: 'experiment',
    label: 'Experiment',
    labelPlural: 'Experiments',
    icon: 'flask-conical',
    bucket: 'work',
    color: 'cyan',
  },
  decision: {
    type: 'decision',
    label: 'Decision',
    labelPlural: 'Decisions',
    icon: 'check-circle',
    bucket: 'work',
    color: 'green',
  },
  feature: {
    type: 'feature',
    label: 'Feature',
    labelPlural: 'Features',
    icon: 'rocket',
    bucket: 'work',
    color: 'indigo',
  },
  artifact: {
    type: 'artifact',
    label: 'Artifact',
    labelPlural: 'Artifacts',
    icon: 'paperclip',
    bucket: 'evidence',
    color: 'gray',
  },
};


// ============================================
// Status Configurations
// ============================================

export interface StatusConfig {
  value: string;
  label: string;
  color: string;           // Tailwind color class
}

export const FEEDBACK_STATUSES: StatusConfig[] = [
  { value: 'new', label: 'New', color: 'blue' },
  { value: 'reviewed', label: 'Reviewed', color: 'gray' },
  { value: 'actioned', label: 'Actioned', color: 'green' },
  { value: 'archived', label: 'Archived', color: 'gray' },
];

export const FEATURE_REQUEST_STATUSES: StatusConfig[] = [
  { value: 'new', label: 'New', color: 'blue' },
  { value: 'considering', label: 'Considering', color: 'yellow' },
  { value: 'planned', label: 'Planned', color: 'blue' },
  { value: 'in_progress', label: 'In Progress', color: 'purple' },
  { value: 'shipped', label: 'Shipped', color: 'green' },
  { value: 'declined', label: 'Declined', color: 'red' },
];

export const FEATURE_STATUSES: StatusConfig[] = [
  { value: 'building', label: 'Building', color: 'purple' },
  { value: 'shipped', label: 'Shipped', color: 'green' },
  { value: 'monitoring', label: 'Monitoring', color: 'yellow' },
  { value: 'stable', label: 'Stable', color: 'green' },
  { value: 'deprecated', label: 'Deprecated', color: 'gray' },
];

export const FEATURE_HEALTH_CONFIG: StatusConfig[] = [
  { value: 'healthy', label: 'Healthy', color: 'green' },
  { value: 'needs_attention', label: 'Needs Attention', color: 'yellow' },
  { value: 'underperforming', label: 'Underperforming', color: 'red' },
];

export const FEEDBACK_TYPE_CONFIG: StatusConfig[] = [
  { value: 'praise', label: 'Praise', color: 'green' },
  { value: 'complaint', label: 'Complaint', color: 'red' },
  { value: 'bug', label: 'Bug', color: 'red' },
  { value: 'suggestion', label: 'Suggestion', color: 'blue' },
  { value: 'question', label: 'Question', color: 'purple' },
  { value: 'other', label: 'Other', color: 'gray' },
];

export const PRIORITY_CONFIG: StatusConfig[] = [
  { value: 'low', label: 'Low', color: 'gray' },
  { value: 'medium', label: 'Medium', color: 'blue' },
  { value: 'high', label: 'High', color: 'orange' },
  { value: 'critical', label: 'Critical', color: 'red' },
];


// ============================================
// IPC API Extensions
// ============================================

// Add these to the ProductOSAPI interface

export interface FeedbackAPI {
  getAll(productId: string, filters?: { status?: FeedbackStatus; feedbackType?: FeedbackType }): Promise<Feedback[]>;
  getById(id: string): Promise<Feedback | null>;
  create(data: CreateFeedbackData): Promise<Feedback>;
  update(id: string, data: UpdateFeedbackData): Promise<Feedback>;
  delete(id: string): Promise<void>;
  promote(id: string, targetType: PromotionTarget): Promise<{ sourceId: string; targetId: string }>;
}

export interface FeatureRequestAPI {
  getAll(productId: string, filters?: { status?: FeatureRequestStatus; priority?: FeatureRequestPriority }): Promise<FeatureRequest[]>;
  getById(id: string): Promise<FeatureRequest | null>;
  create(data: CreateFeatureRequestData): Promise<FeatureRequest>;
  update(id: string, data: UpdateFeatureRequestData): Promise<FeatureRequest>;
  delete(id: string): Promise<void>;
  promote(id: string, targetType: PromotionTarget): Promise<{ sourceId: string; targetId: string }>;
}

export interface FeatureAPI {
  getAll(productId: string, filters?: { status?: FeatureStatus; health?: FeatureHealth }): Promise<Feature[]>;
  getById(id: string): Promise<Feature | null>;
  create(data: CreateFeatureData): Promise<Feature>;
  update(id: string, data: UpdateFeatureData): Promise<Feature>;
  delete(id: string): Promise<void>;
  addCheckIn(data: CreateCheckInData): Promise<FeatureCheckIn>;
  updateCheckIn(featureId: string, checkInId: string, data: Partial<FeatureCheckIn>): Promise<FeatureCheckIn>;
  deleteCheckIn(featureId: string, checkInId: string): Promise<void>;
}
