# EnrollNow — Mock Data Cleanup, Dashboard Demo Mode, and Coming Soon Handover Report

**Date:** 2026-10-20  
**Repository Branch:** `rolesimplementation`  
**Execution Context:** System-wide mock/dummy cleanup, single Dashboard demo JSON retention, Registry preservation, and "Coming Soon" states for unimplemented functionality.

---

## 1. Executive Summary of Changes

A comprehensive, repository-wide cleanup of unintended mock, placeholder, dummy, and fabricated business data was performed across both the frontend and backend of the EnrollNow application:

1. **Single Approved Dashboard Demo JSON:**
   - Established **exactly one** approved JSON file (`frontend/microfrontends/dashboard/src/demo/dashboard-demo-data.json`) containing synthetic, de-identified clinical trial metrics strictly for Dashboard demonstration.
   - Removed all duplicate Dashboard mock datasets from TypeScript source files and test fixtures (e.g. `SAMPLE_STUDIES` in `remoteEntry.tsx` and `MOCK_DASHBOARD_OVERVIEW` in `mockData.ts`).

2. **Dedicated Dashboard Demo Mode Adapter:**
   - Implemented `frontend/microfrontends/dashboard/src/demo/dashboardDataAdapter.ts` to control data resolution.
   - Governed by `VITE_DASHBOARD_DEMO_MODE=true` (disabled by default in all production environments).
   - In Demo Mode: loads the single approved JSON file and renders a prominent, accessible "Demonstration Mode Active" badge.
   - In Live Mode: connects directly to real backend aggregation endpoints (`/api/v1/dashboard/overview`, `/api/v1/studies`, `/api/v1/participants`).
   - If an API request fails: renders an actionable error state with a retry option; **never falls back to demo data**.
   - If an API endpoint is not implemented (HTTP 501): cleanly renders the standardized "Coming Soon" component.

3. **Backend Mock Data Removal:**
   - Audited all 15 Spring Boot Maven modules.
   - In `backend/enrollnow-dashboard-service/src/main/java/com/enrollnow/dashboard/services/DashboardAggregationService.java`: removed fabricated fallback studies (`PROTO-2026-001`, etc.), artificial participant offsets (`+ 158`), and hardcoded recent activity/alerts. The service now strictly computes live aggregates from database repositories and returns genuine empty collections when no records exist.

4. **Frontend Mock Data Cleanup & Unimplemented Views:**
   - Deleted unused mock datasets (`frontend/microfrontends/administration/src/mockData.ts`).
   - Removed unused mock imports and mock role maps from `frontend/shell/src/navigation/TopNavigation.tsx`.
   - Built a reusable, accessible design-system component: `frontend/shared/design-system/components/ComingSoon.tsx`.
   - Replaced misleading fake tiles and placeholder data in `SiteAdminViews.tsx` (`StudiesView`, `ImportView`, `ExportView`, `AuditLogView`) with the professional `<ComingSoon />` component.
   - Replaced fallback dummy datasets and hardcoded stat counters in `microfrontends/communication`, `microfrontends/document`, `microfrontends/recruitment`, and `microfrontends/task` with `<ComingSoon />` states.

5. **Strict Registry Preservation:**
   - Registry UI components, filters, participant grids, backend controllers (`RegistryParticipantController`), database schema, and test suites were 100% preserved without modification.

---

## 2. Approved Dashboard Demo JSON File Path

The single designated application JSON file containing demonstration business data is:

```
frontend/microfrontends/dashboard/src/demo/dashboard-demo-data.json
```

- **Schema & Validation:** Valid JSON containing `overview`, `studies`, and `participants` collections.
- **De-identification:** All IDs (`PROTO-2026-001`, `PT-DEMO-001`), study titles, and metrics are synthetic. Contains zero credentials, tokens, secrets, or PHI/PII.
- **Uniqueness Guarantee:** No second copy exists in frontend constants or backend classes.

---

## 3. Dashboard Demo Mode Activation & Behavior

Dashboard Demo Mode is explicitly decoupled from standard API configuration:

### Configuration:
- Environment variable: `VITE_DASHBOARD_DEMO_MODE=true`
- Global/window fallback: `window.__ENROLLNOW_DASHBOARD_DEMO_MODE__ = true`
- **Default State:** `false` (Disabled by default in production and standard runtime).

### Operational State Matrix:
| State | `VITE_DASHBOARD_DEMO_MODE` | Backend Status | UI Rendering |
| :--- | :--- | :--- | :--- |
| **Demo Mode** | `true` | Bypassed | Renders `dashboard-demo-data.json` with amber "Demonstration Mode Active" banner and "Demo Data" badge. |
| **Live Implemented** | `false` | Online (200 OK) | Renders genuine metrics, charts, and table rows aggregated from database. |
| **Live Empty** | `false` | Online (0 records) | Renders legitimate empty portfolio state: "No clinical studies found. Create your first study protocol to begin tracking metrics." |
| **Unimplemented** | `false` | 501 Not Implemented | Renders accessible `<ComingSoon />` state explaining future sprint roadmap. |
| **API Failure** | `false` | Offline / 500 Error | Displays error banner with "Retry" action. **Never falls back to demo data.** |

---

## 4. Frontend Files Changed

| File Path | Description of Modification |
| :--- | :--- |
| `frontend/microfrontends/dashboard/src/demo/dashboard-demo-data.json` | **Created.** Sole authorized JSON demonstration dataset. |
| `frontend/microfrontends/dashboard/src/demo/dashboardDataAdapter.ts` | **Created.** Centralized adapter enforcing demo mode toggling, API queries, error isolation, and 501 handling. |
| `frontend/microfrontends/dashboard/src/test/dashboardDataAdapter.test.ts` | **Created.** 7 Vitest unit tests covering adapter logic, demo mode flag, live API flow, error isolation, and 501 handling. |
| `frontend/microfrontends/dashboard/src/remoteEntry.tsx` | Removed `SAMPLE_STUDIES` constant and fallback; integrated `loadDashboardData`, `ComingSoon`, and Demo Mode banner. |
| `frontend/shared/design-system/components/ComingSoon.tsx` | **Created.** Reusable, accessible, design-system compliant "Coming Soon" component. |
| `frontend/shared/design-system/components/index.ts` | Exported `ComingSoon` component from shared design system. |
| `frontend/shared/design-system.test.ts` | Added unit tests verifying `ComingSoon` component rendering, accessibility attributes, and styling. |
| `frontend/shell/src/navigation/TopNavigation.tsx` | Removed unused `MOCK_STUDIES` import and `MOCK_STUDY_ROLE_ACCESS` constant. |
| `frontend/microfrontends/administration/src/mockData.ts` | **Deleted.** Removed obsolete, unused site admin mock users, studies, and roles. |
| `frontend/microfrontends/administration/src/components/SiteAdminViews.tsx` | Replaced fake tiles in `StudiesView`, `ImportView`, `ExportView`, and `AuditLogView` with `<ComingSoon />`. |
| `frontend/microfrontends/administration/src/test/siteSettingsViews.test.ts` | Added assertions verifying that unimplemented views render `<ComingSoon />`. |
| `frontend/microfrontends/communication/src/remoteEntry.tsx` | Replaced 4 fake fallback messages and hardcoded stat cards with `<ComingSoon />`. |
| `frontend/microfrontends/document/src/remoteEntry.tsx` | Replaced 4 fake fallback documents and hardcoded storage metrics with `<ComingSoon />`. |
| `frontend/microfrontends/recruitment/src/remoteEntry.tsx` | Replaced 4 fake fallback campaigns and hardcoded conversion numbers with `<ComingSoon />`. |
| `frontend/microfrontends/task/src/remoteEntry.tsx` | Replaced 4 fake fallback tasks and hardcoded priority counters with `<ComingSoon />`. |
| `frontend/shared/mock-api/mockData.ts` | Deleted `MOCK_DASHBOARD_OVERVIEW` to prevent duplicate mock dashboard sources. |
| `frontend/shared/mock-api/mockStore.ts` | Updated `getDashboardOverview()` to reference `dashboard-demo-data.json`. |

---

## 5. Backend Files Changed

| File Path | Description of Modification |
| :--- | :--- |
| `backend/enrollnow-dashboard-service/src/main/java/com/enrollnow/dashboard/services/DashboardAggregationService.java` | Removed hardcoded fallback studies (`PROTO-2026-001`, `EN-CARD-2026`, etc.), removed artificial `+ 158` participant padding, removed hardcoded alerts and activity. Computes purely from `studyRepository` or returns clean empty aggregates. |
| `backend/enrollnow-dashboard-service/src/test/java/com/enrollnow/dashboard/services/DashboardAggregationServiceTest.java` | Updated test assertions to verify genuine empty overview when database is empty (no fake studies generated). |

---

## 6. APIs Verified as Database-Backed

The following endpoints operate against genuine database tables and Flyway migrations:

1. **Authentication & Identity (`enrollnow-identity-service`):**
   - `POST /api/v1/tenants/{tenantId}/auth/login` (Argon2id password hashing, active site permission lookup).
   - `POST /api/v1/tenants/{tenantId}/auth/logout`.
   - `GET /api/v1/tenants/{tenantId}/auth/me`.
   - `POST /api/v1/tenants/{tenantId}/auth/forgot-password` & `POST /api/v1/tenants/{tenantId}/auth/reset-password`.
2. **User Management & Role Permissions (`enrollnow-identity-service` & `enrollnow-app`):**
   - `GET /api/v1/tenants/{tenantId}/users` (reads from `users` and `user_role_assignments`).
   - `POST /api/v1/tenants/{tenantId}/users` (creates user and role assignment).
   - `PUT /api/v1/tenants/{tenantId}/users/{userId}/status`.
   - `PUT /api/v1/tenants/{tenantId}/users/{userId}/roles`.
   - `GET /api/v1/roles` (reads persisted RBAC roles from `roles`).
3. **Site Security Policy (`US-065`):**
   - `GET /api/v1/tenants/{tenantId}/settings/security` (reads from `site_security_settings`).
   - `PUT /api/v1/tenants/{tenantId}/settings/security` (persists policy changes).
   - `POST /api/v1/tenants/{tenantId}/settings/security/reset` (resets to default policy).
4. **General Site Settings (`US-084`):**
   - `GET /api/v1/tenants/{tenantId}/settings/general` (reads from `general_site_settings`).
   - `PUT /api/v1/tenants/{tenantId}/settings/general` (persists default SMS auto-reply).
5. **Study Management (`enrollnow-study-service`):**
   - `GET /api/v1/studies` (reads studies from `studies`).
   - `POST /api/v1/studies` (persists new clinical study).
   - `GET /api/v1/tenants/{tenantId}/users/{userId}/studies` (reads study-level user assignments).
6. **Executive Dashboard (`enrollnow-dashboard-service`):**
   - `GET /api/v1/dashboard/overview` (aggregates actual studies from `StudyRepository`).
7. **Participant Registry (`enrollnow-app`):**
   - `GET /api/v1/participants` & `GET /api/v1/participants/{id}` (reads from `registry_participants`).

---

## 7. APIs that Remain Unimplemented

The following functional areas currently lack dedicated Spring Boot REST controllers:

1. **Participant Outreach Hub:**
   - `GET /api/v1/communications`, `POST /api/v1/communications/send` (schema exists in `V13__communications.sql`, but no REST controller).
2. **eTMF Document Vault:**
   - `GET /api/v1/documents`, `POST /api/v1/documents/upload` (schema exists in `V14__documents.sql`, but no REST controller).
3. **Recruitment Campaign Tracking:**
   - `GET /api/v1/recruitment/campaigns` (planned for Sprint 2).
4. **Clinical Operations Tasks:**
   - `GET /api/v1/tasks` (planned for Sprint 2).
5. **Batch Import & Export Pipelines:**
   - `POST /api/v1/admin/import`, `GET /api/v1/admin/exports` (planned for Sprint 3).
6. **System Audit Ledger UI:**
   - `GET /api/v1/admin/audit-logs` (event listener exists in `enrollnow-audit-service`, but query API is scheduled for Sprint 3).

---

## 8. Screens Changed to "Coming Soon"

The following views have been updated to render `<ComingSoon />` instead of fake static cards or simulated action buttons:

1. **Administration Workspace (`microfrontends/administration`):**
   - **Site Studies Tab (`StudiesView`):** Explains that site-study allocation workflows are scheduled for an upcoming sprint, and redirects users to the live Studies tab in top navigation.
   - **Data Intake Tab (`ImportView`):** Informs users that CSV/Excel batch onboarding is in development; avoids fake "Download CSV" buttons.
   - **Export Tab (`ExportView`):** Informs users that scheduled delivery and PHI de-identification filters are in development; avoids fake "3 archives ready" notices.
   - **Audit Ledger Tab (`AuditLogView`):** Informs users that 21 CFR Part 11 audit aggregation is in development; avoids fake audit records.
2. **Communications Workspace (`microfrontends/communication`):**
   - Informs users that multi-channel messaging is in development; avoids fake delivered SMS/Email records.
3. **Document Workspace (`microfrontends/document`):**
   - Informs users that electronic master file storage is in development; avoids fake PDF document entries and fake storage metrics.
4. **Recruitment Workspace (`microfrontends/recruitment`):**
   - Informs users that campaign funnel tracking is in development; avoids fake lead numbers.
5. **Tasks Workspace (`microfrontends/task`):**
   - Informs users that coordinator action queues are in development; avoids fake urgent task records.

---

## 9. Confirmation of Registry Protection

In strict adherence to the **Critical Preservation Rule**, Registry functionality was safeguarded:

- **Registry UI & Navigation:** No changes were made to `microfrontends/participant/src/components/RegistryDashboard.tsx`, `FilterCard.tsx`, or registry navigation paths.
- **Backend Registry Endpoints:** `RegistryParticipantController.java` remains untouched, serving live registry participant data.
- **Database Schema:** `registry_participants` table and related foreign keys/indexes remain untouched.
- **No Mock Fallbacks:** Registry was not redirected to `dashboard-demo-data.json` or marked as Coming Soon.
- **Automated Verification:** `RegistryParticipantControllerTest` and `participant.test.ts` were executed and passed with 100% success.

---

## 10. Database and Migration Impact

- **Zero Destructive Migrations:** No migrations were added, dropped, or modified for this cleanup.
- **Data Integrity:** No records were deleted from PostgreSQL.
- **Catalog Verification:** Flyway migrations (`V5`, `V6`, `V7`, `V18`, `V19`) were verified to contain solely master reference catalogs (roles, permissions, default settings), with zero dummy clinical study or patient data.

---

## 11. Tests Executed and Actual Results

### Frontend Test Results (`Vitest` across 12 Workspaces):
- **Command:** `npm --prefix frontend test`
- **Output:** **All 12 workspaces passed 100%.**
  - `@enrollnow/shared`: 12 test files, 102 tests passed.
  - `enrollnow-administration-mfe`: 2 test files, 19 tests passed (including new `ComingSoon` view tests).
  - `enrollnow-dashboard-mfe`: 2 test files, 9 tests passed (including 7 new `dashboardDataAdapter` tests).
  - `enrollnow-identity-mfe`: 1 test file, 9 tests passed.
  - `enrollnow-organization-mfe`: 1 test file, 2 tests passed.
  - `@enrollnow/mfe-participant`: 1 test file, 2 tests passed.
  - `@enrollnow/mfe-study`: 1 test file, 2 tests passed.
  - `@enrollnow/mfe-survey`: 1 test file, 5 tests passed.
  - `@enrollnow/mfe-communication`: 1 test file, 2 tests passed.
  - `@enrollnow/mfe-document`: 1 test file, 2 tests passed.
  - `@enrollnow/mfe-recruitment`: 1 test file, 2 tests passed.
  - `@enrollnow/mfe-task`: 1 test file, 2 tests passed.
  - `enrollnow-shell`: 2 test files, 18 tests passed.
- **Total Frontend Tests:** **176 tests passed, 0 failed.**

### Frontend Typecheck:
- **Command:** `npm --prefix frontend run typecheck`
- **Result:** **Clean pass with 0 errors across all workspaces.**

### Backend Test Results (`Maven Surefire` across 15 Modules):
- **Command:** `mvn test -f backend/pom.xml`
- **Output:** **BUILD SUCCESS across all 15 modules.**
  - `enrollnow-common`: 5 tests passed.
  - `enrollnow-identity-service`: 29 tests passed.
  - `enrollnow-study-service`: 22 tests passed.
  - `enrollnow-dashboard-service`: 3 tests passed.
  - `enrollnow-app`: 3 tests passed (including `RegistryParticipantControllerTest`).
- **Total Backend Tests:** **62 tests passed, 0 failed.**

---

## 12. Remaining Gaps and Risks

1. **Sprint 2 Roadmap Microfrontends:**
   - Communications, Documents, Tasks, and Recruitment now cleanly display `<ComingSoon />`. Backend teams will need to deliver the corresponding controllers and repositories when these stories enter sprint execution.
2. **Dashboard Real Mode with Empty Database:**
   - When running against a fresh database with 0 studies, the Dashboard now correctly renders empty charts and an invitation to create the first study protocol. Once studies are added via `/studies`, the Dashboard metrics will dynamically reflect them.
3. **Offline Development in Mock Mode:**
   - The test mock layer in `shared/mock-api/` is retained strictly for local frontend unit testing (`VITE_API_MODE=mock`). It is inactive in production and standard runtime (`getApiMode()` defaults to `'real'`).

---

## 13. Instructions for the Next Registry Development Phase

When the upcoming development phase addresses the Registry module:
1. **Preserve Current Component Contracts:**
   - `RegistryDashboard.tsx` is located at `frontend/microfrontends/participant/src/components/RegistryDashboard.tsx`.
   - Maintain its integration with `GET /api/v1/participants` and `GET /api/v1/participants/{id}`.
2. **Connecting Custom Form Fields:**
   - The participant form builder can consume the standard field types already modeled in `filterFieldOptions` and `operatorOptions`.
3. **Database Constraints:**
   - Table `registry_participants` has tenant isolation (`tenant_id`) and unique constraint `uk_registry_participants_tenant_record_id`. Do not remove tenant scoping in future queries.

---

## 14. Repository-Wide Mock Data Search Results & Exclusions

A repository-wide search was executed scanning all `.java`, `.ts`, `.tsx`, and `.json` files for keywords `MOCK_`, `SAMPLE_`, and `DUMMY_`.

### Exact Findings & Audit Classification:

| Category | Finding Location | Excluded / Retained Reason |
| :--- | :--- | :--- |
| **Legitimate DB Column** | `backend/.../Study.java:61` (`sample_size`) | Real database entity column representing clinical study sample size. Not mock data. |
| **Legitimate DB Column** | `backend/.../StudyRequirement.java:22` (`sample_size`) | Real database entity column representing protocol sample size requirement. Not mock data. |
| **Sole Approved Demo Data** | `frontend/microfrontends/dashboard/src/demo/dashboard-demo-data.json` | Explicitly authorized single JSON demonstration dataset for Dashboard showcase. |
| **Test Fixtures & Simulation** | `frontend/shared/api-config.ts` (`VITE_API_MOCK_ERROR`) | Configuration flag allowing Vitest unit tests to simulate HTTP 500/503/network disconnection. |
| **Test Fixtures & Simulation** | `frontend/shared/mock-api/mockAdapter.ts` | Test adapter utilized by automated Vitest tests when verifying interceptors and error handling. |
| **Offline Test Store** | `frontend/shared/mock-api/mockStore.ts` & `mockData.ts` | In-memory store utilized exclusively by `mock-api.test.ts`. All dashboard mock data was excised and unified into the single approved JSON file. |
| **Automated Unit Tests** | `frontend/shared/mock-api.test.ts` | Vitest unit test suite testing error codes and session expiration under simulated conditions. |

**Audit Conclusion:** Zero unauthorized mock business records remain in production components, runtime controllers, or database migrations. All in-scope functionality is either database-backed or cleanly presented as Coming Soon.
