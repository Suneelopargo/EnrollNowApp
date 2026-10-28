# Legacy Ripple Study Tab Visibility Analysis

## 1. Executive Summary

This document provides a comprehensive analysis of the study-level navigation and tab visibility rules in the legacy Ripple application (`D:\ProjectsWorkSpace\ProjectCode\EnrollnowSpace\ripple`) and their architectural mapping into the EnrollNow application (`D:\ProjectsWorkSpace\ProjectCode\EnrollnowSpace\EnrollNowApp`).

The objective is to resolve the defect where all study tabs were visible for every study regardless of user role, ensuring dynamic, role-governed tab visibility and strict fail-closed authorization aligned with verified legacy Ripple rules.

---

## 2. Legacy Ripple Navigation Architecture & Entry Points

In the legacy Ripple Meteor.js application, study navigation operates across three interconnected layers:
1. **Access Role Catalog (`both/helpers/accessRoles.js`)**:
   Defines the canonical access roles:
   ```javascript
   export const ACCESS_ROLES = {
     Admin: 'Admin',
     Leader: 'Leader',
     RA: 'RA',
     ReadOnly: 'ReadOnly',
   };

   export const SITE_ACCESS_ROLES = {
     SiteOwner: 'Site-Owner',
   };
   ```
2. **Global Permission & Membership Engine (`lib/global_permissions.js`)**:
   - `getStudyMemberAccessRole({ userId, studyId })`: Queries Meteor's `roleAssignment` collection strictly scoped to `scope: studyId`. Roles outside this scope do not grant study-level privileges.
   - `_checkStudyPermissions({ studyId, userId, accessRole })`: Evaluates the study role hierarchy:
     - `Admin` requires `ACCESS_ROLES.Admin`.
     - `Leader` permits `Admin` or `Leader`.
     - `RA` permits `Admin`, `Leader`, or `RA`.
     - `ReadOnly` permits viewing permitted data without execution/management access.
   - `isUserSiteOwner(userId)`: Checks `SITE_ACCESS_ROLES.SiteOwner`. Crucially, site ownership grants cross-site oversight and management, but does **not** inject `ACCESS_ROLES.Admin` into an individual study's scoped navigation unless explicitly assigned.
3. **Tab Rendering Component (`client/components/authenticated/studyPages/studyNav.jsx`)**:
   Controls the presentation of tabs based on `role.isAdmin`, `role.isLeader`, `role.isRA`, `role.isReadOnly`, and `isParticipantUser`.
4. **Route Guards (`client/routes/authenticated.jsx`)**:
   Enforces `triggersEnter` role validations on `/study/:studyId/...` routes, redirecting unauthorized users back to the dashboard.

---

## 3. Legacy Tab Inventory & Visibility Conditions

### 3.1. Tab Inventory

The legacy study workspace features **7 top-level tabs** and **1 sub-menu dropdown**:

| # | Tab Label | Route Identifier | Sub-navigation | Default Tab |
|---|-----------|------------------|----------------|:-----------:|
| 1 | **Dashboard** | `dashboard` | None | **Yes** |
| 2 | **Tasks** | `tasks` | Filter views (`All Tasks`, `Recruitment`, `Participant`, `Misc.`) | No |
| 3 | **Recruitment** | `recruitment` | Dropdown: `Sources` (`recruitmentSources`), `Strategies` (`recruitmentStrategies`) | No |
| 4 | **Calendar** | `calendar` | Calendar views | No |
| 5 | **Potential Participants** | `potential_participants` | None | No |
| 6 | **Enrolled Participants** | `enrolled_participants` | None | No |
| 7 | **Study Settings** | `study_settings` | None | No |

### 3.2. Master Visibility Matrix

| Study Role | Dashboard | Tasks | Recruitment | Calendar | Potential Participants | Enrolled Participants | Study Settings |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Admin** | Visible | Visible | Visible | Visible | Visible | Visible | Visible |
| **Leader** | Visible | Visible | Visible | Visible | Visible | Visible | Hidden |
| **RA** (Research Assistant) | Visible | Visible | Visible | Visible | Hidden | Hidden | Hidden |
| **ReadOnly** | Visible | Hidden | Hidden | Visible | Visible | Visible | Hidden |
| **Participant User** (`isParticipantUser`) | *Suppressed* | *Suppressed* | *Suppressed* | *Suppressed* | *Suppressed* | *Suppressed* | *Suppressed* |

### 3.3. Source Code Evidence & Rules

#### Rule 1: Participant Portal User Suppression
- **Source Citation:** `ripple/client/components/authenticated/studyPages/studyNav.jsx` lines 14–16:
  ```jsx
  if (isParticipantUser) {
    return null;
  }
  ```
- **Source Citation:** `ripple/imports/collections/users/UsersSchema.js` line 114:
  `isParticipantUser: { type: Boolean, optional: true }`
- **Rule:** If the authenticated account is flagged as a participant-portal user, the study navigation bar is completely suppressed. Participants do not interact with study staff tabs.

#### Rule 2: Study Settings Strict Admin Restriction
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
- **Rule:** Visible exclusively to users with `role.isAdmin`. Study Leaders, RAs, ReadOnly users, and unassigned Site Admins must never see Study Settings.

#### Rule 3: Participant Data Protection (RA Restriction)
- **Source Citation:** `ripple/client/components/authenticated/studyPages/studyNav.jsx` lines 57–74:
  ```jsx
  {!role.isRA && (
    <li role="presentation" className={activeTab === 'potential_participants' ? 'active' : ''}>
      <a href={FlowRouter.path('potential_participants', { studyId })}>...</a>
    </li>
  )}
  {!role.isRA && (
    <li role="presentation" className={activeTab === 'enrolled_participants' ? 'active' : ''}>
      <a href={FlowRouter.path('enrolled_participants', { studyId })}>...</a>
    </li>
  )}
  ```
- **Rule:** RAs (`STUDY_RA`) are excluded from viewing Potential Participants and Enrolled Participants to protect PHI and study enrollment pipelines from restricted assistants.

#### Rule 4: ReadOnly Functional Suppression
- **Source Citation:** `ripple/client/components/authenticated/studyPages/studyNav.jsx` lines 27–47:
  ```jsx
  {!role.isReadOnly && (
    <li role="presentation" className={activeTab === 'tasks' ? 'active' : ''}>...</li>
  )}
  {!role.isReadOnly && (
    <li role="presentation" className={`dropdown ${activeTab === 'recruitment' ? 'active' : ''}`}>...</li>
  )}
  ```
- **Rule:** ReadOnly users are excluded from `Tasks` and `Recruitment` (Sources and Strategies). They may only view Dashboard, Calendar, and Participant registries in a read-only mode.

#### Rule 5: Default Route Behavior
- **Source Citation:** `ripple/client/components/authenticated/header/studySelector.jsx`:
  Selecting a study directs the user to `FlowRouter.go('dashboard', { studyId })`. `Dashboard` is always the default active tab.

---

## 4. Current EnrollNow Architecture Comparison

| Architectural Dimension | Legacy Ripple | Modern EnrollNow |
|---|---|---|
| **Frontend Framework** | Meteor.js + Blaze/React 15 + FlowRouter | React 18 + Module Federation + React Router 6 |
| **Backend Architecture** | Meteor DDP / Node.js / MongoDB | Spring Boot RESTful Microservices / PostgreSQL |
| **Identity & Authentication** | Meteor Accounts / Mongo `users` collection | Keycloak OIDC / JWT Tokens (`SiteAuthorizationService`) |
| **Study Role Scope** | `Meteor.roleAssignment` with `scope: studyId` | `enrollnow.user_role_assignments` with `study_id` & validity window |
| **Fine-Grained Permissions** | Implicit role hierarchy in JS helpers | `enrollnow.permissions` + `enrollnow.role_permissions` relational RBAC |
| **Site Admin Scope** | `SITE_ACCESS_ROLES.SiteOwner` | `SITE_ADMIN` role / `PERM_SITE_ALL_STUDIES_MANAGE` permission |
| **Study Workspace** | Monolithic template layout | `enrollnow-study-mfe` (`remoteEntry.tsx`) hosted inside `shell-app` |

---

## 5. EnrollNow RBAC Permission Catalog Mapping

In `database/completeworkingcopy.sql`, permissions are defined in `enrollnow.permissions` and linked to roles in `enrollnow.role_permissions`:

| Tab | Required Permission Code | Granted Roles in DB | Legacy Ripple Equivalent Check |
|---|---|---|---|
| **Dashboard** | `STUDY_DASHBOARD_READ` | `STUDY_ADMIN`, `STUDY_LEADER`, `STUDY_RA`, `STUDY_READ_ONLY` | All study roles |
| **Tasks** | `TASK_READ` | `STUDY_ADMIN`, `STUDY_LEADER`, `STUDY_RA` | `!role.isReadOnly` |
| **Recruitment** | `RECRUITMENT_READ` | `STUDY_ADMIN`, `STUDY_LEADER`, `STUDY_RA` | `!role.isReadOnly` |
| **Calendar** | `CALENDAR_READ` | `STUDY_ADMIN`, `STUDY_LEADER`, `STUDY_RA`, `STUDY_READ_ONLY` | All study roles |
| **Potential Participants** | `POTENTIAL_PARTICIPANT_READ` | `STUDY_ADMIN`, `STUDY_LEADER`, `STUDY_READ_ONLY` | `!role.isRA` |
| **Enrolled Participants** | `ENROLLED_PARTICIPANT_READ` | `STUDY_ADMIN`, `STUDY_LEADER`, `STUDY_READ_ONLY` | `!role.isRA` |
| **Study Settings** | `STUDY_SETTINGS_MANAGE` | `STUDY_ADMIN` | `role.isAdmin` |

---

## 6. Global Site Admin versus Study-Specific Roles

### Established Policy
1. **Separation of Concerns:** Site Administration (`SITE_ADMIN`, `canManageSiteAdmins`) governs tenant-level configuration, user management, and cross-study oversight. It does **not** automatically elevate the user to `STUDY_ADMIN` within study workspaces.
2. **Assigned Studies:** When a global Site Admin has an explicit study assignment (e.g. `STUDY_RA` or `STUDY_LEADER`), their study navigation honors their assigned role. They are not granted `STUDY_SETTINGS_MANAGE`.
3. **Unassigned Studies:** When a global Site Admin inspects a study in which they have no explicit study assignment, they receive `STUDY_READ_ONLY` ("Site Administrator (Read Only)"). This allows administrative oversight while keeping `Study Settings`, `Tasks`, and `Recruitment` strictly hidden.
4. **Regular Users:** A non-site-admin user with no study assignment, an expired assignment, or an inactive assignment is denied access (HTTP 403 Forbidden).

---

## 7. Analysis of the "All Tabs Visible" Bug & Root Causes

The investigation identified three compounding root causes:

1. **Unsafe Initialization in `StudyController`:**
   In `getStudyNavigationPermissions()`, `canManageSiteAdmins` was initialized to `true`:
   ```java
   boolean canManageSiteAdmins = true;
   ```
   If the caller identity could not be resolved or authentication was incomplete, `canManageSiteAdmins` remained `true`.
2. **Automatic Elevation in `StudyService`:**
   Whenever `canManageSiteAdmins` was `true`, `StudyService` executed:
   ```java
   if (canManageSiteAdmins) {
       studyRoleName = "Study Admin";
       studyPermissionCode = "STUDY_ADMIN";
   }
   ```
   This unconditionally granted `STUDY_ADMIN` and all 7 tabs to any unresolved caller or site admin.
3. **Bypassed Permission Check on Empty Permissions in React:**
   In `frontend/microfrontends/study/src/components/StudyNavigation.tsx`:
   ```typescript
   if (tabDef && perms.length > 0) {
       if (!perms.includes(tabDef.requiredPermission)) return false;
   }
   switch (role) {
       case 'STUDY_ADMIN': return true;
       ...
   ```
   When `perms` was empty (`perms.length === 0`), the check was bypassed, allowing the `switch (role)` to return `true` for all tabs. Additionally, on study switching in `remoteEntry.tsx`, previous permissions were not cleared immediately, causing stale privileged tabs to persist while a new study loaded.

All three root causes have been corrected and verified across backend and frontend test suites.
