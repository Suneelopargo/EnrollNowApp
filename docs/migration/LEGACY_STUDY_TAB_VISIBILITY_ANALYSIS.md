# Legacy Ripple Study Tab Visibility Analysis

## 1. Executive Summary

This document analyzes the study-level navigation and tab visibility rules in the legacy Ripple application (`D:\ProjectsWorkSpace\ProjectCode\EnrollnowSpace\ripple`) and outlines their migration and mapping into the modern EnrollNow microservices/microfrontend architecture (`D:\ProjectsWorkSpace\ProjectCode\EnrollnowSpace\EnrollNowApp`).

The objective of this phase is strictly scoped to **top-level study tab visibility, dynamic authorization, and tab navigation upon selecting a study**. Business functionality inside individual tabs (e.g., metric charts, task grids, participant lists, calendar events, study settings) is preserved or stubbed as placeholders for subsequent implementation phases.

---

## 2. Legacy Ripple Tab Inventory

In legacy Ripple, once a user selects a study, the secondary navigation bar (`StudyNav`) renders the study tabs.

The complete legacy tab inventory comprises **7 top-level tabs** and **1 sub-menu dropdown**:

| # | Tab Display Name | Route Name | Sub-navigation Items | Default Route |
|---|------------------|------------|----------------------|---------------|
| 1 | **Dashboard** | `dashboard` | None | **Yes** (Selected upon study entry) |
| 2 | **Tasks** | `tasks` | Filter views (`All Tasks`, `Recruitment`, `Participant`, `Misc.`) | No |
| 3 | **Recruitment** | `recruitment` | Dropdown: `Sources` (`recruitmentSources`), `Strategies` (`recruitmentStrategies`) | No |
| 4 | **Calendar** | `calendar` | Calendar views | No |
| 5 | **Potential Participants** | `potential_participants` | None | No |
| 6 | **Enrolled Participants** | `enrolled_participants` | None | No |
| 7 | **Study Settings** | `study_settings` | None | No |

---

## 3. Verified Legacy Tab Visibility Rules & Source Code Citations

All visibility rules were verified directly in the legacy Ripple codebase. The primary source files governing study tab visibility and study routing are:
- `ripple/client/components/authenticated/studyPages/studyNav.jsx`
- `ripple/client/routes/authenticated.jsx`

### 3.1. Master Visibility Matrix

| Study Role | Dashboard | Tasks | Recruitment (Sources / Strategies) | Calendar | Potential Participants | Enrolled Participants | Study Settings |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Admin** | Visible | Visible | Visible | Visible | Visible | Visible | Visible |
| **Leader** | Visible | Visible | Visible | Visible | Visible | Visible | Hidden |
| **RA** (Research Assistant) | Visible | Visible | Visible | Visible | Hidden | Hidden | Hidden |
| **ReadOnly** | Visible | Hidden | Hidden | Visible | Visible | Visible | Hidden |
| **Participant User** (`isParticipantUser`) | Hidden (Nav Hidden) | Hidden (Nav Hidden) | Hidden (Nav Hidden) | Hidden (Nav Hidden) | Hidden (Nav Hidden) | Hidden (Nav Hidden) | Hidden (Nav Hidden) |

### 3.2. Detailed Evidence by Tab

#### 1. Participant User Suppression
- **Source Citation:** `ripple/client/components/authenticated/studyPages/studyNav.jsx` lines 14–16:
  ```jsx
  if (isParticipantUser) {
    return null;
  }
  ```
- **Rule:** If the user is flagged as a participant user (`isParticipantUser === true`), the entire study navigation bar is not rendered.

#### 2. Dashboard
- **Source Citation:** `ripple/client/components/authenticated/studyPages/studyNav.jsx` lines 18–25:
  ```jsx
  <li role="presentation" className={activeTab === 'dashboard' ? 'active' : ''}>
    <a href={FlowRouter.path('dashboard', { studyId })}>
      <FormattedMessage id="studyNav.dashboard" defaultMessage="Dashboard" />
    </a>
  </li>
  ```
- **Rule:** Unconditional for all study staff roles (`Admin`, `Leader`, `RA`, `ReadOnly`). Always rendered when `studyNav` is displayed.
- **Default Tab:** When selecting a study, legacy Ripple redirects to `dashboard` via `FlowRouter.go('dashboard', { studyId: selectedStudyId })` (`ripple/client/components/authenticated/header/studySelector.jsx`).

#### 3. Tasks & Recruitment
- **Source Citation:** `ripple/client/components/authenticated/studyPages/studyNav.jsx` lines 27–47:
  ```jsx
  {!role.isReadOnly && (
    <li role="presentation" className={activeTab === 'tasks' ? 'active' : ''}>
      <a href={FlowRouter.path('tasks', { studyId })}>
        <FormattedMessage id="studyNav.tasks" defaultMessage="Tasks" />
      </a>
    </li>
  )}
  {!role.isReadOnly && (
    <li role="presentation" className={`dropdown ${activeTab === 'recruitment' ? 'active' : ''}`}>
      <a className="dropdown-toggle" data-toggle="dropdown" href="#" role="button" aria-haspopup="true" aria-expanded="false">
        <FormattedMessage id="studyNav.recruitment" defaultMessage="Recruitment" /> <span className="caret"></span>
      </a>
      <ul className="dropdown-menu">
        <li><a href={FlowRouter.path('recruitmentSources', { studyId })}>Sources</a></li>
        <li><a href={FlowRouter.path('recruitmentStrategies', { studyId })}>Strategies</a></li>
      </ul>
    </li>
  )}
  ```
- **Rule:** Visible to `Admin`, `Leader`, and `RA`. Hidden for `ReadOnly` (`!role.isReadOnly`). Recruitment provides a dropdown navigation to `Sources` and `Strategies`.

#### 4. Calendar
- **Source Citation:** `ripple/client/components/authenticated/studyPages/studyNav.jsx` lines 49–55:
  ```jsx
  <li role="presentation" className={activeTab === 'calendar' ? 'active' : ''}>
    <a href={FlowRouter.path('calendar', { studyId })}>
      <FormattedMessage id="studyNav.calendar" defaultMessage="Calendar" />
    </a>
  </li>
  ```
- **Rule:** Unconditional for all study staff roles (`Admin`, `Leader`, `RA`, `ReadOnly`). Always visible.

#### 5. Potential Participants & Enrolled Participants
- **Source Citation:** `ripple/client/components/authenticated/studyPages/studyNav.jsx` lines 57–74:
  ```jsx
  {!role.isRA && (
    <li role="presentation" className={activeTab === 'potential_participants' ? 'active' : ''}>
      <a href={FlowRouter.path('potential_participants', { studyId })}>
        <FormattedMessage id="studyNav.potentialParticipants" defaultMessage="Potential Participants" />
      </a>
    </li>
  )}
  {!role.isRA && (
    <li role="presentation" className={activeTab === 'enrolled_participants' ? 'active' : ''}>
      <a href={FlowRouter.path('enrolled_participants', { studyId })}>
        <FormattedMessage id="studyNav.enrolledParticipants" defaultMessage="Enrolled Participants" />
      </a>
    </li>
  )}
  ```
- **Rule:** Hidden for `RA` (`!role.isRA`). Visible to `Admin`, `Leader`, and `ReadOnly`. This protects PHI and participant management from research assistants who only manage assigned tasks or recruitment.

#### 6. Study Settings
- **Source Citation:** `ripple/client/components/authenticated/studyPages/studyNav.jsx` lines 76–83:
  ```jsx
  {role.isAdmin && (
    <li role="presentation" className={activeTab === 'study_settings' ? 'active' : ''}>
      <a href={FlowRouter.path('study_settings', { studyId })}>
        <FormattedMessage id="studyNav.studySettings" defaultMessage="Study Settings" />
      </a>
    </li>
  )}
  ```
- **Rule:** Visible strictly to `Admin` (`role.isAdmin`). Hidden for `Leader`, `RA`, and `ReadOnly`.

#### 7. Route Guards & Unauthorized Access
- **Source Citation:** `ripple/client/routes/authenticated.jsx` lines 122–195:
  - Routes perform role verification in `triggersEnter`:
  - If a user directly enters a URL for a tab they do not have role access to (e.g., an RA navigating to `/study/:studyId/potential_participants`), the route guard redirects back to `dashboard` with an access alert or stops execution.

---

## 4. Current EnrollNow Architecture Comparison

| Dimension | Legacy Ripple | Modern EnrollNow |
|---|---|---|
| **Frontend Framework** | Meteor.js + React 15/16 + FlowRouter | React 18 + Module Federation (Webpack 5) + React Router |
| **Backend Architecture** | Meteor Node.js DDP / MongoDB | Spring Boot Microservices + PostgreSQL |
| **Auth & Identity** | Meteor Accounts (`Meteor.user()`, `Meteor.roles`) | Keycloak / JWT Bearer Tokens + OpenID Connect |
| **RBAC Catalog** | Study-level role strings: `Admin`, `Leader`, `RA`, `ReadOnly` | Fine-grained PostgreSQL RBAC permissions assigned to roles: `STUDY_ADMIN`, `STUDY_LEADER`, `STUDY_RA`, `STUDY_READ_ONLY` |
| **Shell & Header** | Monolithic Meteor template with header dropdown | Microfrontend Shell (`shell-app`) with unbranded TopNavigation, StudySelector, and UserMenu |
| **Study Workspace** | FlowRouter Blaze/React layout | `study-mfe` loaded into Shell's `/studies/:studyId` route |

---

## 5. RBAC Permission Mapping Matrix

In EnrollNow's PostgreSQL schema (`database/completeworkingcopy.sql`), permissions are defined in `enrollnow.permissions` and linked to study roles in `enrollnow.role_permissions`.

The database catalog matches the legacy access division:

| Navigation Tab | Required Permission Code | Granted Roles in EnrollNow DB | Legacy Ripple Equivalent Role Check |
|---|---|---|---|
| **Dashboard** | `STUDY_DASHBOARD_READ` | `STUDY_ADMIN`, `STUDY_LEADER`, `STUDY_RA`, `STUDY_READ_ONLY` | All study roles |
| **Tasks** | `TASK_READ` | `STUDY_ADMIN`, `STUDY_LEADER`, `STUDY_RA` | `!role.isReadOnly` |
| **Recruitment** | `RECRUITMENT_READ` | `STUDY_ADMIN`, `STUDY_LEADER`, `STUDY_RA` | `!role.isReadOnly` |
| **Calendar** | `CALENDAR_READ` | `STUDY_ADMIN`, `STUDY_LEADER`, `STUDY_RA`, `STUDY_READ_ONLY` | All study roles |
| **Potential Participants** | `POTENTIAL_PARTICIPANT_READ` | `STUDY_ADMIN`, `STUDY_LEADER`, `STUDY_READ_ONLY` | `!role.isRA` |
| **Enrolled Participants** | `ENROLLED_PARTICIPANT_READ` | `STUDY_ADMIN`, `STUDY_LEADER`, `STUDY_READ_ONLY` | `!role.isRA` |
| **Study Settings** | `STUDY_SETTINGS_MANAGE` | `STUDY_ADMIN` | `role.isAdmin` |

---

## 6. Backend Integration

### 6.1. Reused Existing APIs
- `GET /api/v1/studies`: Lists accessible studies for the authenticated user.
- `GET /api/v1/studies/{studyId}`: Fetches basic study metadata and details.

### 6.2. New Dedicated API Endpoint
To resolve permissions dynamically and securely without client-side hardcoding, a dedicated endpoint was added to `enrollnow-study-service`:

```http
GET /api/v1/studies/{studyId}/permissions
GET /api/v1/tenants/{tenantId}/studies/{studyId}/permissions
```

**Response DTO (`StudyNavigationPermissionsResponse`):**
```json
{
  "studyId": "e30560a1-d576-46b0-ad5f-97217ffbe4f3",
  "studyName": "Cardio Trial Phase II",
  "studyRole": "STUDY_LEADER",
  "canViewDashboard": true,
  "canViewTasks": true,
  "canViewRecruitment": true,
  "canViewCalendar": true,
  "canViewPotentialParticipants": true,
  "canViewEnrolledParticipants": true,
  "canManageStudySettings": false,
  "isParticipantUser": false,
  "grantedPermissions": [
    "STUDY_DASHBOARD_READ",
    "TASK_READ",
    "RECRUITMENT_READ",
    "CALENDAR_READ",
    "POTENTIAL_PARTICIPANT_READ",
    "ENROLLED_PARTICIPANT_READ"
  ]
}
```

**Security & Authorization Enforcement:**
- The endpoint queries `enrollnow.study_team_members` and joins `enrollnow.role_permissions` and `enrollnow.permissions`.
- If the user is a `SITE_ADMIN` or tenant manager (`canManageSiteAdmins`), full navigation privileges are granted.
- If the calling user is neither a study team member nor an authorized administrator, the service throws an `AccessDeniedException` (HTTP 403 Forbidden).
- A tab cannot be viewed simply by changing the client URL: backend APIs enforce fine-grained permissions for all data operations.

---

## 7. Frontend Integration & UI Preservation

### 7.1. Strict UI Preservation
- The shell's **Global Header**, **Header Study Selector**, **Home Menu**, **Add Study** button, and **User Dropdown** (`Site Admin`, `Registry`, `Support`, `My Account`, `Sign Out`) were **not modified**.
- The study tab navigation renders directly inside the study workspace (`frontend/microfrontends/study/src/components/StudyNavigation.tsx`), preserving existing CSS tokens, typography, and borders.

### 7.2. State Synchronization and Navigation Behavior
1. **Selection:** Selecting a study in the header selector updates the route to `/studies/:studyId`.
2. **Dynamic Permissions:** The study microfrontend calls `getStudyPermissions(studyId)`.
3. **Tab Filtering:** Study navigation renders only authorized tabs using `canView*` flags and `isStudyTabAuthorized`.
4. **Default Tab:** If no tab is specified in the URL query parameters (`?tab=...`), the navigation defaults to `dashboard`.
5. **Direct Deep-Linking Guard:** If a user specifies `?tab=study_settings` but lacks `canManageStudySettings`, the application does not render the tab content and displays an accessible "Unauthorized Tab" banner with a redirect link to the Dashboard.
6. **Sub-navigation (Recruitment):** Recruitment provides a keyboard-navigable dropdown supporting `Sources` (`?tab=recruitment&subTab=sources`) and `Strategies` (`?tab=recruitment&subTab=strategies`).
7. **Accessibility:** Implements WAI-ARIA `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, and keyboard navigation (ArrowLeft, ArrowRight, Home, End).

---

## 8. Files Changed

### Backend (`enrollnow-study-service`)
- `src/main/java/com/enrollnow/study/dtos/StudyNavigationPermissionsResponse.java` (New DTO)
- `src/main/java/com/enrollnow/study/services/StudyService.java` (Added `getStudyNavigationPermissions`)
- `src/main/java/com/enrollnow/study/controllers/StudyController.java` (Added `/permissions` endpoints)
- `src/test/java/com/enrollnow/study/services/StudyServiceTest.java` (Unit tests for all role scenarios)
- `src/test/java/com/enrollnow/study/controllers/StudyControllerTest.java` (Unit tests for controller endpoints)

### Frontend (`frontend`)
- `shared/api/studyApi.ts` (Added `StudyNavigationPermissions` and `getStudyPermissions`)
- `microfrontends/study/src/components/StudyNavigation.tsx` (Study tab bar with RBAC checks and dropdown)
- `microfrontends/study/src/components/StudyDashboardTab.tsx` (Preserves existing recruitment charts)
- `microfrontends/study/src/components/StudyTabPlaceholder.tsx` (Clean phase-1 placeholder for non-dashboard tabs)
- `microfrontends/study/src/components/StudyUnauthorizedTab.tsx` (Access-denied feedback)
- `microfrontends/study/src/remoteEntry.tsx` (Main workspace integrating tab state, error states, and permissions)
- `shared/design-system/styles/_study.scss` (Tab styles matching design system)
- `microfrontends/study/src/test/studyNavigation.test.tsx` (11 unit tests)
- `microfrontends/study/src/test/studyModuleWorkflow.test.tsx` (3 integration tests)
- `microfrontends/study/src/test/study.test.ts` (API tests)

---

## 9. Verification & Test Summary

- **Backend Maven Tests:**
  `mvn test -pl enrollnow-study-service`
  Result: **47 tests run, 0 failures, 0 errors, 0 skipped** (BUILD SUCCESS).
- **Frontend Vitest Suite:**
  `npm test --prefix frontend`
  Result: **17 test files passed, 299 tests passed, 0 failures**.

---

## 10. Unresolved Items & Scope Boundary

- **Business functionality inside individual tabs:** Tasks grids, Recruitment strategy editors, Calendar scheduling, Participant enrollment tables, and Study configuration forms are deliberately deferred to subsequent milestone steps per prompt scope constraints.
- No unresolved tab visibility rules remain. All 7 tabs, 1 sub-menu dropdown, and 4 study roles have been verified from the legacy source code and confirmed against database RBAC tables.
