# Plan: Retire “Entities” Tab (Clients + Team) and Migrate to Dashboard User Directory

## Goals
- Remove Entities tab and consolidate all Clients/Team management into the Dashboard tab’s unified user directory.
- Preserve full CRUD and workflows via unified forms/services while maintaining backward compatibility and redirects.
- Reduce duplication (types, APIs, forms, filters) and simplify navigation.

## Current State (from docs/ADMIN_USERS_DATA_AUDIT_REPORT.md + code)
- Entities tab exists with Clients/Team sub-tabs: `src/app/admin/users/components/tabs/EntitiesTab.tsx`
- Dashboard tab already hosts the unified user directory (UsersTable + AdvancedUserFilters): `ExecutiveDashboardTab.tsx`
- Unified types/hooks/services are in place: `types/entities.ts`, `useFilterUsers.ts`, `useUnifiedUserService.ts`, `useEntityForm.ts`
- Legacy routes redirect to Entities: `/admin/clients`, `/admin/team` → `/admin/users?tab=entities`
- APIs: `/api/admin/entities/clients`, `/api/admin/entities/team-members`; and generalized `/api/admin/users` search/filter in place
- Forms: `ClientFormModal.tsx`, `TeamMemberFormModal.tsx` (duplicated logic)

## Decision
- Retire Entities tab and move Clients/Team management into Dashboard tab via:
  - Role-scoped filters (CLIENT, TEAM_MEMBER, TEAM_LEAD, etc.) and saved views
  - A single “New” action that opens a unified User form (role-first flow)
- Keep legacy routes functional via updated redirects into Dashboard tab with role filters.

## Scope
- UI: Tabs/navigation, Dashboard enhancements, form consolidation, removal of Entities tab.
- API: Prefer `/api/admin/users` with role filters; keep legacy `/api/admin/entities/*` endpoints during deprecation window.
- Types/hooks/services: Continue using unified types and hooks.
- Tests: Update E2E/unit to new paths and behaviors.
- Docs: Update all references.

## Phased Rollout (with feature flag: `RETIRE_ENTITIES_TAB`)
1) Prepare (FF off)
2) Dual-run (FF on for staging) + redirects to Dashboard
3) Remove Entities (FF default on) post soak
4) Cleanup legacy APIs, tests, docs

## Detailed Tasks

### 1) Dashboard Tab Upgrades (unified user directory)
- Add role presets and saved views:
  - Quick chips: “All”, “Clients”, “Team”, “Admins”
  - Map chips to filters in `useFilterUsers.ts` (role/status/department)
- Add “New” split-button:
  - Primary: New User
  - Submenu: Client, Team Member, Team Lead, Admin → Preselect role in form
- Extend AdvancedUserFilters to include:
  - Role multi-select (CLIENT, TEAM_MEMBER, TEAM_LEAD, STAFF, ADMIN)
  - Client-tier and department filters (if present)
- Wire CRUD to `useUnifiedUserService.ts`; keep behavior consistent with Entities.
- Files:
  - `src/app/admin/users/components/tabs/ExecutiveDashboardTab.tsx`
  - `src/app/admin/users/components/AdvancedUserFilters.tsx`
  - `src/app/admin/users/components/UsersTable.tsx`
  - `src/app/admin/users/hooks/useFilterUsers.ts`

### 2) Unified Form Consolidation
- Create `UnifiedUserFormModal` (role-first) built on `useEntityForm.ts`:
  - Dynamically render fields based on role (client: tier/phone; team: department/specialties; admin: RBAC hints)
  - Server endpoints: POST/PATCH `/api/admin/users` + role-specific payload adapters
- Replace `ClientFormModal.tsx` and `TeamMemberFormModal.tsx` usage with `UnifiedUserFormModal`.
- Keep legacy modals exported for transition; mark deprecated in code comments (no TODO placeholders).
- Files:
  - `src/components/admin/shared/UnifiedUserFormModal.tsx` (new)
  - `src/components/admin/shared/ClientFormModal.tsx` (migrate calls → new)
  - `src/components/admin/shared/TeamMemberFormModal.tsx` (migrate calls → new)
  - `src/app/admin/users/components/*` (open modal hooks/handlers)

### 3) Remove Entities Tab from UI
- Remove Entities entry from tab navigation:
  - `src/app/admin/users/components/TabNavigation.tsx` (remove { id: 'entities', … })
- Remove EntitiesTab import/render:
  - `src/app/admin/users/EnterpriseUsersPage.tsx` (delete EntitiesTab block)
  - `src/app/admin/users/components/index.ts` (remove EntitiesTab export)
  - `src/app/admin/users/components/tabs/index.ts` (ensure clean)
- Delete Entities-specific UI fragments inside Dashboard once parity confirmed (e.g., `EntityRelationshipMap` entry points if only used there).
- Files impacted:
  - `TabNavigation.tsx`, `EnterpriseUsersPage.tsx`, `components/index.ts`

### 4) Routing & Redirects
- Update legacy redirects to Dashboard:
  - `/admin/clients` → `/admin/users?tab=dashboard&role=CLIENT`
  - `/admin/team` → `/admin/users?tab=dashboard&role=TEAM_MEMBER` (or role in {TEAM_MEMBER, TEAM_LEAD})
- Ensure URL param parsing in `EnterpriseUsersPage.tsx` applies role filters to Dashboard on load.
- Keep `/admin/permissions` → `/admin/users?tab=rbac` as is.
- Files:
  - `src/app/admin/users/EnterpriseUsersPage.tsx` (URL param → filters)
  - Any dedicated redirect pages/hooks already used in e2e (`admin-unified-redirects.spec.ts`)

### 5) API Strategy
- Preferred: `/api/admin/users?role=CLIENT|TEAM_MEMBER|TEAM_LEAD&…` for listing/filtering
- Keep `/api/admin/entities/clients` and `/api/admin/entities/team-members` for one release as thin proxies calling unified service; mark deprecated.
- Align create/update endpoints to `/api/admin/users` with role validations; maintain old endpoints as passthrough during deprecation window.
- Files:
  - `src/app/api/admin/users/…` (ensure filters include role/tier/department)
  - `src/app/api/admin/entities/clients(…)/route.ts` (proxy + deprecation header)
  - `src/app/api/admin/entities/team-members(…)/route.ts` (proxy + deprecation header)

### 6) Types/Schema Alignment
- Continue with unified types: `src/app/admin/users/types/entities.ts`
- Ensure `ClientItem` and `TeamMemberItem` extend base `UserItem` cleanly; remove stray interface copies.
- Confirm schema fields present for client/team properties used by form (`tier`, `phone`, `workingHours`, `bookingBuffer`, `autoAssign`, `certifications`, `experienceYears`).
- Files:
  - `prisma/schema.prisma` (validate presence)
  - `src/app/admin/users/types/entities.ts`

### 7) Settings and Admin Pages
- Keep User Management settings (clients/teams) intact; surfaces in Dashboard filters and form defaults.
- No change to `src/app/admin/settings/user-management/page.tsx` beyond copy updates (remove references to “Entities tab”).
- Files:
  - `src/app/admin/settings/user-management/page.tsx`
  - `src/app/admin/settings/user-management/types.ts`

### 8) Tests
- Update E2E:
  - Remove `e2e/tests/admin-entities-tab.spec.ts`
  - Update `e2e/tests/admin-unified-redirects.spec.ts` to assert redirects land in Dashboard + role filter chip active
  - Adjust “Add user from Entities tab” flow → “Add user from Dashboard”
- Update unit/integration tests referencing Entities:
  - Replace `tab=entities` with `tab=dashboard` + role filter assertions
- Files:
  - `e2e/tests/admin-unified-redirects.spec.ts`
  - `e2e/tests/admin-add-user-flow.spec.ts`
  - `e2e/tests/phase3-virtual-scrolling.spec.ts` (navigate Dashboard directly)
  - Tests that depend on `/admin/entities/...` APIs (point to `/admin/users`)

### 9) Cleanups (post-deprecation window)
- Remove `EntitiesTab.tsx` and any Entities-only helpers/components.
- Remove `/api/admin/entities/clients` and `/api/admin/entities/team-members` routes after telemetry window.
- Purge any menu validator allowances for `admin/clients`/`admin/team` if no longer needed.

## Backward Compatibility
- Redirect old routes to Dashboard with selected filters.
- Keep legacy APIs (entities) as pass-through for one release cycle; add `Deprecation` and `Link` headers.

## Risks & Mitigations
- Risk: Missed CRUD parity → Mitigation: parity checklist + smoke tests on Dashboard for CLIENT/TEAM flows.
- Risk: Test flake due to changed navigation → Mitigation: update selectors, stabilize waits, run CI twice on PR.
- Risk: External links to Entities → Mitigation: redirects + telemetry to monitor hit counts.

## Acceptance Criteria
- Entities tab removed from UI; no route exposing it.
- Dashboard supports full Clients/Team listing + CRUD via unified form.
- Legacy routes redirect to Dashboard with filters.
- All E2E/unit tests pass; no regression in RBAC tab.
- Deprecated APIs respond with deprecation headers; calls reduced over time.

## Work Breakdown (file-level checklist)
- Remove tab:
  - `src/app/admin/users/components/TabNavigation.tsx`
  - `src/app/admin/users/EnterpriseUsersPage.tsx`
  - `src/app/admin/users/components/index.ts`
- Dashboard upgrades:
  - `ExecutiveDashboardTab.tsx`, `AdvancedUserFilters.tsx`, `UsersTable.tsx`, `useFilterUsers.ts`
- Unified form:
  - + `UnifiedUserFormModal.tsx`
  - Migrate `ClientFormModal.tsx`, `TeamMemberFormModal.tsx` call sites
- API:
  - Ensure `/api/admin/users` supports role filters thoroughly
  - Add deprecation/proxy to `/api/admin/entities/clients*`, `/api/admin/entities/team-members*`
- Tests:
  - Remove `admin-entities-tab.spec.ts`
  - Update `admin-unified-redirects.spec.ts`, `admin-add-user-flow.spec.ts`, `phase3-virtual-scrolling.spec.ts`
- Docs:
  - Update consolidation docs to reflect Entities retirement; add migration notes

## Timeline (estimate)
- Day 1-2: Dashboard enhancements + role chips + unified form scaffolding
- Day 3: Replace modal usage; CRUD parity validation; proxy APIs
- Day 4: Remove Entities tab; redirects; tests update
- Day 5: QA, soak in staging with FF, telemetry checks

## Rollout
- Stage behind `RETIRE_ENTITIES_TAB` in staging for 2-3 days.
- Enable in production with redirects and deprecation headers.
- After 1-2 sprints, remove legacy APIs/tests.

---

## Single-Page Dashboard Redesign (Oracle Fusion–style “Work Area”)

### Objectives
- Convert Dashboard into a single-page work area focused on operations and user management productivity.
- Surface User Directory at the top; reduce clicks; consolidate Overview/Operations into one canvas.

### Information Architecture
- Primary: User Directory (virtualized grid/list) with sticky global filters and saved views.
- Secondary: Compact infolets (KPIs), Approvals/Workflows, Import/Export, Recent Activity.
- Utilities: Command Bar (Add, Import CSV, Bulk Update, Export, Refresh), Command Palette (⌘K), Saved Views (URL-addressable).

### Layout (desktop)
- Header: Title + Command Bar; right-aligned omnibox search (name/email/id/role) with suggestions.
- Infolets row: 3–4 compact tiles; collapsible; defaults to compact to keep directory above the fold.
- Left filter rail (collapsible): Role, Status, Created, Department, Tier; sticky on scroll; counts per facet.
- Main content (pinned first): User Directory with column chooser, list/card toggle, infinite pagination, selection.
- Details: Split pane/drawer opens on row select; tabs inside (Overview, Details, Activity, Settings) without leaving page.
- Optional right rail: Pending Approvals, In-Progress Workflows, Alerts; collapsible.

### Interactions (Oracle patterns)
- Create/Tasks menu: New User → Client/Team Member/Team Lead/Admin (role-first); contextual actions by selection count.
- Bulk action bar on selection: Assign Role, Change Status, Export, Delete; impact preview.
- Saved Views: “All, Clients, Team, Admins, My Team, Recently Added”; sharable via URL.
- Filter chips with one-click clear/apply; keyboard shortcuts; row kebab actions (RBAC-gated).

### Performance & Resilience
- Server-side paging + filters; 30s cache; request dedupe; optimistic updates; background refresh; skeleton loaders.

### Accessibility & i18n
- Landmarks for header/nav/main/aside; ARIA grid with row/col headers; live regions for actions; full keyboard Nav; RTL-safe.

### Mobile/Tablet
- Sticky search and primary actions; filters in bottom sheet; directory in card mode; drawer for details; gesture-friendly.

### Telemetry & Rollout
- Metrics: view adoption, search-to-action rate, bulk success/errors, save-view usage.
- A/B: compact vs expanded infolets; enable with feature flag `DASHBOARD_SINGLE_PAGE`.

### Migration Steps (incremental)
1. Move User Directory above infolets; introduce compact infolets.
2. Add left filter rail + saved views + omnibox search.
3. Add Command Bar + keyboard palette (⌘K).
4. Implement split-pane/drawer for details; retire child tabs.
5. Update tests/docs; monitor telemetry and iterate.

### Files Impact
- `src/app/admin/users/components/tabs/ExecutiveDashboardTab.tsx`
- `src/app/admin/users/EnterpriseUsersPage.tsx`
- `src/app/admin/users/components/UsersTable.tsx`
- `src/app/admin/users/components/AdvancedUserFilters.tsx`
- `src/app/admin/users/hooks/useFilterUsers.ts`
- `src/app/admin/users/components/*` (command bar, drawer, infolets)

### Acceptance Criteria (single-page redesign)
- User Directory is visible above the fold on desktop; <2 clicks to common actions.
- Filters are sticky; saved views persist via URL; virtualized grid remains smooth at 1k+ rows.
- Drawer interaction avoids page navigation; bulk bar appears contextually; all actions RBAC-gated.

---

## Admin/Users Code Audit Findings (pre-implementation reference)

### Entry Points & Tabs
- `src/app/admin/users/page.tsx` → renders `EnterpriseUsersPage` with Suspense.
- `src/app/admin/users/EnterpriseUsersPage.tsx` orchestrates tabs via `TabNavigation` and loads:
  - `ExecutiveDashboardTab` (Dashboard)
  - `EntitiesTab` (Clients/Team)
  - lazy: `WorkflowsTab`, `BulkOperationsTab`, `AuditTab`, `AdminTab`
  - `RbacTab` (Roles & Permissions)
- Query param `?tab=` initializes active tab; valid set includes `entities` (to retire).
- Global actions wired: Add User (opens `CreateUserModal`), Import, Bulk, Export (CSV), Refresh.

### State & Context Architecture
- Unified provider: `src/app/admin/users/contexts/UsersContextProvider.tsx` composes:
  - `UserDataContext` (data, stats, refresh)
  - `UserUIContext` (dialogs/profile state)
  - `UserFilterContext` (filters + `getFilteredUsers`)
- `useUserManagementRealtime` keeps user list in sync (debounced, autoRefresh).
- `UserItem` includes extended fields (tier, workingHours, bookingBuffer, autoAssign, certifications, experienceYears, department, position, skills, hourlyRate).

### Key Components
- `ExecutiveDashboardTab.tsx`
  - Internal sub-tabs: `Overview` and `Operations` (current UX concern: directory in Operations below KPIs).
  - Uses `useDashboardMetrics`, `useDashboardAnalytics`, `useDashboardRecommendations` (dynamic data),
    server-side filtering when filters active (`useServerSideFiltering`), otherwise `useFilterUsers`.
  - Bulk actions UI (role/status/department) with toasts.
- `UsersTable.tsx`
  - Virtualized list via `VirtualScroller` (60vh viewport), selection with tri-state “select all”, inline role change, accessible labels.
- `RbacTab.tsx`
  - 4 subtabs: Roles, Hierarchy (`PermissionHierarchy`), Test Access (`PermissionSimulator`), Conflicts (`ConflictResolver`).
  - CRUD via `/api/admin/roles`, `UnifiedPermissionModal` for create/edit.
- `EntitiesTab.tsx`
  - Sub-tabs Clients/Team; Clients uses `ClientService.list` and `/api/admin/entities/clients/[id]` for delete; Team uses `TeamManagement` + `TeamMemberFormModal`.

### Hooks & Services
- `useUnifiedUserService.ts`
  - Auto-picks endpoint: `/api/admin/users/search` when filters provided, else `/api/admin/users`.
  - 30s cache, dedupe, exponential backoff, abort, timeout, normalized responses.
- `useFilterUsers.ts`
  - Client-side filter + server query builder; supports role/status/department/tier; default search fields: name,email,company; date sort.

### APIs Touched
- `/api/admin/users`, `/api/admin/users/search`, `/api/admin/users/stats` (dashboard).
- `/api/admin/roles` (RBAC).
- `/api/admin/entities/clients` and `/api/admin/entities/clients/[id]` (to deprecate).

### Accessibility & Perf
- ErrorBoundaries per tab, Suspense fallbacks, skeleton UIs.
- ARIA roles for grid, status, toolbar; keyboard-friendly controls.
- Code-splitting for heavier tabs.

### Risks / Migration Notes
- EntitiesTab present in `TabNavigation` and `EnterpriseUsersPage`; remove both.
- Clients/Team modals depend on legacy services; adopt `UnifiedUserFormModal` and `/api/admin/users`.
- Ensure `?tab=entities` redirects to `?tab=dashboard&role=…` and URL param parser applies filters.

### Test Impact (to update)
- `e2e/tests/admin-entities-tab.spec.ts` (remove)
- `e2e/tests/admin-unified-redirects.spec.ts` (assert Dashboard + role chip)
- `e2e/tests/phase3-virtual-scrolling.spec.ts` (navigate dashboard directly)
- `e2e/tests/admin-add-user-flow.spec.ts` (replace Entities flow with Dashboard flow)

### Feature Flags (recommended)
- `RETIRE_ENTITIES_TAB` – remove Entities UI and update redirects.
- `DASHBOARD_SINGLE_PAGE` – enable work-area layout, compact infolets, left filter rail, saved views.

---

## Gaps Identified (to close before coding)
- URL role filter not parsed/applied on Dashboard; legacy route redirects lack role preselection.
- Client/Team modals not unified; need `UnifiedUserFormModal` and role-first creation path from `CreateUserModal`.
- UsersTable `onViewProfile` not wired to `UserProfileDialog` drawer; missing Saved Views, left filter rail, and Command Bar/⌘K.
- `/api/admin/entities/*` missing `Deprecation` headers; feature flags + telemetry not standardized.

## Phased To‑Do Plan (small, trackable tasks)

### Phase 0 — Flags, Telemetry, Guards
- [ ] Add feature flags: `RETIRE_ENTITIES_TAB`, `DASHBOARD_SINGLE_PAGE` (env + runtime check).
- [ ] Instrument telemetry events: `users.view_saved`, `users.search`, `users.bulk_apply`, `users.redirect_legacy`.
- [ ] Add runtime guard in `EnterpriseUsersPage.tsx` to hide Entities when `RETIRE_ENTITIES_TAB` on.

### Phase 1 — URL Role Filter + Redirects
- [ ] In `EnterpriseUsersPage.tsx`, parse `role` from URL; set UsersContext filters on mount.
- [ ] Update redirect handlers so:
  - `/admin/clients` → `/admin/users?tab=dashboard&role=CLIENT`
  - `/admin/team` → `/admin/users?tab=dashboard&role=TEAM_MEMBER`
- [ ] Add tests in `e2e/tests/admin-unified-redirects.spec.ts` for role chip active after redirect.

### Phase 2 — Unified Creation Flow
- [ ] Create `src/components/admin/shared/UnifiedUserFormModal.tsx` using `useEntityForm`.
- [ ] Support role-first create (prefill fields by role); validation per role.
- [ ] Replace usage of `ClientFormModal` and `TeamMemberFormModal` across Entities/Dashboard with Unified modal.
- [ ] Update `CreateUserModal` to route into Unified modal with selected role.
- [ ] Add unit tests for payload mapping per role.

### Phase 3 — Work-Area UX Enhancements
- [ ] Wire `UsersTable.onViewProfile` → open `UserProfileDialog` drawer (split-pane/drawer behavior).
- [ ] Add Saved Views (URL-addressable) to `ExecutiveDashboardTab` (e.g., `view=my-team`, `recent`).
- [ ] Implement left filter rail (collapsible) with Role/Status/Department/Tier; sticky on scroll.
- [ ] Add Command Bar with actions: Add, Import CSV, Bulk Update, Export, Refresh.
- [ ] Add Command Palette (⌘K) with quick actions and entity search.
- [ ] Ensure User Directory appears above infolets when `DASHBOARD_SINGLE_PAGE` is on.

### Phase 4 — API Deprecation & Proxies
- [ ] Add `Deprecation: true` and `Link: </api/admin/users>; rel="successor"` headers to `/api/admin/entities/clients*` and `team-members*`.
- [ ] Ensure proxies forward to unified service where possible; normalize responses.
- [ ] Add server logs/metrics for legacy endpoint usage.

### Phase 5 — Retire Entities UI (behind FF)
- [ ] Remove `entities` from `TabNavigation.tsx` when flag on.
- [ ] Remove EntitiesTab code path in `EnterpriseUsersPage.tsx` (flag-guarded first).
- [ ] Update menu validators and redirects; keep redirects for 1–2 sprints.

### Phase 6 — Tests & Docs
- [ ] Update E2E: remove `admin-entities-tab.spec.ts`; adjust flows to Dashboard.
- [ ] Update virtual scrolling tests to navigate Dashboard directly.
- [ ] Update docs to reflect single-page work area and unified creation.

### Phase 7 — Rollout & Monitoring
- [ ] Enable flags in staging; monitor metrics and errors.
- [ ] Enable in production; watch `users.redirect_legacy` trend to decide legacy API removal.
- [ ] After soak, delete EntitiesTab + legacy routes; remove feature flags.

## File-Level Task Map
- URL/Redirects: `src/app/admin/users/EnterpriseUsersPage.tsx`, redirect utilities/pages.
- Unified Modal: `src/components/admin/shared/UnifiedUserFormModal.tsx`, replace uses in `EntitiesTab.tsx` and Dashboard components.
- Drawer/Saved Views/Rail/Command Bar: `src/app/admin/users/components/tabs/ExecutiveDashboardTab.tsx`, `UsersTable.tsx`, filters.
- API Deprecation: `src/app/api/admin/entities/clients*/route.ts`, `team-members*/route.ts`, server logging.
- Flags: gating in `TabNavigation.tsx`, `EnterpriseUsersPage.tsx`.
- Tests: `e2e/tests/*`, unit tests for modal payload and URL filter parser.

## Exit Criteria
- Legacy URLs redirect to Dashboard with role preselected; filters applied on load.
- Unified modal handles Client/Team/Admin creation; old modals unused.
- Drawer navigation avoids full-page transitions; Saved Views persist via URL.
- Entities UI hidden; legacy APIs emit deprecation; telemetry confirms adoption.
