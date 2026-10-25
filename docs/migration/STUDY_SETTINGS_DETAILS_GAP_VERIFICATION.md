# Study Settings → Details: Legacy Parity Gap Verification Matrix

## 1. Executive Summary

This document establishes the verified gap analysis between the legacy Ripple application (`ripple-develop`) and the current EnrollNow application (`EnrollNowApp`) for the **Study Settings → Details** workflow.

The analysis confirms four major functional and architectural gaps between the legacy application and the current EnrollNow implementation:
1. **Custom ID Autogeneration and Study Prefix**: The legacy system provides full support for custom sequential participant ID generation with a required unique prefix (maximum 5 alphanumeric characters, auto-capitalized). The EnrollNow database schema and entity (`Study.java`) contain the corresponding columns (`custom_id_generation_enabled`, `prefix`), but these were omitted from the API DTOs, service validation/update layer, and React form UI.
2. **Component Import Scope Defect (Incremental Import)**: In legacy Ripple, uploading a JSON configuration within **Study Settings → Details** opens an `IncrementalImport` interface that imports selected study components (surveys, custom variables, statuses, email/text templates, contact outcomes, contact relationships) directly into the **current active study**. In EnrollNow, the upload button incorrectly routed to `/api/v1/studies/import`, which attempts to instantiate a completely new study, violating user intent and creating unwanted duplicates.
3. **Export Payload Parity**: Legacy Ripple exports the study configuration alongside all subordinate entities (`customVariables`, `statuses`, `events`, `templates`, `surveys`, `scheduledActions`). EnrollNow's export endpoint previously returned only basic metadata and grants, ignoring the study's existing component requirements stored in `StudyRequirement`.
4. **Navigation Guard Unsaved-Changes Protection**: Legacy Ripple employs `useNavigationGuard` with `guardAppNav: true` to prevent data loss when navigating away from dirty form state. EnrollNow previously only guarded intra-form actions, leaving workspace submenu transitions and window unload events unprotected.

---

## 2. Gap Verification Matrix

| Feature / Capability | Legacy Ripple Implementation | Current EnrollNow Implementation | Verified Gap | Code Evidence | Required Parity Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Custom ID Autogeneration & Prefix** | `details.jsx` lines 122–148, `both/customIds/settings.js`, `updateStudyDetails.js`: Checkbox for `customIdGenerationEnabled`. When enabled, presents `prefix` input (max 5 uppercase alphanumeric chars, unique across studies). If disabled, `prefix` is cleared. | Database schema `enrollnow.studies` and `Study.java` have `prefix` and `custom_id_generation_enabled`. `StudyDetailsResponse`, `UpdateStudyDetailsRequest`, `StudyService`, and `StudySettingsDetails.tsx` omit these fields entirely. | **High**: Field values cannot be viewed, configured, or persisted. Disables custom participant ID generation logic. | `ripple/client/components/authenticated/studyPages/settings/details.jsx`<br>`Study.java:43-44,67-68`<br>`StudyDetailsResponse.java`<br>`UpdateStudyDetailsRequest.java` | 1. Expose `customIdGenerationEnabled` and `prefix` in DTOs.<br>2. Add tenant-scoped uniqueness and regex validation in `StudyService`.<br>3. Add checkbox and uppercase text input with validation in `StudySettingsDetails.tsx`. |
| **Study Component Import (Incremental Import)** | `details.jsx` lines 50–74, `IncrementalImport.jsx`: File upload triggers modal to select specific components (surveys, custom variables, statuses, email templates, text templates) to import into the **current study** via `importComponentFromJSONFile`. | `StudySettingsDetails.tsx` lines 344–348: Calls `studyApi.importStudyJson(...)` targeting `POST /api/v1/studies/import`, which creates an entirely **new** study instead of importing into the active study. | **Critical**: Uploading a file in Study Details corrupts the workspace state by attempting to create a new study instead of enriching the existing study. | `ripple/client/components/authenticated/studyPages/settings/IncrementalImport.jsx`<br>`ripple/server/studies/studyImportAndExport.js:944`<br>`StudySettingsDetails.tsx:344` | 1. Implement backend endpoint `POST /api/v1/studies/{studyId}/import-components` in `StudyController` & `StudyService`.<br>2. Add `importStudyComponents` in `studyApi.ts`.<br>3. Render `IncrementalImport` modal in `StudySettingsDetails.tsx` with component selectors. |
| **Study Export Full Fidelity** | `studyImportAndExport.js:833`: `exportStudyToJSONFile` exports `study`, `study_grants`, `customVariables`, `statuses`, `events`, `templates`, `surveys`, `scheduledActions`, and `requirements`. | `StudyService.java:791-830`: `exportStudy` only outputs `version`, `study`, and `study_grants`. Disregards configuration stored in `StudyRequirement`. | **Medium**: Exported studies cannot be fully restored or imported into other studies due to missing component metadata. | `ripple/server/studies/studyImportAndExport.js:833-938`<br>`StudyService.java:791-830` | Enrich `exportStudy` in `StudyService.java` to read `studyRequirementRepository` configuration and include all study components in the export map. |
| **Unsaved Changes Navigation Protection** | `details.jsx:22`: `useNavigationGuard({ isDirty, onSave, onDiscard, guardAppNav: true })` prompts user with modal or confirmation dialog before leaving screen if form has dirty edits. | `StudySettingsDetails.tsx`: Dirty state only toggles Save/Discard buttons. Clicking other submenus in `StudySettingsWorkspace.tsx` or closing the browser window causes silent loss of uncommitted edits. | **Medium**: Unintentional data loss when switching submenus or navigating away. | `ripple/client/components/authenticated/studyPages/settings/details.jsx:22`<br>`StudySettingsWorkspace.tsx:38-249` | 1. Attach `beforeunload` event handler in `StudySettingsDetails.tsx` when `isDirty`.<br>2. Support dirty check callback in `StudySettingsWorkspace.tsx` when switching submenus. |
| **Prefix Validation & Normalization** | `updateStudyDetails.js:29-37`: Prefix is forced uppercase, max length 5, regex `^[A-Z0-9]+$`, and checked for uniqueness among non-archived studies. | No validation exists in backend DTOs or service because prefix was not processed. | **Medium**: Without validation, invalid or duplicated prefixes could be submitted. | `both/customIds/settings.js`<br>`updateStudyDetails.js:33` | Add `@Size(max = 5)` and regex validation to `UpdateStudyDetailsRequest`, uppercase normalization, and uniqueness check in `StudyService`. |
| **Date Consistency & Normalization** | `updateStudyDetails.js:52-54`: Ensures `recruitmentEndDate >= recruitmentStartDate`. Completion date normalized to UTC date without time skew. | `StudyService.java:740-744`: Validates `recruitmentEndDate` not before `recruitmentStartDate`. Frontend formats as ISO YYYY-MM-DD. Parity confirmed, maintained. | **Low**: Consistent between legacy and EnrollNow. | `StudyService.java:740-744`<br>`StudySettingsDetails.tsx:213-217` | Maintain existing validation. |

---

## 3. Targeted Remediation Plan

1. **Backend DTO & Persistence Layer**:
   - Add `customIdGenerationEnabled` and `prefix` to `StudyDetailsResponse.java`.
   - Add `customIdGenerationEnabled` and `@Size(max = 5) @Pattern(regexp = "^[A-Za-z0-9]*$") prefix` to `UpdateStudyDetailsRequest.java`.
   - Add prefix uniqueness query method to `StudyRepository.java`: `existsByTenantIdAndPrefixIgnoreCaseAndIdNot(UUID tenantId, String prefix, UUID id)`.
   - In `StudyService.java`:
     - Expose `customIdGenerationEnabled` and `prefix` in `getStudyDetails`.
     - In `updateStudyDetails`: handle enabled toggle; enforce prefix uppercase, non-empty when enabled, regex, and tenant uniqueness; clear prefix if disabled.
     - Add `importStudyComponents(UUID tenantId, String studyId, Map<String, Object> components, UUID callerUserId, boolean canManageSiteAdmins)` to safely import components into the target study's `StudyRequirement`.
     - Enrich `exportStudy` to include `StudyRequirement` configuration.
   - In `StudyController.java`:
     - Expose `POST /api/v1/studies/{studyId}/import-components`.

2. **Frontend Client & Microfrontend Layer**:
   - In `frontend/shared/api/studyApi.ts`:
     - Add `customIdGenerationEnabled` and `prefix` to `StudyDetails` and `UpdateStudyDetailsPayload`.
     - Add `importStudyComponents(studyId, components)`.
   - In `StudySettingsDetails.tsx`:
     - Add form fields: "Enable Custom ID Autogeneration" checkbox and conditional "Study Prefix" text input.
     - Add uppercase auto-transformation, 5-char limit, and validation error messages for prefix.
     - Replace incorrect new-study import with legacy-style `IncrementalImport` modal showing parsed components (Surveys, Statuses, Custom Variables, Templates) and checkboxes for category and individual component selection.
     - Add browser `beforeunload` event protection when `isDirty`.
   - In `StudySettingsWorkspace.tsx`:
     - Guard submenu navigation if Details component has unsaved changes.

3. **Verification**:
   - Backend unit and integration tests (`StudyServiceTest`, `StudyControllerTest`).
   - Frontend unit tests (`studySettingsDetails.test.tsx`).
   - Clean compilation and typecheck.
