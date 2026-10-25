# Legacy Ripple Add Study and Import Study Analysis Report

## 1. Executive Summary

This report provides the complete legacy code analysis, domain model comparison, API mapping, and architectural blueprint for migrating the Add Study, Copy Study, and Import Study capabilities from Legacy Ripple (Meteor/MongoDB) into the EnrollNow enterprise platform (Spring Boot, PostgreSQL, React).

---

## 2. Source File Inventory

### 2.1 Legacy Ripple Codebase (`ripple`)
- `client/components/modals/addStudy.jsx`: React modal component handling short study name input, copy-from-dropdown selection, JSON file upload, SweetAlert confirmation dialogs, duplicate name checking, and routing.
- `imports/collections/studies/methods/addStudy.js`: Backend Meteor method validating caller permissions (`isUserTeamManagerForSomeTeam`), executing either `copyStudy` or fresh study creation, assigning user roles (`access.Admin`, `study.Coordinator`), invoking `createDefaultStudy`, and linking the study to user's team.
- `imports/collections/studies/methods/copyStudy.js`: Backend method orchestrating copy study by invoking `exportStudyToJSONFile(idOfStudyToCopy)` followed by `importStudyFromJSONFile(studyName, studyDataObj, ...)`.
- `imports/collections/studies/methods/createDefaultStudy.js`: Initializer creating default study configuration: 2 statuses ("Enrolled Participants", "Potential Participants"), default demographic groups (age, sex, ethnicity, race), and default event ("Intake").
- `server/studies/studyImportAndExport.js`: Core export and import engine. Serializes study metadata, requirements, custom variables, groups, statuses, events, templates, scheduled actions, and surveys. Re-generates identifiers and remaps cross-entity references during import.
- `server/studies/studyImportTestData.js` & `server/studies/studyImportAndExport.jest.js`: Schema reference and unit test specifications validating export/import structure and reference rewriting.
- `server/import-export/collectionData/studyInfos/importStudyInfo.js`: Participant-level study info importer for participant batch ingestion (operational data, distinct from study configuration).

### 2.2 Current EnrollNow Codebase (`EnrollNowApp`)
- `backend/enrollnow-study-service/.../StudyController.java`: REST controller exposing study lifecycle endpoints (`/api/v1/studies`, `/api/v1/studies/{studyId}`, `/api/v1/tenants/{tenantId}/studies`).
- `backend/enrollnow-study-service/.../StudyService.java`: Authoritative service managing study persistence, listing, filtering, and retrieval.
- `backend/enrollnow-study-service/.../StudyRepository.java`: JPA repository for `Study` entity with tenant-aware lookups.
- `backend/enrollnow-study-service/.../StudyRequirement.java`: JPA entity storing study sample size and configuration JSONB (`enrollnow.study_requirements`).
- `backend/enrollnow-study-service/.../StudyRequirementRepository.java`: JPA repository for `StudyRequirement`.
- `backend/enrollnow-study-service/.../StudyMember.java` & `StudyMemberRepository.java`: Membership association linking users to studies with active status and roles.
- `backend/enrollnow-study-service/.../StudyAccessService.java`: Manages study access, site/study-scoped role assignments, and authorization checks.
- `backend/enrollnow-identity-service/.../SiteAuthorizationService.java`: Resolves authenticated caller identity, tenant context, and site permissions.
- `backend/enrollnow-identity-service/.../SitePermissionService.java`: Enforces RBAC permissions (`SITE_STUDIES_CREATE`, `SITE_ALL_STUDIES_MANAGE`, `SITE_STUDIES_VIEW`).
- `frontend/microfrontends/study/src/remoteEntry.tsx`: Study microfrontend containing the Add Study modal UI, participant recruitment chart, and study selection.
- `frontend/shared/api/studyApi.ts`: Centralized TypeScript client for study API operations using shared Axios instance with auth interceptors.

---

## 3. Legacy Execution Flows

### 3.1 Add Study (Fresh Study)
1. User enters `studyName` (max 15 characters).
2. Frontend checks `studyNameCheck(name)` against existing studies loaded in client cache.
3. User clicks Submit.
4. Client checks study limit: `canAddNewStudy()` against `numberOfAllowedStudies`.
5. Meteor method `addStudy` invoked with `{ studyName }`.
6. Backend checks user authorization: `isUserTeamManagerForSomeTeam()`.
7. Backend inserts study document in `Studies` with `name` and initial member: `[{ userId: Meteor.userId() }]`.
8. Backend assigns roles: `access.Admin` and `study.Coordinator`.
9. Backend calls `createDefaultStudy({ studyId })`:
   - Inserts 2 Statuses: "Enrolled Participants" (genericCompleted) and "Potential Participants" (genericScreening).
   - Inserts Groups: Entire Sample (age 1-100), Female, Male, Other, Hispanic or Latino, Not Hispanic or Latino, American Indian, Asian, Hawaiian, Black / African American, White.
   - Inserts 1 Event: "Intake" linking to the two created statuses.
10. Backend updates caller's team in `Teams` collection to link `studyId`.
11. If any exception occurs, calls `deleteStudy(studyId)` for cleanup and throws error.
12. On client success, notification displayed, modal closes, router navigates to `/dashboard/:studyId`.

### 3.2 Copy Study (From Existing Study)
1. Dropdown is populated with studies where the user has Admin rights:
   `isUserStudyAdmin(studyId) || isUserTeamAdminForTeam(teamId)`.
2. User selects an existing study and enters new `studyName` (<= 15 characters).
3. Client verifies name uniqueness and study creation quota.
4. Meteor method `addStudy` called with `{ studyName, idOfStudyToCopy }`.
5. Backend verifies permissions and invokes `copyStudy({ studyName, idOfStudyToCopy, ... })`.
6. `exportStudyToJSONFile(idOfStudyToCopy)` reads:
   - Study document (excluding audit metadata and members).
   - StudyRequirements.
   - Groups.
   - CustomVariables.
   - ContactOutcomes and ContactRelationships (team-level).
   - BulkTaskGroups and BulkTasks.
   - TextTemplates and EmailTemplates (with file attachments).
   - ScheduledActions.
   - Surveys (reading definition and S3 JSON).
   - Statuses and Events.
   - DisplaySettings (StudyCustomizations).
   *Operational data (participants, responses, logs, audit trails) is strictly omitted.*
7. `importStudyFromJSONFile(studyName, studyDataObj, ...)`:
   - Creates new study document with new `_id`, `name = studyName`, caller as sole member.
   - Re-generates IDs and persists: CustomVariables, Statuses, StudyRequirements, Groups, Events, BulkTaskGroups, BulkTasks, Templates, ScheduledActions, Surveys, DisplaySettings.
   - Remaps internal foreign keys:
     - Event status IDs -> new status IDs.
     - Event relative trigger IDs -> new event IDs.
     - BulkTaskGroup event triggers -> new event IDs.
     - BulkTask group IDs -> new bulk task group IDs.
     - ScheduledAction template and trigger IDs -> new template/event/customVar IDs.
     - Survey customVar and status mappings -> new customVar and status IDs.
     - Template survey links -> rewritten to point to new study and new survey IDs.
   - Adds study to caller's team.
   - Assigns caller roles (`study.Coordinator`, `access.Admin`).
8. If failure occurs, backend deletes newly created study and rolls back.

### 3.3 Import Study (From JSON File)
1. User enters `studyName` (<= 15 characters).
2. User clicks "Import Study" and selects `.json` file.
3. Frontend validates file extension/MIME (`application/json` or `.json`).
4. Frontend parses file text using `JSON.parse()`.
5. Frontend checks name validity and non-emptiness.
6. Confirmation SweetAlert modal displayed:
   `"Importing file <name> will create study <studyName> and populate it with the file contents."`
7. On user confirmation, calls `importStudyFromJSONFile(studyName, dataJSON)`.
8. Backend executes the same import and ID remapping pipeline as Copy Study.
9. On success, displays success message and navigates to the new study dashboard.

---

## 4. Legacy Entity & Configuration Inventory

| Legacy entity/configuration | Exported? | Imported? | EnrollNow equivalent | Implementation status |
|---|---|---|---|---|
| Study metadata (name, code, settings) | Yes | Yes | `enrollnow.studies` table / `Study` JPA entity | Implemented & Reused |
| Study requirements (sampleSize) | Yes | Yes | `enrollnow.study_requirements.sample_size` | Implemented & Reused |
| Study configuration JSON (layout, variableGroups) | Yes | Yes | `enrollnow.study_requirements.configuration` (JSONB) | Implemented & Reused |
| Statuses (Enrolled, Potential, etc.) | Yes | Yes | `study_requirements.configuration -> statuses` | Implemented via JSONB config |
| Demographic Groups (age, sex, ethnicity, race) | Yes | Yes | `study_requirements.configuration -> groups` | Implemented via JSONB config |
| Custom Variables (name, variableType, options) | Yes | Yes | `study_requirements.configuration -> customVariables` | Implemented via JSONB config |
| Events (Intake, visits, relative calculations) | Yes | Yes | `study_requirements.configuration -> events` | Implemented via JSONB config |
| Bulk Task Groups & Tasks | Yes | Yes | `study_requirements.configuration -> bulkTaskGroups / bulkTasks` | Implemented via JSONB config |
| Text & Email Templates | Yes | Yes | `study_requirements.configuration -> templates` | Implemented via JSONB config |
| Surveys (questions, JSON, settings) | Yes | Yes | `study_requirements.configuration -> surveys` | Implemented via JSONB config |
| Scheduled Actions | Yes | Yes | `study_requirements.configuration -> scheduledActions` | Implemented via JSONB config |
| Display Settings (Customizations) | Yes | Yes | `study_requirements.configuration -> displaySettings` | Implemented via JSONB config |
| Team association | Recomputed | Recomputed | `enrollnow.team_studies` table / `TeamStudy` entity | Implemented |
| Memberships & Roles | Creator only | Creator only | `enrollnow.study_members` + `user_role_assignments` | Implemented |
| Participant / Enrollment records | NO | NO | None (Operational data excluded) | Omitted by design |
| Audit History / Logs | NO | NO | None (Historical audits excluded) | Omitted by design |

---

## 5. EnrollNow Architecture & API Mapping

### 5.1 Reusable Existing APIs
- `GET /api/v1/studies` (and `/api/v1/tenants/{tenantId}/studies`): Retrieves authorized studies for the caller. Used to populate the Copy Study dropdown.
- `GET /api/v1/studies/{studyId}`: Retrieves single study summary by ID or code.
- `POST /api/v1/studies`: Basic study creation. Enhanced to support full validation, study limits, unique name constraints, default configuration creation, and membership assignment.

### 5.2 Missing APIs Implemented
- `POST /api/v1/studies/copy`: Dedicated endpoint to clone an authorized source study with all supported configuration and ID remapping.
  - Body: `{ "studyName": "...", "sourceStudyId": "..." }`
- `POST /api/v1/studies/import`: Dedicated endpoint to import legacy study export JSON.
  - Supports `multipart/form-data` with `file` and `studyName`, or application/json payload with `studyName` and `studyData`.

### 5.3 Security and Tenant Isolation
- **Tenant Isolation**: All operations resolve tenant from the authenticated caller (`SiteAuthorizationService`). Cross-tenant study access or source study referencing is strictly rejected with `403 Forbidden` / `404 Not Found`.
- **Role Enforcement**: Study creation requires caller to hold `SITE_STUDIES_CREATE` or `SITE_ALL_STUDIES_MANAGE` permission (Site Admin or Site Manager).
- **Copy Source Authorization**: The caller must have access to the source study within their tenant.
- **Payload Sanitization**: Export JSON cannot dictate tenant ID, owner ID, or security permissions. The new study belongs to the caller's tenant, and the caller is assigned `STUDY_ADMIN` / `Coordinator` role.

---

## 6. Implementation Plan

1. **Database / Entities**:
   - Check and add `existsByTenantIdAndNameIgnoreCase` on `StudyRepository`.
   - Utilize existing `enrollnow.study_requirements` (`configuration` JSONB column) to store complete configuration trees without adding redundant fragile tables.
2. **Backend Services & DTOs**:
   - Create `CopyStudyRequest.java`, `ImportStudyResponse.java`.
   - Create `StudyConfigurationService.java` to handle:
     - Default study configuration generation (`createDefaultConfiguration`).
     - Configuration cloning and ID remapping (`cloneConfiguration`).
     - Legacy JSON import parsing, validation, mapping, and persistence (`importLegacyStudyConfiguration`).
   - Integrate with `StudyService.java` and `StudyController.java`.
   - Update `StudyAccessService` to assign default `STUDY_ADMIN` role and `StudyMember` on study creation.
3. **Frontend React Integration**:
   - Enhance `frontend/shared/api/studyApi.ts` with `copyStudy` and `importStudy` typed methods.
   - Enhance `StudyModule` in `frontend/microfrontends/study/src/remoteEntry.tsx`:
     - Short Study Name: required, max 15 chars, instant validation.
     - Copy From Existing Study: dynamic list filtered to eligible studies, loading & error states, clearable.
     - Submit handler: routes to `studyApi.copyStudy` if source selected, otherwise `studyApi.createStudy`.
     - Import Study: accessible file input, validation, confirmation dialog modal, loading progress, error handling, dashboard navigation.
4. **Testing & Verification**:
   - Backend unit and integration tests for validation, study copy, legacy import, ID remapping, cross-tenant rejection, and rollback on failure.
   - Frontend unit tests for validation, copy submission, import confirmation, error handling, and keyboard accessibility.
   - End-to-end scenario verification.
