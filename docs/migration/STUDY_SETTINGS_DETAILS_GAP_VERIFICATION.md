# Study Settings → Details: Final Source-Code Gap Verification Report

## 1. Executive Summary

This document records the final, source-code-based verification of the **Study Settings → Details** screen and its supporting backend services in the EnrollNow application (`EnrollNowApp`) against the authoritative legacy Ripple source code (`D:\ProjectsWorkSpace\ProjectCode\EnrollnowSpace\ripple`).

Rather than assuming prior parity claims were complete, every execution path—from React UI state management through REST controllers, Spring Boot service methods, Jackson JSON serialization, and JPA repository persistence—was audited directly against the legacy Meteor/React implementation.

### Summary of Verification Findings & Final Status

| Verification Area | Initial Status Found During Final Audit | Final Post-Remediation Status |
| :--- | :--- | :--- |
| **1. Custom Participant ID Generation** | **GAP FOUND**: Setting & prefix were stored in `enrollnow.studies`, but `ParticipantRegistryService.assignStudy()` hardcoded `"SP-" + UUID` and `createParticipant()` ignored study prefix settings. | **VERIFIED PARITY**: `ParticipantRegistryService` and `StudyService` now consume `customIdGenerationEnabled`, `prefix`, and `nextSequentialIdentifier` to generate `${PREFIX}${8-digit-padded-seq}` (`%s%08d`) and persist `STUDY_CUSTOM_ID` identifiers. |
| **2. Incremental Component Import** | **GAP FOUND**: `StudyConfigurationService.importComponentsIntoExistingStudy()` lacked strict input structure validation, top-level `actionTriggerId` remapping on scheduled actions, and `StudyNotFoundException` enforcement on missing study requirements. | **VERIFIED PARITY**: Full validation, deduplication (within batch and against existing), ID remapping (`idMap` across variables, options, statuses, events, templates, scheduled actions, and survey JSON), and atomic `@Transactional` rollback verified. |
| **3. Export Compatibility** | **GAP FOUND**: `StudyService.exportStudy()` caught and silently ignored JSON parsing errors on `StudyRequirement.configuration`, potentially returning incomplete exports on corrupted data. | **VERIFIED PARITY**: Corrupted configuration JSON now explicitly throws `InvalidStudyException` (HTTP 400). Export includes both `name` and `studyName`, `prefix`, `customIdGenerationEnabled`, `study_grants`, and all component arrays. |
| **4. Authorization & Tenant Isolation** | **GAP FOUND**: `updateStudyDetails`, `exportStudy`, and `importStudyComponents` only checked permissions when `callerUserId != null`, allowing unauthenticated null-caller calls when `!canManageSiteAdmins` in direct service invocations. | **VERIFIED PARITY**: Explicit `callerUserId == null` rejection throws `AccessDeniedException` whenever `!canManageSiteAdmins`. Cross-tenant queries are strictly isolated via `findByTenantIdAndId`. |
| **5. Unsaved Changes Navigation Protection** | **GAP FOUND**: Browser `beforeunload` and submenu switching (`StudySettingsWorkspace`) were guarded, but changing the active `studyId` prop directly inside `StudySettingsDetails` did not prompt before reloading. | **VERIFIED PARITY**: `StudySettingsDetails` tracks `prevStudyIdRef` and `isDirtyRef` to prompt via `window.confirm` on study selection changes, alongside submenu and `beforeunload` guards. |

---

## 2. Source Files & Methods Inspected

### Legacy Ripple Repository (`D:\ProjectsWorkSpace\ProjectCode\EnrollnowSpace\ripple`)
1. `client/components/authenticated/studyPages/settings/details.jsx` — Legacy Details form, state bindings, validation rules, prefix uppercase normalization, custom ID toggle, and export/import triggers.
2. `client/components/authenticated/studyPages/settings/IncrementalImport.jsx` — Legacy selective component import modal, category accordions, item checkboxes, and survey/custom-variable dependency note.
3. `both/customIds/generateCustomId.js` (`generateCustomId`, `createNextCustomId`) — Authoritative custom ID sequence increment (`nextSequentialIdentifier + 1`) and 8-digit zero-padding (`padStart(8, '0')`).
4. `both/customIds/settings.js` (`sequentialPadLength = 8`, `maxPrefixLength = 5`, `upperCasePrefix = true`) — Authoritative custom ID formatting constants.
5. `imports/collections/study_participants/methods/addParticipant.js` (`addParticipant`, lines 65–75) — Consumption of `study.customIdGenerationEnabled && study.prefix` during participant creation/enrollment.
6. `server/studies/studyImportAndExport.js` (`exportStudyDataJSON`, `importStudyComponents`, lines 944–1500) — Authoritative component export schema and incremental component import with ID remapping.

### EnrollNow Repository (`d:\ProjectsWorkSpace\ProjectCode\EnrollnowSpace\EnrollNowApp`)
1. `backend/enrollnow-db-migration/src/main/resources/db/migration/V3__study_foundation.sql` — Verified `enrollnow.studies` columns: `prefix VARCHAR(50)`, `custom_id_generation_enabled BOOLEAN NOT NULL DEFAULT FALSE`, `next_sequential_identifier BIGINT NOT NULL DEFAULT 0`.
2. `backend/enrollnow-db-migration/src/main/resources/db/migration/V10__consent_enrollment.sql` — Verified `enrollnow.study_enrollments` table and `study_participant_id` column.
3. `backend/enrollnow-study-service/src/main/java/com/enrollnow/study/models/Study.java` — Verified entity mappings for `prefix`, `customIdGenerationEnabled`, and `nextSequentialIdentifier`.
4. `backend/enrollnow-study-service/src/main/java/com/enrollnow/study/services/StudyService.java` — Audited `getStudyDetails`, `updateStudyDetails`, `exportStudy`, `importStudyComponents`, and `generateNextCustomParticipantId`.
5. `backend/enrollnow-study-service/src/main/java/com/enrollnow/study/services/StudyConfigurationService.java` — Audited `importComponentsIntoExistingStudy`, `createDefaultConfiguration`, and `processAndRemapConfiguration`.
6. `backend/enrollnow-study-service/src/main/java/com/enrollnow/study/controllers/StudyController.java` — Audited `/details`, `/export`, and `/import-components` endpoints.
7. `backend/enrollnow-participant-service/src/main/java/com/enrollnow/participant/services/ParticipantRegistryService.java` — Audited `createParticipant`, `assignStudy`, and `generateStudyParticipantId`.
8. `frontend/microfrontends/study/src/components/StudySettingsDetails.tsx` — Audited form state, custom ID prefix controls, incremental import modal, and navigation guards.
9. `frontend/microfrontends/study/src/components/StudySettingsWorkspace.tsx` — Audited submenu dirty-state guard (`isDetailsDirty`).

---

## 3. Detailed Verification by Focus Area

### 3.1 Custom Participant ID Generation
- **Legacy Behavior**:
  - In `both/customIds/generateCustomId.js` and `both/customIds/settings.js`, when `study.customIdGenerationEnabled` is `true` and `study.prefix` is non-empty, Ripple increments `study.nextSequentialIdentifier` by 1 and formats the ID as `${prefix}${String(nextSequentialIdentifier + 1).padStart(8, '0')}` (e.g., `ONCO00000001`).
  - Prefix is constrained to `<= 5` uppercase alphanumeric characters (`maxPrefixLength = 5`, `upperCasePrefix = true`) and must be unique across studies within the tenant.
- **EnrollNow Verification & Remediation**:
  - `StudyService.updateStudyDetails()` validates that when `customIdGenerationEnabled` is `true`, `prefix` is required, normalized to uppercase, `<= 5` alphanumeric characters, and unique per tenant via `StudyRepository.existsByTenantIdAndPrefixIgnoreCaseAndIdNot()`. When disabled, `prefix` is cleared to `null`.
  - `ParticipantRegistryService.generateStudyParticipantId(Study)` and `StudyService.generateNextCustomParticipantId(UUID, UUID)` consume `study.isCustomIdGenerationEnabled()`, `study.getPrefix()`, and `study.getNextSequentialIdentifier()`.
  - In `ParticipantRegistryService.assignStudy()` (when enrolling a participant) and `ParticipantRegistryService.createParticipant()` (when creating a participant with a `studyId`), if custom ID generation is enabled on the target study, the service increments `nextSequentialIdentifier`, persists the updated `Study`, assigns the formatted ID (`PREFIX00000001`) to `StudyEnrollment.studyParticipantId`, and creates a `ParticipantIdentifier` record with `identifierType = "STUDY_CUSTOM_ID"`. When disabled, it falls back to `"SP-" + UUID`.

### 3.2 Incremental Component Import
- **Legacy Behavior**:
  - `IncrementalImport.jsx` parses a study JSON file and displays categories (`customVariables`, `statuses`, `events`, `emailTemplates`, `textTemplates`, `scheduledActions`, `surveys`, `bulkTasks`, `studyGroups`) with item-level checkboxes.
  - `studyImportAndExport.js:importStudyComponents` imports only the user-selected items into the current study, skips duplicates matching existing component names, remaps old `_id` / `optionId` / `templateId` / `actionTriggerId` references via an ID map, and replaces old variable/status/event IDs embedded inside `surveyJSON`.
- **EnrollNow Verification & Remediation**:
  - `StudyConfigurationService.importComponentsIntoExistingStudy()` validates that all category values in the incoming map are `List` instances containing `Map` objects before modifying state, throwing `InvalidStudyException` on malformed input.
  - Requires an existing `StudyRequirement` for `(tenantId, studyId)`, throwing `StudyNotFoundException` if absent.
  - Preserves all unselected categories in `StudyRequirement.configuration`.
  - Deduplicates items both within the incoming batch (`batchSeen`) and against existing study components by case-insensitive name matching.
  - Populates `idMap` for both newly generated component IDs and matched existing component IDs, and remaps dependent references across `events.statuses`, `scheduledActions.templateId`, `scheduledActions.actionTriggerId` (both top-level and nested `action.actionTriggerId`), `bulkTasks`, and `surveys.surveyJSON`.
  - Annotated with `@Transactional` so any runtime or validation exception rolls back atomically.

### 3.3 Export Compatibility
- **Legacy Behavior**:
  - Exports a JSON object containing `study` metadata, `study_grants`, and all configuration component arrays (`statuses`, `events`, `customVariables`, `surveys`, etc.).
- **EnrollNow Verification & Remediation**:
  - `StudyService.exportStudy()` outputs `version`, `exportedAt`, `study` (including `id`, `studyCode`, `name`, `studyName`, `longname`, `description`, `irbId`, `startDate`, `endDate`, `completionDate`, `studyURL`, `studyUrlLabel`, `allowParticipationInOtherStudies`, `customIdGenerationEnabled`, `prefix`, `sampleSize`), `study_grants` (`grantNum`, `grantAgency`), and merges all component lists from `StudyRequirement.configuration`.
  - Replaced the previous silent `catch (Exception ignored)` block with `throw new InvalidStudyException("Corrupted study configuration JSON: " + ex.getMessage())` so corrupted database JSON fails fast and visibly.

### 3.4 Authorization & Tenant Isolation
- **Verification & Remediation**:
  - `StudyService.updateStudyDetails()`, `exportStudy()`, and `importStudyComponents()` now enforce:
    1. Tenant-isolated lookup via `findStudyByIdOrCode(tenantId, studyId)` (`studyRepository.findByTenantIdAndId`), throwing `StudyNotFoundException` if the study belongs to another tenant.
    2. If `!canManageSiteAdmins`, `callerUserId == null` immediately throws `org.springframework.security.access.AccessDeniedException("Access denied: authenticated caller identity is required")`.
    3. For authenticated non-Site-Admin callers, `getStudyNavigationPermissions` is evaluated and requires `STUDY_SETTINGS_MANAGE` or `STUDY_ADMIN` permission on the target study, throwing `AccessDeniedException` otherwise.

### 3.5 Unsaved Changes Navigation Protection
- **Verification & Remediation**:
  - **Browser Refresh / Tab Close**: `StudySettingsDetails.tsx` attaches a `beforeunload` listener calling `e.preventDefault()` and setting `e.returnValue = ''` whenever `isDirty` is `true`.
  - **Submenu Switching**: `StudySettingsDetails.tsx` notifies `StudySettingsWorkspace.tsx` via `onDirtyChange(isDirty)`. `StudySettingsWorkspace.handleSubmenuSelect` prompts via `window.confirm` before switching submenus when `activeSubmenu === 'details' && isDetailsDirty`.
  - **Global Study Selection Change**: `StudySettingsDetails.tsx` tracks `prevStudyIdRef` and `isDirtyRef` and prompts via `window.confirm` when `studyId` changes while `isDirtyRef.current` is `true`.
  - **Failed Save Recovery**: If `studyApi.updateStudyDetails` rejects, `initialLoadedForm` is not updated, preserving all user edits and keeping `isDirty === true` so the user can retry saving.

---

## 4. Traceability Matrix

| Requirement / Feature | Legacy Ripple Source | EnrollNow Source | Automated Regression Tests | Status |
| :--- | :--- | :--- | :--- | :--- |
| Short Study Name (`<=15` chars, alphanumeric + spaces, unique per tenant) | `details.jsx:88-115` | `StudyService.java:736-750`, `StudySettingsDetails.tsx` | `StudyServiceTest`, `studySettingsDetails.test.tsx` | **PASS** |
| Recruitment Start/End Date Ordering | `details.jsx:140-165` | `StudyService.java:751-755`, `StudySettingsDetails.tsx` | `StudyServiceTest`, `studySettingsDetails.test.tsx` | **PASS** |
| Custom ID Toggle & Prefix Validation (`<=5` uppercase alphanumeric, unique per tenant) | `details.jsx:210-255`, `settings.js` | `StudyService.java:767-795`, `UpdateStudyDetailsRequest.java` | `StudyServiceTest.updateStudyDetails_withInvalidPrefixLength...`, `...DuplicatePrefix...` | **PASS** |
| Custom ID Sequence Generation (`PREFIX + 8-digit seq`) in Participant Flow | `generateCustomId.js`, `addParticipant.js:65-75` | `ParticipantRegistryService.java:408-420, 641-665, 1197-1207`, `StudyService.java:977-991` | `ParticipantRegistryServiceTest` (3 new tests), `StudyServiceTest` (2 new tests) | **PASS** |
| Incremental Component Import Modal & Selective Import | `IncrementalImport.jsx`, `studyImportAndExport.js:944-1450` | `StudyConfigurationService.java:536-938`, `StudySettingsDetails.tsx` | `StudyConfigurationServiceTest` (7 new tests), `studySettingsDetails.test.tsx` | **PASS** |
| Study Export & Corrupted Config Detection | `studyImportAndExport.js:25-120` | `StudyService.java:846-928` | `StudyServiceTest.exportStudy_withCorruptedConfiguration...`, `...returnsCompletePayload...` | **PASS** |
| Authorization & Tenant Isolation on Details / Export / Import | `studyImportAndExport.js`, Meteor publications | `StudyService.java:709-734, 847-867, 940-963` | `StudyServiceTest` (5 negative auth & cross-tenant tests) | **PASS** |
| Unsaved Changes Guards (Submenu, Study Switch, Browser Unload) | `details.jsx` router prompt | `StudySettingsDetails.tsx:175-205`, `StudySettingsWorkspace.tsx:37-46` | `studySettingsDetails.test.tsx` (`Unsaved Changes Guard Logic`) | **PASS** |
