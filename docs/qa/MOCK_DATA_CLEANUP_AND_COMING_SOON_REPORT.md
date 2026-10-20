# EnrollNow — Mock Data Cleanup, Dashboard Demo Mode, and Coming Soon Handover Report

**Date:** 2026-10-20  
**Repository Branch:** `rolesimplementation`  
**Execution Context:** System-wide mock/dummy cleanup, single Dashboard demo JSON retention, Registry preservation, Coming Soon states for unimplemented functionality, and robust error propagation.

---

## 1. Executive Summary of Changes

A comprehensive, repository-wide cleanup and hardening of mock, placeholder, dummy, and fabricated business data was performed across both the frontend and backend of the EnrollNow application:

1. **Single Approved Dashboard Demo JSON:**
   - Established **exactly one** approved JSON file (`frontend/microfrontends/dashboard/src/demo/dashboard-demo-data.json`) containing synthetic, de-identified clinical trial metrics strictly for Dashboard demonstration.
   - Removed all duplicate Dashboard mock datasets from TypeScript source files and test fixtures (e.g. `SAMPLE_STUDIES` in `remoteEntry.tsx` and `MOCK_DASHBOARD_OVERVIEW` in `mockData.ts`).
   - Audited the entire repository to ensure 0 duplicate demo data sets remain.

2. **Dedicated Dashboard Demo Mode Adapter:**
   - Implemented `frontend/microfrontends/dashboard/src/demo/dashboardDataAdapter.ts` to control data resolution.
   - Governed strictly by `VITE_DASHBOARD_DEMO_MODE=true` (disabled by default in all production environments).
   - In Demo Mode: loads the single approved JSON file and renders a prominent, accessible "Demonstration Mode Active" badge.
   - In Live Mode: connects directly to real backend aggregation endpoints (`/api/v1/dashboard/overview`, `/api/v1/studies`, `/api/v1/participants`).
   - If an API request fails: renders an actionable error state with a retry option; **never falls back to demo data**.
   - If an API endpoint is not implemented (HTTP 501): cleanly renders the standardized "Coming Soon" component.

3. **Backend Dashboard Error Handling & Mock Removal:**
   - In `backend/enrollnow-dashboard-service/src/main/java/com/enrollnow/dashboard/services/DashboardAggregationService.java`:
     - Removed all silent `catch (Exception ignored)` blocks that previously swallowed database query exceptions.
     - Database exceptions now correctly propagate to the calling layer and `GlobalExceptionHandler`, ensuring real operational issues are never masked with empty or default payloads.
     - Removed fabricated fallback studies (`PROTO-2026-001`, etc.), artificial participant offsets (`+ 158`), and hardcoded recent activity/alerts.
     - The service strictly computes live aggregates from database repositories (`StudyRepository`, `ParticipantRepository`, `UserSessionRepository`) and returns genuine empty collections when no records exist.
     - Verified with `DashboardAggregationServiceTest.shouldPropagateDatabaseExceptionWhenQueryFails()`.

4. **Production API Mode Hardening:**
   - In `frontend/shared/api-config.ts`:
     - Hardened `getApiMode()` so that production builds (`import.meta.env.PROD` or `NODE_ENV === 'production'`) unconditionally return `'real'`.
     - Completely prevents mock mode or dummy mock adapters from executing in production environments.

5. **US-084 General Settings Business Data Cleanup:**
   - Rewrote `frontend/microfrontends/administration/src/components/GeneralSettingsView.tsx`:
     - Removed fabricated facility name, "SITE-001", hardcoded timezone, and Sunday maintenance schedule.
     - Removed all non-legacy facility settings and extraneous Coming Soon cards, matching legacy Ripple (retaining only clean Default Text Reply).
     - Eliminated silent fallback to fake defaults upon API failure; replaced with an accessible error banner with a Retry action.
     - Kept authoritative **Default Text Reply** management (160 characters limit) backed by real database persistence.

6. **Unimplemented Views Standardized with "Coming Soon":**
   - Reusable, accessible design-system component: `frontend/shared/design-system/components/ComingSoon.tsx`.
   - Replaced misleading fake tiles and placeholder data in `SiteAdminViews.tsx` (`StudiesView`, `ImportView`, `ExportView`, `AuditLogView`) with `<ComingSoon />`.
   - Replaced fallback dummy datasets and hardcoded stat counters in `microfrontends/communication`, `microfrontends/document`, `microfrontends/recruitment`, and `microfrontends/task` with `<ComingSoon />` states.

7. **Strict Registry Preservation:**
   - Registry UI components, filters, participant grids, backend controllers (`RegistryParticipantController`), database schema, and test suites were 100% preserved without modification.

---

## 2. Approved Dashboard Demo JSON File Path

The single designated application JSON file containing demonstration business data is:

```
frontend/microfrontends/dashboard/src/demo/dashboard-demo-data.json
```

- **Schema & Validation:** Valid JSON containing `overview`, `studies`, and `participants` collections.
- **De-identification:** All IDs (`PROTO-2026-001`, `PT-DEMO-001`), study titles, and metrics are synthetic. Contains zero credentials, tokens, secrets, or PHI/PII.

---

## 3. Automated Verification & Test Results

### Backend Test Results (15/15 Maven Modules Passed)
- `enrollnow-common`: 5 tests passed
- `enrollnow-identity-service`: 54 tests passed
- `enrollnow-dashboard-service`: 4 tests passed (including error propagation test)
- `enrollnow-study-service`: 2 tests passed
- `enrollnow-app`: 3 tests passed (`RegistryParticipantControllerTest`)
- **Reactor Summary:** `BUILD SUCCESS` (0 failures, 0 errors, total runtime ~21s)

### Frontend Test Results (13/13 Workspaces Passed)
- `@enrollnow/shared`: 12 test files, 102 tests passed
- `enrollnow-shell`: 3 test files, 26 tests passed (`InactivityLogout.test.ts`, `AuthContext.test.ts`, `RoleBasedNavigationAndAccess.test.ts`)
- `enrollnow-administration-mfe`: 2 test files, 20 tests passed (`siteSettingsViews.test.ts`, `administratorApi.test.ts`)
- `enrollnow-dashboard-mfe`: 2 test files, 9 tests passed (`dashboardDataAdapter.test.ts`, `dashboard.test.ts`)
- All other microfrontends (`identity`, `study`, `participant`, `recruitment`, `survey`, `task`, `communication`, `document`): 100% passed.
- **TypeScript Typecheck:** 0 errors across all 13 workspaces in monorepo (`tsc --noEmit`).

---

## 4. Preservation Checklist

| Component / Area | Status | Verification Note |
| :--- | :--- | :--- |
| **Registry Screen & UI** | PRESERVED | No changes made to `microfrontends/participant` views or workflows |
| **Registry Backend API** | PRESERVED | `RegistryParticipantControllerTest` passed with 3/3 tests |
| **Registry Database Schema** | PRESERVED | Tables, views, and migrations untouched |
| **Dashboard Live Mode** | VERIFIED | Directly hits backend aggregation endpoints |
| **Dashboard Demo Mode** | ISOLATED | Strictly uses `dashboard-demo-data.json`; disabled in prod |
| **Inactivity Logout** | COMPLETE | End-to-end multi-tab sync and timer enforcement tested |
| **General Settings** | CLEANED & STREAMLINED | Only Default Text Reply remains matching legacy Ripple; no extraneous Coming Soon |
| **Unimplemented Features** | COMING SOON | Clean, accessible `<ComingSoon />` states rendered |
