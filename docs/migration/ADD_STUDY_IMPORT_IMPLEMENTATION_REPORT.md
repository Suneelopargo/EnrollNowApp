# Add Study and Import Study Migration: Implementation Report

## 1. Executive Summary

This report documents the migration of the Add Study, Copy Study, and Import Study functionality from legacy Ripple (Meteor/MongoDB) to EnrollNow (Spring Boot, PostgreSQL, React microfrontends).

All business requirements and constraints have been fulfilled:
- The existing React UI design, styles, and architecture were preserved.
- Validation, study-name uniqueness (case-insensitive, max 15 characters), tenant isolation, and RBAC permissions are strictly enforced on both backend and frontend.
- Copy Study clones study metadata and re-generates identifiers and internal references across study requirements, statuses, groups, events, bulk tasks, templates, and surveys.
- Import Study accepts valid legacy `.json` exports, validates payload structure, requests confirmation via the shared confirmation dialog, re-generates identifiers, remaps dependencies, persists configurations in PostgreSQL (`enrollnow.study_requirements` JSONB), and provides detailed feedback and routing.
- Operational records (participants, historical responses, activity audit events) are deliberately not cloned or imported, preserving audit trails and privacy boundaries.

---

## 2. Implementation Status Summary

| Capability | Legacy Reference | EnrollNow Implementation | Status |
|---|---|---|---|
| Short Study Name Validation | `addStudy.jsx` (max 15, unique, non-empty) | Frontend validation + backend `StudyService.validateStudyName` + `DuplicateStudyNameException` / `InvalidStudyException` | Implemented and verified |
| Account / Tenant Study Limit | `addStudy.jsx` (`allowedStudies`) | `StudyService.checkStudyLimit` configurable via `enrollnow.study.max-studies-per-tenant` | Implemented and verified |
| Default Study Configuration | `createDefaultStudy.js` (statuses, groups, events) | `StudyConfigurationService.createDefaultConfiguration` persisted to `enrollnow.study_requirements` | Implemented and verified |
| Creator Association & Roles | `addStudy.js` (`access.Admin`, `study.Coordinator`, team link) | `StudyService.assignStudyCreator` (sets `StudyMember`, `STUDY_ADMIN` role assignment, and `team_studies` record) | Implemented and verified |
| Copy Study Workflow | `copyStudy.js` (`exportStudyToJSONFile` + `importStudyFromJSONFile`) | `POST /api/v1/studies/copy` + `StudyService.copyStudy` + `StudyConfigurationService.cloneConfiguration` | Implemented and verified |
| ID & Reference Remapping | `studyImportAndExport.js` (`processAndRemapConfiguration`) | `StudyConfigurationService.processAndRemapConfiguration` (remaps statuses, groups, events, relativeEventId, bulk tasks, templates, surveys, survey JSON) | Implemented and verified |
| Import Study JSON Validation | `addStudy.jsx` (file type check, JSON.parse) | Frontend `.json` check + JSON parsing + backend `POST /api/v1/studies/import` multipart & JSON endpoints | Implemented and verified |
| Import Confirmation Dialog | `addStudy.jsx` (`accessibleSwal` confirmation) | Integrated with shared `confirmation.confirm` modal before execution | Implemented and verified |
| UI & Accessibility Integration | `remoteEntry.tsx`, `AccessibleSelect` | Keyboard-accessible modal, focus trap (`useFocusTrap`), clearable dropdown, toast notifications, loading states | Implemented and verified |

---

## 3. API Inventory

### 3.1 Reused Existing APIs
- `GET /api/v1/studies` (and `/api/v1/tenants/{tenantId}/studies`): Retrieves authorized studies for tenant, filtering for non-admin callers to assigned studies. Reused to populate Copy Study dropdown.
- `GET /api/v1/studies/{studyId}`: Retrieves individual study details.
- `POST /api/v1/studies` (and `/api/v1/tenants/{tenantId}/studies`): Enhanced with strict name validation, duplicate checks, default configuration generation, and creator role/membership assignment.
- `PUT /api/v1/studies/{studyId}`: Updates existing study metadata.

### 3.2 Newly Created Backend APIs
- `POST /api/v1/studies/copy` (and `/api/v1/tenants/{tenantId}/studies/copy`):
  - Request: `CopyStudyRequest` (`studyName`, `sourceStudyId`)
  - Response: `ApiResponse<StudySummaryResponse>` (HTTP 201 Created)
- `POST /api/v1/studies/import` (and `/api/v1/tenants/{tenantId}/studies/import`):
  - Consumes: `application/json` (body: `studyName`, `studyData` or raw JSON)
  - Consumes: `multipart/form-data` (parts: `file` [.json], `studyName`)
  - Response: `ApiResponse<ImportStudyResponse>` (HTTP 201 Created with study ID and summary)

---

## 4. File Changes and Additions

### 4.1 Backend (`backend/`)
- `enrollnow-identity-service/src/main/java/com/enrollnow/identity/services/SiteAuthorizationService.java`:
  - Added `requireStudyCreateAccess(UUID targetTenantId)` enforcing `SITE_STUDIES_CREATE` / `SITE_ALL_STUDIES_MANAGE` RBAC permissions.
- `enrollnow-study-service/src/main/java/com/enrollnow/study/repositories/StudyRepository.java`:
  - Added `existsByTenantIdAndNameIgnoreCase(UUID tenantId, String name)` and `findByTenantIdAndNameIgnoreCase(UUID tenantId, String name)`.
- `enrollnow-study-service/src/main/java/com/enrollnow/study/dtos/CreateStudyRequest.java`:
  - Added `@Size(max = 15)` and `@JsonAlias({"title", "shortName"})`.
- `enrollnow-study-service/src/main/java/com/enrollnow/study/dtos/CopyStudyRequest.java`:
  - Created DTO with validation annotations and aliases (`shortName`, `templateId`).
- `enrollnow-study-service/src/main/java/com/enrollnow/study/dtos/ImportStudyResponse.java`:
  - Created DTO returning study ID, study code, entity summary counts, and notes on unsupported features.
- `enrollnow-study-service/src/main/java/com/enrollnow/study/exceptions/DuplicateStudyNameException.java`:
  - Created domain exception mapped to HTTP 400 with `DUPLICATE_STUDY_NAME`.
- `enrollnow-study-service/src/main/java/com/enrollnow/study/exceptions/InvalidStudyException.java`:
  - Created domain exception mapped to HTTP 400 with `INVALID_STUDY`.
- `enrollnow-study-service/src/main/java/com/enrollnow/study/exceptions/StudyLimitExceededException.java`:
  - Created domain exception mapped to HTTP 400 with `STUDY_LIMIT_EXCEEDED`.
- `enrollnow-study-service/src/main/java/com/enrollnow/study/services/StudyConfigurationService.java`:
  - Created configuration service handling default configuration generation, configuration cloning with full ID remapping, and legacy JSON export parsing and translation.
- `enrollnow-study-service/src/main/java/com/enrollnow/study/services/StudyService.java`:
  - Implemented `validateStudyName`, `checkStudyLimit`, `generateUniqueStudyCode`, `assignStudyCreator`, `copyStudy`, and `importStudy`.
- `enrollnow-study-service/src/main/java/com/enrollnow/study/controllers/StudyController.java`:
  - Added `/studies/copy` and `/studies/import` endpoints, injected authorization checks, and resolved caller identities.
- `enrollnow-app/src/main/resources/application.properties`:
  - Configured `spring.servlet.multipart.max-file-size=50MB` and `spring.servlet.multipart.max-request-size=50MB` to support realistic study export JSON files exceeding the 1MB Spring Boot default.
- `enrollnow-study-service/src/main/java/com/enrollnow/study/controllers/StudyExceptionHandler.java`:
  - Added exception handlers for duplicate names, validation errors, invalid studies, study limits, access denial, and `MaxUploadSizeExceededException`.
- `enrollnow-study-service/src/main/java/com/enrollnow/study/models/StudyRequirement.java`:
  - Added `@JdbcTypeCode(SqlTypes.JSON)` to the `configuration` column to ensure Hibernate 6 maps JSON strings to PostgreSQL `jsonb` parameters without type-casting mismatches (`Types.OTHER` / `?::jsonb`).
- `enrollnow-app/src/main/resources/db/migration/V23__study_name_uniqueness_index.sql`:
  - Added Flyway migration creating unique case-insensitive index `ix_studies_tenant_name_lower` on `enrollnow.studies(tenant_id, lower(name))`.

### 4.2 Frontend (`frontend/`)
- `shared/api/studyApi.ts`:
  - Extended API client with typed `copyStudy`, `importStudy` (multipart), and `importStudyJson` methods.
- `microfrontends/study/src/remoteEntry.tsx`:
  - Preserved existing layout and SCSS classes.
  - Implemented Short Study Name validation (empty check, max 15 characters, case-insensitive duplicate check).
  - Implemented Copy From Existing Study dropdown (filtered to caller's accessible studies, sorted case-insensitively, clearable).
  - Integrated Submit button (routing to `copyStudy` when template chosen, `createStudy` otherwise).
  - Integrated Import Study button with file picker, `.json` validation, confirmation modal (`confirmation.confirm`), and progress indicators.
  - Integrated accessible toasts (`toast.success` and `toast.error`) and routing to created study dashboard.

---

## 5. Security and Tenant Isolation Verification

1. **Authentication Required**: Anonymous or unauthenticated calls to study creation, copying, or importing are rejected with HTTP 401/403.
2. **Tenant Scoping**: All operations resolve tenant ID from authenticated JWT claims (`CallerIdentity`). Cross-tenant source study lookups are blocked.
3. **RBAC Permission**: Callers must possess `SITE_STUDIES_CREATE` or `SITE_ALL_STUDIES_MANAGE` permissions.
4. **Source Study Authorization**: When copying, the caller can only select and clone studies within their authorized tenant.
5. **No Blind Trust of Uploaded Payload**: Tenant ID, ownership, and role assignments in uploaded JSON files are ignored; the newly imported study is strictly bound to the authenticated caller's tenant and creator ID.
6. **Data Privacy**: Live participant contact records, enrollment histories, and audit events from source studies or import files are excluded.

---

## 6. Migration Gaps and Unsupported Legacy Configuration

1. **AWS S3 Direct File Storage**:
   - Legacy Ripple stored large survey JSON structures directly in AWS S3 buckets and linked them via S3 keys.
   - *EnrollNow Solution*: Survey definitions and questionnaires are normalized into relational JSONB structures within PostgreSQL (`enrollnow.study_requirements`), removing external S3 bucket coupling while retaining full survey tree fidelity.
2. **MongoDB ObjectIds vs Relational Identifiers**:
   - Legacy Ripple relied on 17-character NanoIDs and MongoDB `_id` strings.
   - *EnrollNow Solution*: EnrollNow uses UUID primary keys for `Study` and string-based component identifiers (`stat_*`, `grp_*`, `evt_*`, `srv_*`) within JSONB configuration, seamlessly bridging legacy references with PostgreSQL integrity.
3. **Legacy Ripple Science Web Links**:
   - Legacy templates frequently included hardcoded URLs pointing to `*.ripplescience.com/survey/...`.
   - *EnrollNow Solution*: URL rewriting replaces legacy URLs with relative and tenant-scoped study/survey paths.
4. **Meteor Reactivity**:
   - Meteor collections utilized live WebSockets/Minimongo for reactive updates.
   - *EnrollNow Solution*: EnrollNow utilizes standard REST APIs, TanStack/React state management, and event-driven toast dispatching.

---

## 7. Build and Automated Test Results

### 7.1 Backend Tests (`enrollnow-study-service` and `enrollnow-identity-service`)
Command executed: `mvn test -pl enrollnow-identity-service,enrollnow-study-service -f backend/pom.xml`
- **Identity Service**: 80 tests run, 0 failures, 0 errors.
- **Study Service**: 34 tests run, 0 failures, 0 errors.
  - `StudyControllerTest`: 7 tests passed.
  - `StudyCopyAndImportControllerTest`: 7 tests passed (covering copy endpoints, multipart/json import, access denial, 400/404 handling).
  - `StudyAccessServiceTest`: 4 tests passed.
  - `StudyCopyAndImportServiceTest`: 10 tests passed (covering name validation, study limit, default configuration, copying, ID remapping, cross-tenant rejection, legacy JSON import).
  - `StudyServiceTest`: 6 tests passed.
- **Overall Result**: **114 passed, 0 failures, 0 errors. BUILD SUCCESS.**

### 7.2 Frontend Tests (`enrollnow-study-mfe` and Monorepo)
Command executed: `npm --prefix frontend/microfrontends/study test`
- `study.test.ts`: 4 tests passed.
- `addStudyAndImport.test.ts`: 13 tests passed (covering API endpoints, Short Study Name validation, duplicate name checks, confirmation dialogs, toast dispatches).
- **Study MFE Result**: **17 passed, 0 failures.**
Command executed: `npm --prefix frontend test`
- **Monorepo Suite Result**: **All workspace tests passed (152 shared tests, 35 admin tests, 17 study tests, 26 participant tests, 16 identity tests, 9 dashboard tests, etc.).**
