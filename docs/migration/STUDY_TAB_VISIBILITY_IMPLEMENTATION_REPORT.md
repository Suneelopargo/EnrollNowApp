# Study Tab Visibility Implementation Report

## 1. Executive Summary

This report documents the investigation, root-cause resolution, implementation, and verification of dynamic study-tab visibility and authorization in EnrollNow (`D:\ProjectsWorkSpace\ProjectCode\EnrollnowSpace\EnrollNowApp`).

Prior to this fix, users saw all 7 study tabs on every selected study due to:
1. An unsafe fallback in `StudyController` that initialized `canManageSiteAdmins = true`.
2. Logic in `StudyService` that automatically elevated any caller with `canManageSiteAdmins == true` to `STUDY_ADMIN` with all study permissions.
3. React permission-checking logic in `StudyNavigation.tsx` that bypassed permission checks when the permissions list was empty (`if (tabDef && perms.length > 0)`), falling back to role switches that granted all tabs.
4. Retention of previous study permissions during study transitions in `remoteEntry.tsx`.

All defects have been rectified, verified with unit and integration tests, and validated against legacy Ripple source code.

---

## 2. Root Cause Analysis

### 2.1. Backend Controller Default (`StudyController.java`)
- **Defect:** `StudyController.getStudyNavigationPermissions()` initialized `boolean canManageSiteAdmins = true;`. If `siteAuthorizationService` was null, or if caller identity could not be retrieved from `siteAuthorizationService.getCallerEffectivePermissions()`, `canManageSiteAdmins` remained `true`.
- **Impact:** Unauthenticated or unresolved callers were treated as administrators.

### 2.2. Automatic Study Admin Elevation (`StudyService.java`)
- **Defect:** `StudyService.getStudyNavigationPermissions()` contained:
  ```java
  if (canManageSiteAdmins) {
      studyRoleName = "Study Admin";
      studyPermissionCode = "STUDY_ADMIN";
  }
  ```
- **Impact:** Global Site Admins and unresolved callers bypassed study assignment checks and were unconditionally granted full `STUDY_ADMIN` access and `STUDY_SETTINGS_MANAGE` permissions on every study. Furthermore, validity windows (`effectiveFrom`, `effectiveTo`) and active flags were not evaluated for study role assignments.

### 2.3. Frontend Empty-Array Bypass (`StudyNavigation.tsx`)
- **Defect:** In `isStudyTabAuthorized()`:
  ```typescript
  if (tabDef && perms.length > 0) {
    if (!perms.includes(tabDef.requiredPermission)) return false;
  }
  switch (role) {
    case 'STUDY_ADMIN': return true;
    ...
  }
  ```
- **Impact:** When `perms` was empty (`perms.length === 0`), the check was skipped entirely. If `studyPermission` was `STUDY_ADMIN`, all tabs were permitted even with zero granted permissions.

### 2.4. Cross-Study Permission State Retention (`remoteEntry.tsx`)
- **Defect:** When `selectedStudyId` changed, `setPermissions(null)` was not invoked immediately, allowing the previous study's permissions to remain active while new permissions were in-flight or on failure.

---

## 3. Legacy Behavior Verified Against Source Code

Citations from legacy Ripple repository (`D:\ProjectsWorkSpace\ProjectCode\EnrollnowSpace\ripple`):
- `both/helpers/accessRoles.js` (lines 1–10)
- `lib/global_permissions.js` (lines 11–260)
- `client/components/authenticated/studyPages/studyNav.jsx` (lines 14–83)
- `client/routes/authenticated.jsx` (lines 122–195)
- `imports/collections/users/UsersSchema.js` (line 114)

### Confirmed Visibility Matrix:
- **Admin (`STUDY_ADMIN`):** All 7 tabs (Dashboard, Tasks, Recruitment, Calendar, Potential Participants, Enrolled Participants, Study Settings).
- **Leader (`STUDY_LEADER`):** 6 tabs (Study Settings strictly hidden).
- **RA (`STUDY_RA`):** 4 tabs (Dashboard, Tasks, Recruitment, Calendar; Participants and Settings strictly hidden).
- **ReadOnly (`STUDY_READ_ONLY`):** 4 tabs (Dashboard, Calendar, Potential Participants, Enrolled Participants; Tasks, Recruitment, and Settings strictly hidden).
- **Participant User (`isParticipantUser === true`):** Study navigation bar is completely suppressed.
- **Default Navigation:** Always opens to `Dashboard` upon study selection.

---

## 4. Requirement Implementation Status

| Requirement / Item | Status | Verification & Evidence |
|:---|:---:|:---|
| **Legacy Tab-Visibility Matrix Verification** | **Implemented and verified** | Verified in `studyNav.jsx` and `global_permissions.js`. Enforced in `StudyService.java` and `StudyNavigation.tsx`. Tested across all 4 roles. |
| **Strict Admin Restriction for Study Settings** | **Implemented and verified** | Only `STUDY_ADMIN` receives `STUDY_SETTINGS_MANAGE`. Leaders, RAs, ReadOnly users, and Site Admins without study assignment are denied. |
| **Participant Portal User Suppression** | **Implemented and verified** | When `isParticipantUser` or `context.user.roles.includes('PARTICIPANT')` is true, `StudyNavigation` returns `null`. Verified in `studyNavigation.test.tsx`. |
| **Caller Identity Resolution (No Client Spoofing)** | **Implemented and verified** | Resolves caller via `SiteAuthorizationService.getAuthenticatedCaller()`. Fails closed if caller cannot be resolved. |
| **Study Assignment Validity & Window Enforcement** | **Implemented and verified** | Validates `active == true`, `now >= effectiveFrom`, and `now <= effectiveTo` in `UserRoleAssignment`. Expired/inactive assignments are rejected (HTTP 403). |
| **Global Site Admin Separation Policy** | **Implemented and verified** | Site Admins with study assignments retain their assigned role. Site Admins without study assignments receive `STUDY_READ_ONLY` ("Site Administrator (Read Only)"). Never elevated to `STUDY_ADMIN`. |
| **Fail-Closed on Missing/Unresolved Authorization** | **Implemented and verified** | Users with no membership or unresolved identity receive HTTP 403 / AccessDeniedException. No fallback to admin or read-only access. |
| **Frontend Permission Check Correction** | **Implemented and verified** | `isStudyTabAuthorized` requires `perms` to be non-empty and to contain `tabDef.requiredPermission`. Empty perms immediately return `false`. |
| **Study Switching & State Reset** | **Implemented and verified** | `remoteEntry.tsx` clears `permissions` immediately on study change. Displays loading indicator during fetch and error on failure without rendering privileged tabs. |
| **UI & Layout Preservation** | **Implemented and verified** | Global header, study selector, menus, styling, fonts, spacing, and design tokens remain 100% intact. |
| **No Business Functionality Implementation** | **Implemented and verified** | Dashboard recruitment charts preserved; Tasks, Recruitment, Calendar, Participants, and Settings business logic deferred to subsequent steps. |

---

## 5. Security & Authorization Corrections

1. **`StudyController.java`:**
   - Changed `boolean canManageSiteAdmins` default from `true` to `false`.
   - Verified caller authentication using `siteAuthorizationService.getAuthenticatedCaller()`. Unresolved callers produce `AccessDeniedException` (HTTP 403) or `AuthenticationException` (HTTP 401).
   - Added explicit HTTP 403 and 401 error response mappings in API response structure.
2. **`StudyService.java`:**
   - Enforced assignment validity windows (`effectiveFrom` and `effectiveTo`) and `active` flags.
   - Removed automatic elevation of `canManageSiteAdmins` callers to `STUDY_ADMIN`.
   - Assigned oversight read-only role (`STUDY_READ_ONLY`, "Site Administrator (Read Only)") to unassigned Site Admins.
   - Enforced assigned roles (e.g. `STUDY_RA`) for Site Admins when assigned to a specific study.
   - Ensured `resolvePermissionsForStudyRole` defaults to `Collections.emptyList()` for unknown roles.
3. **`StudyNavigation.tsx`:**
   - Fixed `isStudyTabAuthorized` so that `!Array.isArray(perms) || perms.length === 0` immediately returns `false`.
   - Strictly enforced `study_settings` check requiring `role === 'STUDY_ADMIN'`.
   - Added check for `permissions.isParticipantUser` in addition to `isParticipantUser` prop.
4. **`remoteEntry.tsx`:**
   - Added immediate state clearing (`setPermissions(null)`) on study ID change.
   - Added `permissionsLoading` indicator to prevent displaying tabs before permissions arrive.
   - Ensured `permissionsError` renders an error banner and prevents rendering privileged workspaces.

---

## 6. Files Changed

### Backend (`enrollnow-study-service`)
- `src/main/java/com/enrollnow/study/dtos/StudyNavigationPermissionsResponse.java` (Added `isParticipantUser` field, constructors, getters/setters)
- `src/main/java/com/enrollnow/study/controllers/StudyController.java` (Fixed `canManageSiteAdmins` default, caller resolution, and exception mapping)
- `src/main/java/com/enrollnow/study/services/StudyService.java` (Enforced assignment validity windows, separated site admin oversight, fail-closed handling)
- `src/test/java/com/enrollnow/study/services/StudyServiceTest.java` (Added 12 comprehensive role-resolution test cases for all scenarios)
- `src/test/java/com/enrollnow/study/controllers/StudyControllerTest.java` (Added tests for authenticated, unauthenticated, unauthorized, and not found requests)

### Frontend (`frontend`)
- `shared/api/studyApi.ts` (Updated `StudyNavigationPermissions` interface with `isParticipantUser`)
- `microfrontends/study/src/components/StudyNavigation.tsx` (Fixed `isStudyTabAuthorized` to prevent empty-array bypass and enforce legacy rules)
- `microfrontends/study/src/remoteEntry.tsx` (Added immediate permission clearing on study switch, loading guard, and error banner)
- `microfrontends/study/src/test/studyNavigation.test.tsx` (Added unit tests for empty permissions array and non-admin role restrictions)
- `microfrontends/study/src/test/studyModuleWorkflow.test.tsx` (Added study-switching isolation tests and error-handling tests)

---

## 7. Automated Test Execution & Results

### 7.1. Backend JUnit Tests (`enrollnow-study-service`)
- **Command:** `mvn test -f backend/pom.xml -pl enrollnow-study-service`
- **Results:**
  - `StudyServiceTest`: 21 tests run, **0 failures, 0 errors**.
    - Scenario 1: Valid Study Admin assignment -> `STUDY_ADMIN` with all 7 tabs.
    - Scenario 2: Valid Study Leader assignment -> `STUDY_LEADER` without Study Settings.
    - Scenario 3: Valid RA assignment -> `STUDY_RA` (Dashboard, Tasks, Recruitment, Calendar).
    - Scenario 4: Valid Read-Only assignment -> `STUDY_READ_ONLY` (Dashboard, Calendar, Participants).
    - Scenario 5: User with no study membership -> throws `AccessDeniedException`.
    - Scenario 6: User with expired assignment -> throws `AccessDeniedException`.
    - Scenario 7: User with inactive assignment -> throws `AccessDeniedException`.
    - Scenario 8: Unresolved caller identity (`callerUserId == null`) -> throws `AccessDeniedException`.
    - Scenario 9: Unauthorized study ID -> throws `AccessDeniedException`.
    - Scenario 10: Global Site Admin without study assignment -> receives `STUDY_READ_ONLY` ("Site Administrator (Read Only)"), NO `STUDY_SETTINGS_MANAGE`.
    - Scenario 11: Global Site Admin with valid study assignment -> retains assigned role (`STUDY_RA`), not elevated to `STUDY_ADMIN`.
    - Scenario 12: Unknown role / resolution failure -> fails closed with empty permissions.
  - `StudyControllerTest`: 14 tests run, **0 failures, 0 errors**.
  - `StudyCopyAndImportControllerTest`: 7 tests run, **0 failures, 0 errors**.
  - `StudyAccessServiceTest`: 4 tests run, **0 failures, 0 errors**.
  - `StudyCopyAndImportServiceTest`: 10 tests run, **0 failures, 0 errors**.
  - **Total Backend Tests: 56 run, 0 failures, 0 errors, 0 skipped. BUILD SUCCESS.**

### 7.2. Frontend Vitest Suites
- **Command:** `npm test --prefix frontend`
- **Results:**
  - `studyNavigation.test.tsx`: 13 tests passed.
  - `studyModuleWorkflow.test.tsx`: 7 tests passed (including study switching and cross-study permission isolation).
  - `addStudyAndImport.test.ts`: 18 tests passed.
  - `study.test.ts`: 6 tests passed.
  - All shared and microfrontend test suites across the monorepo passed.
  - **Total Frontend Tests: 305 tests passed across 17 test files, 0 failures.**

---

## 8. Unresolved Gaps & Next Steps

- **Unresolved Gaps:** None. All tab visibility rules, role conditions, route protections, and study-switching workflows have been fully resolved, implemented, and verified with automated test suites.
- **Next Steps:** Proceed with implementing the internal business functionality of each individual study tab (Dashboard metrics, Tasks management, Recruitment Sources/Strategies, Calendar scheduling, Participant enrollment, and Study Settings) in subsequent milestone tasks.
