# Product OS — Claude Code Prompts by Phase

This file contains ready-to-paste prompts for each implementation phase.
Copy the appropriate prompt into Claude Code to execute that phase.

---

## Phase 0: Preparation

```
Read REFACTOR_PLAN.md to understand the full scope of this refactor.

We're restructuring Product OS from entity-type navigation (8+ sidebar items) to flow-based navigation (4 buckets: Inbox, Thinking, Work, Evidence), while adding three new entity types (Feedback, Feature Request, Feature).

For this phase:
1. Create a new git branch: refactor/nav-and-entities
2. Review the current sidebar component structure
3. List all files that will need modification
4. Confirm all existing tests pass (if any)

Don't make any code changes yet. Just assess the current state and confirm readiness.
```

---

## Phase 1: Database Schema Updates

```
Read REFACTOR_PLAN.md and schema_v2.sql for context.

Implement the database schema changes for new entity types:

1. Create electron/database/migrations/002_new_entity_types.sql with:
   - New columns on entities table: feedback_type, source, source_url, priority, declined_reason, linked_problem_id, linked_feature_id, health, shipped_at, check_ins, promoted_from_id
   - New junction tables: feature_decisions, feature_experiments, feature_requests_fulfilled
   - New indexes for the new columns

2. Update electron/database/db.ts to:
   - Run migrations on startup
   - Check if migration already applied before running

3. Test by starting the app and verifying:
   - No errors on startup
   - New columns exist (query sqlite_master)
   - Existing data is unaffected

Do NOT modify any UI yet. Data layer only.
```

---

## Phase 2: TypeScript Types & IPC Handlers

```
Read REFACTOR_PLAN.md and types_v2.ts for context.

Implement types and IPC handlers for new entity types:

1. Update src/lib/types.ts with:
   - New EntityType values: 'feedback', 'feature_request', 'feature'
   - Feedback, FeatureRequest, Feature interfaces
   - FeedbackType, FeedbackStatus, FeatureRequestStatus, FeatureStatus, FeatureHealth enums
   - FeatureCheckIn interface
   - Create/Update data interfaces for each
   - Bucket configuration (BUCKETS, BUCKET_ENTITY_TYPES)
   - Entity type configuration (ENTITY_TYPE_CONFIG)
   - Status configurations

2. Create database query files:
   - electron/database/queries/feedback.ts (CRUD operations)
   - electron/database/queries/featureRequests.ts (CRUD operations)
   - electron/database/queries/features.ts (CRUD + check-in operations)

3. Create IPC handlers:
   - electron/ipc/feedback.ts
   - electron/ipc/featureRequests.ts
   - electron/ipc/features.ts

4. Update electron/preload.ts to expose new IPC methods

5. Update src/lib/ipc.ts with client wrappers

6. Update electron/markdown/writer.ts and templates.ts for new entity types

7. Update electron/workspace/sync.ts to create new entity folders:
   - feedback/
   - feature_requests/
   - features/

8. Test by creating one of each new entity type via console/IPC and verifying:
   - Database record created
   - Markdown file generated in correct folder

ID prefixes:
- Feedback: fdbk_xxx
- Feature Request: freq_xxx
- Feature: feat_xxx
- Check-in: checkin_xxx
```

---

## Phase 3: New Entity UI Pages

```
Read REFACTOR_PLAN.md and DESIGN_SPEC.md for context.

Create list and detail pages for new entity types:

1. Create list pages:
   - src/pages/FeedbackListPage.tsx
   - src/pages/FeatureRequestListPage.tsx
   - src/pages/FeatureListPage.tsx

2. Create detail pages:
   - src/pages/FeedbackDetailPage.tsx (with feedbackType dropdown, source fields)
   - src/pages/FeatureRequestDetailPage.tsx (with priority, declined reason)
   - src/pages/FeatureDetailPage.tsx (with health, shipped date, check-ins section)

3. Create check-in components:
   - src/components/features/CheckInForm.tsx (modal for add/edit)
   - src/components/features/CheckInList.tsx (display list with edit/delete)

4. Add routes in src/App.tsx:
   - /feedback → FeedbackListPage
   - /feedback/:id → FeedbackDetailPage
   - /feature-requests → FeatureRequestListPage
   - /feature-requests/:id → FeatureRequestDetailPage
   - /features → FeatureListPage
   - /features/:id → FeatureDetailPage

5. Update src/components/entity/FilePath.tsx to support new types

6. Update src/components/shared/StatusBadge.tsx with new status colors

Use existing entity pages as templates. Match the styling and patterns.
Test all CRUD operations work for each new type.
```

---

## Phase 4: Navigation Restructure — Sidebar

```
Read REFACTOR_PLAN.md and DESIGN_SPEC.md for context.

Restructure the sidebar from entity-type navigation to bucket-based navigation:

1. Create new components:
   - src/components/layout/SidebarBucket.tsx (expandable bucket with count)
   - src/components/layout/SidebarItem.tsx (individual nav item)

2. Refactor src/components/layout/Sidebar.tsx:
   - Replace flat entity list with bucket structure
   - Buckets: Inbox, Thinking, Work, Evidence
   - Each bucket expandable to show entity types within
   - Counts for each bucket and sub-item
   - Keep Quick Capture button at top
   - Keep Timeline, Manage Context, Exports, Settings at bottom

3. Bucket configuration (from types_v2.ts):
   - Inbox: capture, feedback, feature_request
   - Thinking: problem, hypothesis
   - Work: experiment, decision, feature
   - Evidence: artifact

4. Interaction:
   - Click bucket name → navigate to bucket page
   - Click expand arrow → toggle sub-items
   - Click sub-item → navigate to bucket page with filter
   - Show counts that update in real-time

5. Styling:
   - Use icons from Lucide (inbox, brain, flask-conical, paperclip)
   - Highlight active bucket/item
   - Smooth expand/collapse animation (150ms)

Test that all navigation still works. Old direct routes should still function.
```

---

## Phase 5: Bucket List Pages

```
Read REFACTOR_PLAN.md and DESIGN_SPEC.md for context.

Create unified bucket pages that show multiple entity types with filters:

1. Create bucket pages:
   - src/pages/InboxPage.tsx (Captures, Feedback, Requests)
   - src/pages/ThinkingPage.tsx (Problems, Hypotheses)
   - src/pages/WorkPage.tsx (Experiments, Decisions, Features)
   - src/pages/EvidencePage.tsx (Artifacts)

2. Create shared components:
   - src/components/shared/BucketTabs.tsx (tab bar for filtering by type)
   - src/components/shared/PromoteDropdown.tsx (for inbox items)

3. Each bucket page should:
   - Show tabs for "All" + each entity type in that bucket
   - Fetch entities of all types in the bucket
   - Filter by selected tab
   - Show unified list with type icons
   - Include search
   - "Promote" dropdown for inbox items

4. Add routes in src/App.tsx:
   - /inbox → InboxPage
   - /thinking → ThinkingPage
   - /work → WorkPage
   - /evidence → EvidencePage

5. Update sidebar to navigate to bucket pages instead of individual entity pages

Test that filtering works, counts are accurate, and clicking items navigates to detail pages.
```

---

## Phase 6: Home Dashboard Update

```
Read REFACTOR_PLAN.md and DESIGN_SPEC.md for context.

Update the home dashboard to reflect the new bucket structure:

1. Refactor src/pages/HomePage.tsx with new sections:
   - 📥 Inbox (unprocessed count) - shows recent captures, feedback, requests
   - 🧠 Active Thinking - shows active problems and hypotheses
   - 🔬 In Progress - shows running experiments
   - ✓ Recent Decisions - shows last 5 decisions
   - 🚀 Feature Health - shows features with health status (especially needs_attention)

2. Each section should:
   - Show count in header
   - "View all →" link to bucket page
   - Show 3-5 most relevant items
   - Have appropriate empty state

3. Layout:
   - 2-column grid for first 4 sections
   - Full-width for Feature Health section
   - Responsive: stack on mobile

4. Data fetching:
   - Create hooks or queries for each section
   - Inbox: status = 'new' (unprocessed)
   - Active Thinking: status = 'active'
   - In Progress: experiments with status = 'running'
   - Recent Decisions: sorted by createdAt desc, limit 5
   - Feature Health: all features, highlight needs_attention

Test that all sections populate correctly and links navigate to right places.
```

---

## Phase 7: Promotion Flows

```
Read REFACTOR_PLAN.md and DESIGN_SPEC.md for context.

Implement promotion flows from inbox items to structured entities:

1. Update src/components/shared/PromoteDropdown.tsx:
   - Show valid promotion targets based on source type
   - Capture → Problem, Hypothesis, Feedback, Feature Request, Artifact
   - Feedback → Problem, Hypothesis, Feature Request, Artifact
   - Feature Request → Problem, Hypothesis

2. Create promotion logic:
   - When promoting:
     a. Create new entity of target type
     b. Pre-fill title and body from source
     c. Copy taxonomy tags
     d. Set source.promotedToId = new entity id
     e. Set target.promotedFromId = source id
     f. Set source status to 'actioned' (for Feedback) or mark as promoted (for Capture)
     g. Navigate to new entity detail page

3. Create src/components/shared/PromotedFromBadge.tsx:
   - Shows "Promoted from [type]: [title]" with link
   - Display on entity detail pages when promotedFromId exists

4. Update detail pages:
   - Add PromoteDropdown to CaptureDetailPage
   - Add PromoteDropdown to FeedbackDetailPage
   - Add PromoteDropdown to FeatureRequestDetailPage
   - Add PromotedFromBadge to all entity detail pages

5. Test full promotion flows:
   - Create capture → promote to problem → verify links both ways
   - Create feedback → promote to feature request → verify source marked actioned
```

---

## Phase 8: Timeline & Search Updates

```
Read REFACTOR_PLAN.md for context.

Update Timeline and search to include new entity types:

1. Update src/pages/TimelinePage.tsx:
   - Include feedback, feature_request, feature in query
   - Add icons and colors for new types
   - Ensure proper sorting by date

2. Update src/components/timeline/TimelineItem.tsx:
   - Handle new entity types
   - Show appropriate icons and status badges

3. Update command palette / global search (Cmd+K):
   - Include new entity types in search
   - Show type icon in results
   - Group results by bucket or type

4. Verify:
   - New entities appear in timeline
   - Search finds new entity types
   - Icons and colors are consistent
```

---

## Phase 9: Export Updates

```
Read REFACTOR_PLAN.md for context.

Update exports to include new entity types:

1. Update electron/database/queries/exports.ts:
   - Include feedback, feature_request, feature in export queries
   - Add type-specific filters if needed

2. Update export folder structure:
   - exports/objects/feedback/
   - exports/objects/feature_requests/
   - exports/objects/features/

3. Update manifest.json schema:
   - Include new types in byType counts
   - Add new type metadata

4. Update snapshot.md template:
   - Add "Recent Feedback" section
   - Add "Feature Requests" section
   - Add "Shipped Features" section with health

5. Test:
   - Run full export, verify new types included
   - Run incremental export, verify new types included
   - Check manifest is valid JSON
   - Check snapshot.md renders correctly
```

---

## Phase 10: Polish & Edge Cases

```
Read REFACTOR_PLAN.md for context.

Final polish pass:

1. Empty states:
   - Add empty state for each bucket page (see DESIGN_SPEC.md)
   - Add empty state for Feature Health on home

2. Loading states:
   - Ensure all bucket pages show loading skeleton
   - Ensure all detail pages show loading state

3. Error handling:
   - Toast notifications for all IPC errors
   - Graceful handling of missing entities (404 state)

4. Keyboard navigation:
   - Tab through sidebar buckets
   - Arrow keys to expand/collapse
   - Enter to navigate

5. Tooltips:
   - Add tooltips to sidebar bucket icons
   - Add tooltips to status badges

6. Clean up:
   - Remove any console.log statements
   - Remove unused imports
   - Ensure no TypeScript errors

7. Test edge cases:
   - Create entity with very long title
   - Create entity with special characters
   - Delete entity that's linked to others
   - Promote already-promoted item (should not be possible)

8. Test full flow:
   - Capture → Promote to Feedback → Promote to Problem → Create Hypothesis → Run Experiment → Record Decision → Create Feature → Add Check-in
```

---

## Phase 11: Documentation & Cleanup

```
Final documentation and cleanup:

1. Update CLAUDE.md:
   - Add new entity types to documentation
   - Update project structure with new files
   - Add bucket navigation explanation
   - Update IPC API documentation

2. Archive old docs:
   - Move PHASES.md to docs/archive/ (or update with note about refactor)

3. Remove dead code:
   - If old individual entity list pages are no longer used as standalone, consider removing or marking deprecated
   - Remove any unused components

4. Update README.md:
   - Update feature list
   - Update screenshots (if any)

5. Final test:
   - Fresh start (delete database, restart app)
   - Go through entire onboarding flow
   - Create at least one of each entity type
   - Verify all navigation works
   - Verify exports work
   - Verify workspace sync works

6. Commit and merge:
   - Commit all changes with message "Refactor: Bucket navigation + new entity types"
   - Merge refactor/nav-and-entities into main
   - Delete feature branch
```

---

## Rollback Prompt (If Needed)

```
STOP. There's a critical issue with the refactor.

1. Do NOT make any more changes
2. List all files modified in this session
3. Identify the specific change that caused the issue
4. Options:
   a. Revert just the problematic change
   b. Git stash and start this phase over
   c. Git checkout main to fully rollback

What is the specific error or issue you're seeing?
```

---

## Resume After Compaction Prompt

```
Read REFACTOR_PLAN.md to get context on the navigation refactor project.

Current status: [PHASE X] - [brief description of where we left off]

Completed phases:
- Phase 0: ✅
- Phase 1: ✅
- Phase 2: ✅
- [etc.]

Next task: [specific task to resume]

Continue from where we left off. Don't repeat completed work.
```

---

End of Prompts Document
