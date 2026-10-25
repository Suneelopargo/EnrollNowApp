# EnrollNow — Study Settings: Display and Bulk Tasks
## Complete Legacy Ripple Parity Remediation & Verification Report

### 1. Executive Summary

This report documents the functional migration, parity remediation, and comprehensive verification of **Study Settings → Display** and **Study Settings → Bulk Tasks** in the EnrollNow application (`d:\ProjectsWorkSpace\ProjectCode\EnrollnowSpace\EnrollNowApp`), matching the authoritative business rules of the legacy Ripple application (`D:\ProjectsWorkSpace\ProjectCode\EnrollnowSpace\ripple`).

Both submenus are fully functional, production-ready, styled without inline CSS, guarded by strict study-level RBAC and tenant isolation, integrated with existing Spring Boot backend APIs and PostgreSQL persistence, and verified by passing all 5 automated test and build suites:
- **Backend Study Service Tests**: 105 passed, 0 failures (`mvn test -f backend/pom.xml -pl enrollnow-study-service`)
- **Backend Participant Service Tests**: 49 passed, 0 failures (`mvn test -f backend/pom.xml -pl enrollnow-participant-service`)
- **Frontend Study MFE Tests**: 68 passed, 0 failures (`npm test --workspace=enrollnow-study-mfe --prefix frontend`)
- **Frontend Monorepo Typecheck**: 0 errors (`npm run typecheck --prefix frontend`)
- **Frontend Shell Production Build**: Succeeded in 1m 2s (`npm run build --workspace=enrollnow-shell --prefix frontend`)

---

### 2. Legacy Ripple vs. EnrollNow Functional Comparison Matrix

| Feature Area | Legacy Ripple Rule & Behavior (`ripple`) | EnrollNow Parity Implementation (`EnrollNowApp`) | Parity Status |
| :--- | :--- | :--- | :--- |
| **Display: Routing & Navigation** | Clicking `Display` in Study Settings submenu opens `display.jsx`. | Integrated into `StudySettingsWorkspace.tsx`; selecting `Display` mounts `StudySettingsDisplay.tsx`. | **Full Parity** |
| **Display: Locale Selection** | Supports 168 ISO locale codes (`both/helpers/locale.js`); stores `locale` on Study; validates with `isLocaleSupported(locale)`. | Supported locales loaded via `StudyConfigurationService.java` (`SUPPORTED_LOCALE_OPTIONS` and `VALID_LOCALE_CODES`); persisted to `enrollnow.studies.locale`. | **Full Parity** |
| **Display: Date Format Preview** | Formats deterministic sample date and shows input placeholder (e.g., `MM/DD/YYYY`, `DD/MM/YYYY`, `YYYY-MM-DD`). | Implemented in `formatLocaleSampleDate()` in `StudySettingsDisplay.tsx` using `Intl.DateTimeFormat`. | **Full Parity** |
| **Display: Browser Locale Shortcut** | Quick-select shortcut when browser language differs from selected locale. | Implemented via `navigator.language` comparison against `supportedLocales`. | **Full Parity** |
| **Display: Global Logs Controls** | Two independent flags on `Studies`: `showGlobalComments` and `defaultGlobalLogs` (`updateStudyGlobalLogSettings.js`). | Independent checkboxes in `StudySettingsDisplay.tsx` updating `showGlobalComments` and `defaultGlobalLogs` on `Study`. | **Full Parity** |
| **Display: Potential Columns** | Default 6 columns; supports adding columns, reordering, and deleting columns; blocks deletion of the last column with `"Must have at least one column for display."`. | Persisted in `StudyRequirement.configuration.displaySettings.potentialParticipantColumns`; minimum 1 column guard enforced on frontend and backend. | **Full Parity** |
| **Display: Combined Status View** | Checkbox for `statusPageCombinedView` (default `false`) stored in `StudyCustomizations`. | Checkbox in `StudySettingsDisplay.tsx` persisted in `configuration.displaySettings.statusPageCombinedView`. | **Full Parity** |
| **Display: Enrolled Columns** | Default 3 columns; checkbox for `enrolledParticipantColumnsShowEvents` (default `true`); blocks deletion of last column with `"Must have at least one column for display."`. | Persisted in `StudyRequirement.configuration.displaySettings.enrolledParticipantColumns`; minimum 1 column guard enforced on frontend and backend. | **Full Parity** |
| **Display: Custom Variables** | Custom variables configured on study appear in column dropdown with prefix `cv.` and label `(Custom Variable)`. | `StudyConfigurationService.getAvailableColumnOptionsForConfig` maps custom variables dynamically with `cId` and `(Custom Variable)` label. | **Full Parity** |
| **Bulk Tasks: Routing & Setup** | Clicking `Bulk Tasks` in Study Settings opens `bulk-tasks.jsx` with heading `Setup Bulk Tasks` and `Add Bulk Tasks Group` button. | Integrated into `StudySettingsWorkspace.tsx`; selecting `Bulk Tasks` mounts `StudySettingsBulkTasks.tsx`. | **Full Parity** |
| **Bulk Tasks: Group Management** | Modal for adding/editing group: `name` (required), `description` (optional), `triggerActive`, event selector, `"is"`, action selector (`Completed` / `Scheduled`). | Modal in `StudySettingsBulkTasks.tsx` with validation and backend persistence in `configuration.bulkTaskGroups`. | **Full Parity** |
| **Bulk Tasks: Cascading Deletion** | Deleting a Bulk Task Group deletes the group and cascades to delete all tasks belonging to that group. | `StudyConfigurationService.deleteBulkTaskGroup` removes the group and calls `bulkTasks.removeIf(t -> groupId.equals(t.bulkTaskGroupId))`. | **Full Parity** |
| **Bulk Tasks: Task Management** | Modal for adding/editing task within a group: `name` (required), `description` (optional), multi-select `assignedTo` (study team members). | Modal in `StudySettingsBulkTasks.tsx` listing study team members with checkbox selection and backend persistence in `configuration.bulkTasks`. | **Full Parity** |
| **Bulk Tasks: Task Ordering** | Tasks within a group have `rank` (0-indexed); reordering updates `rank` without altering group assignment. | Implemented via drag-and-drop and Move Up / Move Down buttons, persisting ordered IDs via `studyApi.reorderBulkTasks()`. | **Full Parity** |
| **Bulk Tasks: Configuration Scope** | Study Settings → Bulk Tasks is strictly for configuring group and task templates (does not execute participant tasks). | Retained strictly as configuration management in alignment with legacy architecture. | **Full Parity** |
| **RBAC & Authorization** | Requires study admin / leadership permission for mutations; read requires study visibility. | Enforced by `StudyService`: caller identity required, tenant isolation verified, and `STUDY_SETTINGS_MANAGE` or `canManageSiteAdmins` required. | **Full Parity** |

---

### 3. Architecture & Data Model Parity

1. **Database Schema Preservation**:
   - No historical Flyway migration files were modified.
   - Preserves `enrollnow.studies` schema (`locale`, `show_global_comments`, `default_global_logs`).
   - Utilizes `enrollnow.study_requirements.configuration` (`jsonb`) to store:
     - `displaySettings`: `{ potentialParticipantColumns, enrolledParticipantColumns, statusPageCombinedView, enrolledParticipantColumnsShowEvents }`
     - `bulkTaskGroups`: `[ { _id, studyId, name, description, triggerActive, trigger: { eventId, action } } ]`
     - `bulkTasks`: `[ { _id, studyId, bulkTaskGroupId, name, description, rank, assignedTo } ]`
2. **Study Export & Incremental Import Integration**:
   - `StudyService.exportStudy()` now includes `locale`, `showGlobalComments`, and `defaultGlobalLogs` in the exported study JSON.
   - `StudyConfigurationService.importComponentsIntoExistingStudy()` already supports incremental import of `bulkTaskGroups` and `bulkTasks`.

---

### 4. Security, RBAC & Multi-Tenant Isolation

- Every Display Settings and Bulk Tasks endpoint resolves the caller's effective tenant ID through `SiteAuthorizationService.requireTenantMatch(tenantId)`.
- Mutations (`PUT /display-settings`, `POST/PUT/DELETE /bulk-task-groups`, `POST/PUT/DELETE /bulk-tasks`, `PUT /bulk-task-groups/{id}/tasks/order`) require:
  - Caller authentication (`callerUserId != null`)
  - Either `canManageSiteAdmins == true` OR study permission containing `STUDY_SETTINGS_MANAGE` / role `STUDY_ADMIN`.
- Non-managers receive `403 FORBIDDEN` on write attempts, and read endpoints provide a read-only view (`canManage: false` banner).
- Cross-tenant requests throw `StudyNotFoundException` (`404 NOT_FOUND`), ensuring complete tenant isolation.

---

### 5. UI, Styling & Accessibility Conformance

- **Zero Inline Styles**: All visual styling is defined in `frontend/shared/design-system/styles/_study.scss` reusing existing EnrollNow design tokens (`#1b68b8`, `#dbe7f0`, `#f8fafc`).
- **Responsive Layout**: Two-column layout on desktop collapsing gracefully to a single column on tablet/mobile (`@media (max-width: 1100px)` and `@media (max-width: 480px)`).
- **Accessibility & ARIA**:
  - Semantic HTML (`<section>`, `<header>`, `<table>`, `<aside>`, `<nav>`, `<main>`)
  - Modals have `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, focus trapping, and Escape key listeners.
  - Alert banners have `role="alert"` and `role="status"`.
  - Icon buttons include descriptive `aria-label` attributes (`"Remove Column 1"`, `"Move Task Up"`, `"Close modal"`).

---

### 6. Automated Test Suite Results

| Test Suite | Command | Tests Run | Failures / Errors | Result |
| :--- | :--- | :--- | :--- | :--- |
| **Backend Study Service** | `mvn test -f backend/pom.xml -pl enrollnow-study-service` | 105 | 0 | **PASSED** |
| **Backend Participant Service** | `mvn test -f backend/pom.xml -pl enrollnow-participant-service` | 49 | 0 | **PASSED** |
| **Frontend Study MFE** | `npm test --workspace=enrollnow-study-mfe --prefix frontend` | 68 | 0 | **PASSED** |
| **Frontend TypeScript Check** | `npm run typecheck --prefix frontend` | Full Monorepo | 0 | **PASSED** |
| **Frontend Shell Build** | `npm run build --workspace=enrollnow-shell --prefix frontend` | Production Bundle | 0 | **PASSED** |

---

### 7. Implementation File Inventory

#### Backend
- `backend/enrollnow-study-service/src/main/java/com/enrollnow/study/dtos/ParticipantColumnDto.java`
- `backend/enrollnow-study-service/src/main/java/com/enrollnow/study/dtos/LocaleOptionDto.java`
- `backend/enrollnow-study-service/src/main/java/com/enrollnow/study/dtos/StudyDisplaySettingsResponse.java`
- `backend/enrollnow-study-service/src/main/java/com/enrollnow/study/dtos/UpdateStudyDisplaySettingsRequest.java`
- `backend/enrollnow-study-service/src/main/java/com/enrollnow/study/dtos/StudyBulkTasksResponse.java`
- `backend/enrollnow-study-service/src/main/java/com/enrollnow/study/dtos/SaveBulkTaskGroupRequest.java`
- `backend/enrollnow-study-service/src/main/java/com/enrollnow/study/dtos/SaveBulkTaskRequest.java`
- `backend/enrollnow-study-service/src/main/java/com/enrollnow/study/dtos/ReorderBulkTasksRequest.java`
- `backend/enrollnow-study-service/src/main/java/com/enrollnow/study/services/StudyConfigurationService.java`
- `backend/enrollnow-study-service/src/main/java/com/enrollnow/study/services/StudyService.java`
- `backend/enrollnow-study-service/src/main/java/com/enrollnow/study/controllers/StudyController.java`
- `backend/enrollnow-study-service/src/test/java/com/enrollnow/study/services/StudyConfigurationServiceTest.java`
- `backend/enrollnow-study-service/src/test/java/com/enrollnow/study/services/StudyServiceTest.java`
- `backend/enrollnow-study-service/src/test/java/com/enrollnow/study/controllers/StudyControllerTest.java`

#### Frontend
- `frontend/shared/api/studyApi.ts`
- `frontend/microfrontends/study/src/components/studySettingsDisplayBulkTasksLogic.ts`
- `frontend/microfrontends/study/src/components/StudySettingsDisplay.tsx`
- `frontend/microfrontends/study/src/components/StudySettingsBulkTasks.tsx`
- `frontend/microfrontends/study/src/components/StudySettingsWorkspace.tsx`
- `frontend/shared/design-system/styles/_study.scss`
- `frontend/microfrontends/study/src/test/studySettingsDisplayAndBulkTasks.test.tsx`
