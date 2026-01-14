# Product OS — Navigation Refactor & New Entity Types

## Overview

This document outlines the plan to restructure Product OS from entity-type navigation (8+ sidebar items) to flow-based navigation (4 buckets), while adding three new entity types.

**Goals:**
- Simplify navigation from 8+ items to 4 meaningful buckets
- Add Feedback, Feature Request, and Feature entity types
- Preserve all existing functionality
- Make the "capture → think → work → evidence" flow visible

**Non-Goals:**
- Changing the core data model architecture
- Modifying the workspace/file system structure (beyond adding new entity folders)
- Changing the export format

---

## Current State

### Sidebar (Current)
```
⚡ Quick Capture
───────────────
🏠 Home
⊙ Problems
💡 Hypotheses
🔬 Experiments
✓ Decisions
📎 Artifacts
───────────────
📅 Timeline
⚙️ Manage Context
📤 Exports
⚙️ Settings
```

### Entity Types (Current)
- Capture (quick_capture)
- Problem
- Hypothesis
- Experiment
- Decision
- Artifact

---

## Target State

### Sidebar (New)
```
⚡ Capture                    [Primary action]
─────────────────────────────────────────────
🏠 Home
───────────────
📥 Inbox                      [Raw input]
   └─ Captures, Feedback, Feature Requests
   
🧠 Thinking                   [Making sense]
   └─ Problems, Hypotheses
   
🔬 Work                       [Taking action]
   └─ Experiments, Decisions, Features
   
📎 Evidence                   [Supporting material]
   └─ Artifacts
───────────────
📅 Timeline
⚙️ Manage Context
📤 Exports
⚙️ Settings
```

### Entity Types (New)
- Capture (existing)
- **Feedback** (new)
- **Feature Request** (new)
- Problem (existing)
- Hypothesis (existing)
- Experiment (existing)
- Decision (existing)
- **Feature** (new)
- Artifact (existing)

---

## New Entity Type Specifications

### 1. Feedback

**Purpose:** Capture raw input from users, stakeholders, or observations. Broader than feature requests — includes praise, complaints, bugs, suggestions.

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | `fdbk_xxx` |
| productId | string | Yes | Parent product |
| title | string | Yes | Short summary |
| body | string | No | Full content (markdown) |
| feedbackType | enum | Yes | `praise`, `complaint`, `bug`, `suggestion`, `question`, `other` |
| source | string | No | Where it came from (user name, channel, etc.) |
| sourceUrl | string | No | Link to original (Slack, email, etc.) |
| status | enum | Yes | `new`, `reviewed`, `actioned`, `archived` |
| promotedToId | string | No | If promoted to another entity |
| personaIds | string[] | No | Taxonomy tags |
| featureAreaIds | string[] | No | Taxonomy tags |
| dimensionValueIds | Record | No | Taxonomy tags |
| createdAt | string | Yes | ISO timestamp |
| updatedAt | string | Yes | ISO timestamp |

**Statuses:**
- `new` — Just captured, not reviewed
- `reviewed` — Looked at, no action needed
- `actioned` — Led to a Problem, Feature Request, or other entity
- `archived` — No longer relevant

**Promotion Targets:** Problem, Hypothesis, Feature Request, Artifact

---

### 2. Feature Request

**Purpose:** A specific ask for new functionality. More concrete than general feedback. Tracks the request through consideration to resolution.

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | `freq_xxx` |
| productId | string | Yes | Parent product |
| title | string | Yes | What's being requested |
| body | string | No | Full description (markdown) |
| source | string | No | Who requested it |
| sourceUrl | string | No | Link to original request |
| status | enum | Yes | `new`, `considering`, `planned`, `in_progress`, `shipped`, `declined` |
| priority | enum | No | `low`, `medium`, `high`, `critical` |
| declinedReason | string | No | If declined, why |
| linkedProblemId | string | No | Problem this addresses |
| linkedFeatureId | string | No | Feature that fulfilled this |
| personaIds | string[] | No | Taxonomy tags |
| featureAreaIds | string[] | No | Taxonomy tags |
| dimensionValueIds | Record | No | Taxonomy tags |
| createdAt | string | Yes | ISO timestamp |
| updatedAt | string | Yes | ISO timestamp |

**Statuses:**
- `new` — Just received
- `considering` — Under evaluation
- `planned` — Accepted, will build
- `in_progress` — Currently being built
- `shipped` — Built and released
- `declined` — Won't do (with reason)

**Promotion Targets:** Problem, Hypothesis

---

### 3. Feature

**Purpose:** Track a shipped capability over time. Link it to the decisions/experiments that led to it. Record periodic check-ins on health/adoption.

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | `feat_xxx` |
| productId | string | Yes | Parent product |
| title | string | Yes | Feature name |
| body | string | No | Description (markdown) |
| status | enum | Yes | `building`, `shipped`, `monitoring`, `stable`, `deprecated` |
| health | enum | No | `healthy`, `needs_attention`, `underperforming` |
| shippedAt | string | No | When it shipped (ISO) |
| linkedDecisionIds | string[] | No | Decisions that led to this |
| linkedExperimentIds | string[] | No | Experiments that validated it |
| linkedRequestIds | string[] | No | Feature Requests this fulfills |
| checkIns | CheckIn[] | No | Periodic status updates |
| personaIds | string[] | No | Taxonomy tags |
| featureAreaIds | string[] | No | Taxonomy tags |
| dimensionValueIds | Record | No | Taxonomy tags |
| createdAt | string | Yes | ISO timestamp |
| updatedAt | string | Yes | ISO timestamp |

**CheckIn Object:**
```typescript
{
  id: string;          // checkin_xxx
  date: string;        // ISO timestamp
  health: 'healthy' | 'needs_attention' | 'underperforming';
  notes: string;       // Markdown
  metrics?: string;    // Optional metrics snapshot
}
```

**Statuses:**
- `building` — In development
- `shipped` — Released, actively monitoring
- `monitoring` — Watching closely (new or concerning)
- `stable` — Mature, performing well
- `deprecated` — Being phased out

---

## Implementation Phases

### Phase 0: Preparation
**Goal:** Set up documentation and verify current state

**Tasks:**
- [ ] Create this plan document in repo
- [ ] Verify all existing tests pass
- [ ] Create git branch: `refactor/nav-and-entities`
- [ ] Document current sidebar component structure

**Files:**
- `REFACTOR_PLAN.md` (this file)
- `docs/CURRENT_STATE.md` (optional)

**Checkpoint:** Plan reviewed, branch created

---

### Phase 1: Database Schema Updates
**Goal:** Add tables/columns for new entity types

**Tasks:**
- [ ] Add `feedback_type` column options
- [ ] Add `feature_request` fields to entities table (or create new table)
- [ ] Add `feature` fields including `check_ins` JSON column
- [ ] Add new status values to validation
- [ ] Run migration on existing database
- [ ] Verify existing data unaffected

**Files to Modify:**
- `electron/database/schema.sql`
- `electron/database/db.ts` (migration logic)

**Files to Create:**
- `electron/database/migrations/002_new_entity_types.sql`

**SQL Changes:**
```sql
-- Add new entity types to the type check
-- Modify entities table or add new columns for type-specific fields
-- Add check_ins table for Feature check-ins (or use JSON column)
```

**Checkpoint:** Database accepts new entity types, existing data intact

---

### Phase 2: TypeScript Types & IPC Handlers
**Goal:** Add type definitions and CRUD operations for new entities

**Tasks:**
- [ ] Add TypeScript interfaces for Feedback, FeatureRequest, Feature
- [ ] Add new status enums
- [ ] Create IPC handlers for each new type
- [ ] Add markdown writer templates for new types
- [ ] Create folders in workspace structure

**Files to Modify:**
- `src/lib/types.ts`
- `electron/preload.ts`
- `src/lib/ipc.ts`
- `electron/workspace/sync.ts` (new folders)
- `electron/markdown/writer.ts` (new templates)
- `electron/markdown/templates.ts`

**Files to Create:**
- `electron/ipc/feedback.ts`
- `electron/ipc/featureRequests.ts`
- `electron/ipc/features.ts`
- `electron/database/queries/feedback.ts`
- `electron/database/queries/featureRequests.ts`
- `electron/database/queries/features.ts`

**Checkpoint:** Can CRUD all new entity types via IPC, markdown files generated

---

### Phase 3: New Entity UI Pages
**Goal:** Create list and detail pages for new entity types

**Tasks:**
- [ ] Create Feedback list page
- [ ] Create Feedback detail page
- [ ] Create Feature Request list page
- [ ] Create Feature Request detail page
- [ ] Create Feature list page
- [ ] Create Feature detail page (with check-ins section)
- [ ] Add routes for all new pages

**Files to Create:**
- `src/pages/FeedbackListPage.tsx`
- `src/pages/FeedbackDetailPage.tsx`
- `src/pages/FeatureRequestListPage.tsx`
- `src/pages/FeatureRequestDetailPage.tsx`
- `src/pages/FeatureListPage.tsx`
- `src/pages/FeatureDetailPage.tsx`
- `src/components/features/CheckInForm.tsx`
- `src/components/features/CheckInList.tsx`

**Files to Modify:**
- `src/App.tsx` (routes)
- `src/components/entity/FilePath.tsx` (support new types)
- `src/components/shared/StatusBadge.tsx` (new statuses)

**Checkpoint:** All new entity pages functional, can create/edit/delete

---

### Phase 4: Navigation Restructure — Sidebar
**Goal:** Replace entity-type nav with bucket-based nav

**Tasks:**
- [ ] Create new Sidebar component with bucket structure
- [ ] Add collapsible bucket sections
- [ ] Add type icons within buckets
- [ ] Highlight active bucket/type
- [ ] Preserve Quick Capture button prominence
- [ ] Keep Timeline, Manage Context, Exports, Settings at bottom

**Files to Modify:**
- `src/components/layout/Sidebar.tsx` (major refactor)

**Files to Create:**
- `src/components/layout/SidebarBucket.tsx`
- `src/components/layout/SidebarItem.tsx`

**Design:**
```
⚡ Capture                    [Button - always visible]
─────────────────────────────────────────────────────
🏠 Home

📥 Inbox                      [Expandable]
   ├─ ⚡ Captures (3)
   ├─ 💬 Feedback (5)
   └─ 🙋 Requests (2)

🧠 Thinking                   [Expandable]
   ├─ ⊙ Problems (4)
   └─ 💡 Hypotheses (2)

🔬 Work                       [Expandable]
   ├─ 🧪 Experiments (1)
   ├─ ✓ Decisions (3)
   └─ 🚀 Features (2)

📎 Evidence                   [Expandable]
   └─ 📎 Artifacts (7)
─────────────────────────────────────────────────────
📅 Timeline
⚙️ Manage Context
📤 Exports
⚙️ Settings
```

**Checkpoint:** New sidebar renders, navigation works, old routes still function

---

### Phase 5: Bucket List Pages
**Goal:** Create unified list views for each bucket with type filters

**Tasks:**
- [ ] Create InboxPage with tabs: All, Captures, Feedback, Requests
- [ ] Create ThinkingPage with tabs: All, Problems, Hypotheses
- [ ] Create WorkPage with tabs: All, Experiments, Decisions, Features
- [ ] Create EvidencePage (Artifacts, possibly simplified)
- [ ] Add bulk actions where appropriate
- [ ] Add "Promote" dropdown to Inbox items

**Files to Create:**
- `src/pages/InboxPage.tsx`
- `src/pages/ThinkingPage.tsx`
- `src/pages/WorkPage.tsx`
- `src/pages/EvidencePage.tsx`
- `src/components/shared/BucketTabs.tsx`
- `src/components/shared/PromoteDropdown.tsx`

**Files to Modify:**
- `src/App.tsx` (new routes)

**Checkpoint:** Bucket pages show combined lists, filters work, promotion dropdown works

---

### Phase 6: Home Dashboard Update
**Goal:** Update home to reflect new bucket structure

**Tasks:**
- [ ] Redesign Home layout with bucket sections
- [ ] Add Inbox summary (unprocessed count)
- [ ] Add Active Thinking section
- [ ] Add In Progress section (running experiments)
- [ ] Add Recent Decisions section
- [ ] Add Feature Health summary (if any need attention)

**Files to Modify:**
- `src/pages/HomePage.tsx` (major refactor)

**Design:**
```
┌─────────────────────────────────────────────────────────────┐
│ [Product] Home                                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📥 Inbox (7 unprocessed)                    [View all →]   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ • Shot clock idea (Capture • 2h ago)                  │  │
│  │ • "Great product!" (Feedback • 1d ago)                │  │
│  │ • Add dark mode (Request • 2d ago)                    │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  🧠 Active Thinking                          [View all →]   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ • Adoption Friction (Problem • Active)                │  │
│  │ • Scoring is lowest-friction (Hypothesis • Active)    │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  🔬 In Progress                              [View all →]   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ • Streamer Feedback Emails (Experiment • Running)     │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ✓ Recent Decisions                          [View all →]   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ • Ship dark mode iOS first (1 week ago)               │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  🚀 Feature Health                           [View all →]   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ • Dark Mode (Shipped • Healthy)                       │  │
│  │ • Shot Clock (Monitoring • Needs Attention)           │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Checkpoint:** Home dashboard shows all bucket summaries, counts are accurate

---

### Phase 7: Promotion Flows
**Goal:** Enable smooth promotion from Inbox items to structured entities

**Tasks:**
- [ ] Add "Promote to..." dropdown on Capture detail page
- [ ] Add "Promote to..." dropdown on Feedback detail page
- [ ] Add "Promote to..." dropdown on Feature Request detail page
- [ ] When promoting, pre-fill relevant fields
- [ ] Link back to source (promotedFromId)
- [ ] Mark source as "actioned" status
- [ ] Add "Promoted from..." badge on target entity

**Promotion Matrix:**
| From | Can Promote To |
|------|----------------|
| Capture | Problem, Hypothesis, Feedback, Feature Request, Artifact |
| Feedback | Problem, Hypothesis, Feature Request, Artifact |
| Feature Request | Problem, Hypothesis |

**Files to Modify:**
- `src/pages/CaptureDetailPage.tsx`
- `src/pages/FeedbackDetailPage.tsx`
- `src/pages/FeatureRequestDetailPage.tsx`
- `src/components/shared/PromoteDropdown.tsx`

**Files to Create:**
- `src/components/shared/PromotedFromBadge.tsx`

**Checkpoint:** Can promote any Inbox item, source is marked, target links back

---

### Phase 8: Timeline & Search Updates
**Goal:** Ensure Timeline and search work with new entity types

**Tasks:**
- [ ] Add new entity types to Timeline view
- [ ] Add icons and colors for new types
- [ ] Update search to include new types
- [ ] Update Cmd+K command palette

**Files to Modify:**
- `src/pages/TimelinePage.tsx`
- `src/components/timeline/TimelineItem.tsx`
- `src/components/shared/CommandPalette.tsx` (if exists)

**Checkpoint:** Timeline shows all types, search finds new entities

---

### Phase 9: Export Updates
**Goal:** Ensure exports include new entity types

**Tasks:**
- [ ] Add new entity types to export queries
- [ ] Add new type folders to export structure
- [ ] Update manifest schema for new types
- [ ] Update snapshot.md template
- [ ] Test full and incremental exports

**Files to Modify:**
- `electron/database/queries/exports.ts`
- `electron/ipc/exports.ts`

**Export Structure:**
```
export_xxx/
  manifest.json
  snapshot.md
  objects/
    feedback/
      fdbk_xxx.md
    feature_requests/
      freq_xxx.md
    features/
      feat_xxx.md
    problems/
      ...
```

**Checkpoint:** Exports include all entity types, manifest is valid

---

### Phase 10: Polish & Edge Cases
**Goal:** Handle edge cases, improve UX, fix bugs

**Tasks:**
- [ ] Empty states for new bucket pages
- [ ] Loading states
- [ ] Error handling for new IPC calls
- [ ] Keyboard navigation in new sidebar
- [ ] Tooltips for bucket icons
- [ ] Transition animations (optional)
- [ ] Update any hardcoded entity type lists
- [ ] Test workspace sync with new types
- [ ] Test app restart / data persistence

**Checkpoint:** App feels polished, no console errors, all flows smooth

---

### Phase 11: Documentation & Cleanup
**Goal:** Update docs, remove dead code

**Tasks:**
- [ ] Update CLAUDE.md with new structure
- [ ] Update PHASES.md (archive old, note refactor)
- [ ] Remove old individual entity list pages (ProblemsPage, etc.) if no longer used as standalone
- [ ] Update README if needed
- [ ] Final testing pass

**Checkpoint:** Documentation current, no dead code, ready for use

---

## File Change Summary

### New Files (~25)
```
electron/database/migrations/002_new_entity_types.sql
electron/database/queries/feedback.ts
electron/database/queries/featureRequests.ts
electron/database/queries/features.ts
electron/ipc/feedback.ts
electron/ipc/featureRequests.ts
electron/ipc/features.ts
src/pages/FeedbackListPage.tsx
src/pages/FeedbackDetailPage.tsx
src/pages/FeatureRequestListPage.tsx
src/pages/FeatureRequestDetailPage.tsx
src/pages/FeatureListPage.tsx
src/pages/FeatureDetailPage.tsx
src/pages/InboxPage.tsx
src/pages/ThinkingPage.tsx
src/pages/WorkPage.tsx
src/pages/EvidencePage.tsx
src/components/layout/SidebarBucket.tsx
src/components/layout/SidebarItem.tsx
src/components/features/CheckInForm.tsx
src/components/features/CheckInList.tsx
src/components/shared/BucketTabs.tsx
src/components/shared/PromoteDropdown.tsx
src/components/shared/PromotedFromBadge.tsx
```

### Modified Files (~20)
```
electron/database/schema.sql
electron/database/db.ts
electron/preload.ts
electron/workspace/sync.ts
electron/markdown/writer.ts
electron/markdown/templates.ts
electron/database/queries/exports.ts
electron/ipc/exports.ts
src/lib/types.ts
src/lib/ipc.ts
src/App.tsx
src/components/layout/Sidebar.tsx
src/components/entity/FilePath.tsx
src/components/shared/StatusBadge.tsx
src/pages/HomePage.tsx
src/pages/TimelinePage.tsx
src/pages/CaptureDetailPage.tsx
src/components/timeline/TimelineItem.tsx
CLAUDE.md
```

---

## Icons & Assets Needed

### Bucket Icons
| Bucket | Icon | Suggested |
|--------|------|-----------|
| Inbox | 📥 | `inbox` or `tray` from Lucide |
| Thinking | 🧠 | `brain` from Lucide |
| Work | 🔬 | `flask-conical` or `hammer` from Lucide |
| Evidence | 📎 | `paperclip` from Lucide |

### Entity Type Icons
| Type | Icon | Suggested |
|------|------|-----------|
| Feedback | 💬 | `message-circle` from Lucide |
| Feature Request | 🙋 | `hand-raised` or `lightbulb` from Lucide |
| Feature | 🚀 | `rocket` from Lucide |

### Status Badge Colors
| Status | Color | Used By |
|--------|-------|---------|
| new | blue | Feedback, Feature Request |
| reviewed | gray | Feedback |
| actioned | green | Feedback |
| considering | yellow | Feature Request |
| planned | blue | Feature Request |
| in_progress | purple | Feature Request |
| shipped | green | Feature Request, Feature |
| declined | red | Feature Request |
| building | purple | Feature |
| monitoring | yellow | Feature |
| stable | green | Feature |
| deprecated | gray | Feature |

### Health Indicator Colors
| Health | Color |
|--------|-------|
| healthy | green |
| needs_attention | yellow |
| underperforming | red |

---

## Testing Checklist

### Phase 1-2 (Data Layer)
- [ ] Create Feedback via IPC
- [ ] Create Feature Request via IPC
- [ ] Create Feature via IPC
- [ ] Add Check-in to Feature
- [ ] All types generate markdown files
- [ ] Existing data unaffected

### Phase 3 (New Entity Pages)
- [ ] Feedback list shows items
- [ ] Feedback detail edit/save works
- [ ] Feature Request list shows items
- [ ] Feature Request detail edit/save works
- [ ] Feature list shows items
- [ ] Feature detail edit/save works
- [ ] Check-in add/edit works

### Phase 4-5 (Navigation)
- [ ] Sidebar renders correctly
- [ ] Buckets expand/collapse
- [ ] Clicking bucket goes to bucket page
- [ ] Clicking type within bucket filters
- [ ] Counts update correctly
- [ ] Active state highlights correctly

### Phase 6 (Home)
- [ ] Inbox section shows unprocessed count
- [ ] Active Thinking shows active problems/hypotheses
- [ ] In Progress shows running experiments
- [ ] Recent Decisions shows last 5
- [ ] Feature Health shows features needing attention

### Phase 7 (Promotion)
- [ ] Capture can promote to all targets
- [ ] Feedback can promote to all targets
- [ ] Feature Request can promote to Problem/Hypothesis
- [ ] Source marked as actioned
- [ ] Target shows "Promoted from" link

### Phase 8-9 (Timeline & Export)
- [ ] Timeline shows new entity types
- [ ] Search finds new entities
- [ ] Export includes new types
- [ ] Export manifest valid

### Final
- [ ] App starts without errors
- [ ] All routes work
- [ ] Data persists across restart
- [ ] Workspace sync handles new types
- [ ] No console errors

---

## Rollback Plan

If critical issues arise:
1. Git branch is separate (`refactor/nav-and-entities`)
2. Don't merge to main until all phases complete
3. Database migration is additive (doesn't remove columns)
4. Old routes can coexist during transition

---

## Open Questions

1. **Should old entity list pages remain as direct routes?**
   - Option A: Remove them, only access via bucket pages
   - Option B: Keep as deep links (bookmarkable)
   - Recommendation: Keep routes, redirect from sidebar to bucket page

2. **Feature check-ins: separate table or JSON column?**
   - Option A: JSON column (simpler, fewer queries)
   - Option B: Separate table (more queryable, cleaner)
   - Recommendation: JSON column for v1, migrate if needed

3. **Bucket page as default or Home as default?**
   - Current: Home is default
   - Recommendation: Keep Home as default, it's the overview

---

## Estimated Effort

| Phase | Complexity | Estimate |
|-------|------------|----------|
| 0 | Low | 1 session |
| 1 | Medium | 1 session |
| 2 | High | 2 sessions |
| 3 | High | 2 sessions |
| 4 | Medium | 1 session |
| 5 | High | 2 sessions |
| 6 | Medium | 1 session |
| 7 | Medium | 1-2 sessions |
| 8 | Low | 1 session |
| 9 | Low | 1 session |
| 10 | Medium | 1-2 sessions |
| 11 | Low | 1 session |

**Total: ~15-17 Claude Code sessions**

---

## Version

- Plan Version: 1.0
- Created: 2026-01-13
- Last Updated: 2026-01-13
- Status: Draft — Ready for Review
