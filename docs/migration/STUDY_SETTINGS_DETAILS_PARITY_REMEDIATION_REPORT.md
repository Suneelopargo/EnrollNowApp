# Study Settings → Details: Final Parity Remediation & Verification Report

## 1. Overview

This report documents all code remediations, architectural verifications, regression tests, and actual build/test command outputs completed during the final source-code verification pass for **Study Settings → Details**.

---

## 2. Issues Identified & Remediations Implemented

### Issue 1: Custom Participant ID Generation Not Consumed by Participant Creation / Enrollment Flow
- **Root Cause**: While `enrollnow.studies` (`V3__study_foundation.sql`) and `Study.java` already contained `prefix`, `custom_id_generation_enabled`, and `next_sequential_identifier`, `ParticipantRegistryService.assignStudy()` hardcoded `"SP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase()`, and `ParticipantRegistryService.createParticipant()` did not generate a study custom ID when a `studyId` was supplied.
- **Remediation**:
  - Exposed `customIdGenerationEnabled` and `prefix` in `StudyDetailsResponse.java`, `UpdateStudyDetailsRequest.java`, `StudyService.getStudyDetails()`, and `StudyService.updateStudyDetails()` with legacy validation (`<= 5` uppercase alphanumeric characters, unique per tenant via `StudyRepository.existsByTenantIdAndPrefixIgnoreCaseAndIdNot`).
  - Added `StudyService.generateNextCustomParticipantId(UUID tenantId, UUID studyId)` and `ParticipantRegistryService.generateStudyParticipantId(Study study)` implementing the exact legacy Ripple rule (`both/customIds/generateCustomId.js` & `both/customIds/settings.js`): increments `nextSequentialIdentifier` by 1 and formats `${PREFIX}${String.format("%08d", nextVal)}` (e.g., `ONCO00000001`).
  - Wired `ParticipantRegistryService.assignStudy()` and `ParticipantRegistryService.createParticipant()` to generate and persist the formatted custom ID on `StudyEnrollment.studyParticipantId` and create a corresponding `ParticipantIdentifier` (`identifierType = "STUDY_CUSTOM_ID"`).
- **Regression Tests**:
  - `ParticipantRegistryServiceTest.generateStudyParticipantId_whenCustomIdEnabled_generatesFormattedIdAndIncrements`
  - `ParticipantRegistryServiceTest.generateStudyParticipantId_whenCustomIdDisabled_generatesFallbackId`
  - `ParticipantRegistryServiceTest.assignStudy_withCustomIdEnabled_assignsFormattedIdAndCreatesIdentifier`
  - `StudyServiceTest.generateNextCustomParticipantId_whenEnabled_returnsFormattedIdAndIncrements`
  - `StudyServiceTest.generateNextCustomParticipantId_whenDisabled_returnsFallbackId`

### Issue 2: Incremental Component Import Validation, Deduplication & Reference Remapping
- **Root Cause**: `StudyConfigurationService.importComponentsIntoExistingStudy()` needed strict pre-persistence structural validation, `StudyNotFoundException` when a target study's requirement record is missing, deduplication both within the incoming batch and against existing study components, and complete ID reference remapping across top-level and nested `actionTriggerId` fields in `scheduledActions` as well as `surveyJSON` strings.
- **Remediation**:
  - Rewrote `StudyConfigurationService.importComponentsIntoExistingStudy()` with:
    - Pre-persistence structural validation verifying each category is a `List` of `Map` objects (throws `InvalidStudyException` otherwise).
    - Strict lookup via `studyRequirementRepository.findByTenantIdAndStudyId(tenantId, studyId).orElseThrow(() -> new StudyNotFoundException(...))`.
    - Deduplication within the incoming batch (`batchSeen`) and against existing components by case-insensitive name matching.
    - Full `idMap` population and reference remapping across `customVariables` (and `options`), `statuses`, `events`, `emailTemplates`, `textTemplates`, `scheduledActions` (`templateId`, top-level `actionTriggerId`, and `action.actionTriggerId`), `bulkTasks`, `studyGroups`, and `surveys` (`surveyJSON`).
    - Selective category updates preserving all unselected configuration categories intact.
- **Regression Tests**:
  - `StudyConfigurationServiceTest.importComponents_studyNotFound_throwsStudyNotFoundException`
  - `StudyConfigurationServiceTest.importComponents_emptyComponents_returnsZeroWithoutModifying`
  - `StudyConfigurationServiceTest.importComponents_malformedCategoryNotList_throwsInvalidStudyException`
  - `StudyConfigurationServiceTest.importComponents_selectiveImport_preservesExistingUnrelatedConfigurations`
  - `StudyConfigurationServiceTest.importComponents_batchDuplicateNames_deduplicatesGracefully`
  - `StudyConfigurationServiceTest.importComponents_duplicateAgainstExisting_reusesExistingIdWithoutDuplicate`
  - `StudyConfigurationServiceTest.importComponents_remapsDependentIdsInScheduledActionsAndSurveys`

### Issue 3: Silent Error Swallowing in Study Export
- **Root Cause**: `StudyService.exportStudy()` caught `Exception` when parsing `StudyRequirement.configuration` and ignored it silently, risking incomplete exports if stored JSON was corrupted.
- **Remediation**:
  - Replaced the silent catch block in `StudyService.exportStudy()` with `throw new InvalidStudyException("Corrupted study configuration JSON: " + ex.getMessage())`.
  - Added `studyName`, `prefix`, and `customIdGenerationEnabled` to the exported `study` object alongside `study_grants` and all component collections.
- **Regression Tests**:
  - `StudyServiceTest.exportStudy_withCorruptedConfiguration_throwsInvalidStudyException`
  - `StudyServiceTest.exportStudy_returnsCompletePayloadWithPrefixAndGrants`

### Issue 4: Null-Caller Authorization Bypass in Service Layer
- **Root Cause**: In `StudyService.updateStudyDetails()`, `exportStudy()`, and `importStudyComponents()`, the permission check was guarded by `if (!canManageSiteAdmins && callerUserId != null)`, allowing calls with `callerUserId == null` and `canManageSiteAdmins == false` to bypass authorization if invoked directly.
- **Remediation**:
  - Enforced that whenever `!canManageSiteAdmins`, a `null` `callerUserId` immediately throws `org.springframework.security.access.AccessDeniedException("Access denied: authenticated caller identity is required")`.
  - Verified that non-admin callers without `STUDY_SETTINGS_MANAGE` or `STUDY_ADMIN` are rejected with `AccessDeniedException`, and cross-tenant study IDs are rejected with `StudyNotFoundException`.
- **Regression Tests**:
  - `StudyServiceTest.updateStudyDetails_withNullCallerAndNotAdmin_throwsAccessDeniedException`
  - `StudyServiceTest.updateStudyDetails_withNonAdminAndNoManagePermission_throwsAccessDeniedException`
  - `StudyServiceTest.exportStudy_withNullCallerAndNotAdmin_throwsAccessDeniedException`
  - `StudyServiceTest.importStudyComponents_withNullCallerAndNotAdmin_throwsAccessDeniedException`
  - `StudyServiceTest.updateStudyDetails_crossTenant_throwsStudyNotFoundException`

### Issue 5: Unsaved Changes Protection When Switching Active Study
- **Root Cause**: While browser refresh (`beforeunload`) and Study Settings submenu switching (`StudySettingsWorkspace.tsx`) prompted on unsaved changes, changing the `studyId` prop directly on `StudySettingsDetails.tsx` reloaded study details without prompting.
- **Remediation**:
  - Added `prevStudyIdRef` and `isDirtyRef` tracking in `StudySettingsDetails.tsx` to prompt via `window.confirm` before loading a different study when `isDirty` is `true`.
- **Regression Tests**:
  - `studySettingsDetails.test.tsx` (`Unsaved Changes Guard Logic`: dirty detection and study-change confirmation prompt)

---

## 3. Files Modified & Created

### Backend (`enrollnow-study-service` & `enrollnow-participant-service`)
- `backend/enrollnow-study-service/src/main/java/com/enrollnow/study/repositories/StudyRepository.java`
- `backend/enrollnow-study-service/src/main/java/com/enrollnow/study/dtos/StudyDetailsResponse.java`
- `backend/enrollnow-study-service/src/main/java/com/enrollnow/study/dtos/UpdateStudyDetailsRequest.java`
- `backend/enrollnow-study-service/src/main/java/com/enrollnow/study/services/StudyService.java`
- `backend/enrollnow-study-service/src/main/java/com/enrollnow/study/services/StudyConfigurationService.java`
- `backend/enrollnow-study-service/src/main/java/com/enrollnow/study/controllers/StudyController.java`
- `backend/enrollnow-participant-service/src/main/java/com/enrollnow/participant/services/ParticipantRegistryService.java`
- `backend/enrollnow-study-service/src/test/java/com/enrollnow/study/services/StudyServiceTest.java`
- `backend/enrollnow-study-service/src/test/java/com/enrollnow/study/services/StudyConfigurationServiceTest.java` (New)
- `backend/enrollnow-study-service/src/test/java/com/enrollnow/study/controllers/StudyControllerTest.java`
- `backend/enrollnow-participant-service/src/test/java/com/enrollnow/participant/services/ParticipantRegistryServiceTest.java`

### Frontend (`frontend`)
- `frontend/shared/api/studyApi.ts`
- `frontend/shared/design-system/styles/_study.scss`
- `frontend/microfrontends/study/src/components/StudySettingsDetails.tsx`
- `frontend/microfrontends/study/src/components/StudySettingsWorkspace.tsx`
- `frontend/microfrontends/study/src/test/studySettingsDetails.test.tsx`

---

## 4. Actual Verification Command Outputs

### 4.1 Backend Unit Tests — `enrollnow-study-service`
**Command**:
```powershell
cmd.exe /c "D:\Softwares\apache-maven-3.9.16\bin\mvn.cmd test -f backend/pom.xml -pl enrollnow-study-service"
```
**Output**:
```text
[INFO] ---------------< com.enrollnow:enrollnow-study-service >----------------
[INFO] Building enrollnow-study-service 1.0.0-SNAPSHOT
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running com.enrollnow.study.controllers.StudyControllerTest
[INFO] Tests run: 17, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 4.778 s -- in com.enrollnow.study.controllers.StudyControllerTest
[INFO] Running com.enrollnow.study.controllers.StudyCopyAndImportControllerTest
[INFO] Tests run: 7, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.425 s -- in com.enrollnow.study.controllers.StudyCopyAndImportControllerTest
[INFO] Running com.enrollnow.study.services.StudyAccessServiceTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.594 s -- in com.enrollnow.study.services.StudyAccessServiceTest
[INFO] Running com.enrollnow.study.services.StudyConfigurationServiceTest
[INFO] Tests run: 7, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.254 s -- in com.enrollnow.study.services.StudyConfigurationServiceTest
[INFO] Running com.enrollnow.study.services.StudyCopyAndImportServiceTest
[INFO] Tests run: 10, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.337 s -- in com.enrollnow.study.services.StudyCopyAndImportServiceTest
[INFO] Running com.enrollnow.study.services.StudyServiceTest
[INFO] Tests run: 41, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.512 s -- in com.enrollnow.study.services.StudyServiceTest
[INFO]
[INFO] Results:
[INFO]
[INFO] Tests run: 86, Failures: 0, Errors: 0, Skipped: 0
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] Total time:  18.205 s
[INFO] ------------------------------------------------------------------------
```

### 4.2 Backend Unit Tests — `enrollnow-participant-service`
**Command**:
```powershell
cmd.exe /c "D:\Softwares\apache-maven-3.9.16\bin\mvn.cmd test -f backend/pom.xml -pl enrollnow-participant-service"
```
**Output**:
```text
[INFO] ------------< com.enrollnow:enrollnow-participant-service >-------------
[INFO] Building enrollnow-participant-service 1.0.0-SNAPSHOT
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running com.enrollnow.participant.controllers.ParticipantRegistryControllerTest
[INFO] Tests run: 11, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 4.665 s -- in com.enrollnow.participant.controllers.ParticipantRegistryControllerTest
[INFO] Running com.enrollnow.participant.services.ParticipantRegistryServiceTest
[INFO] Tests run: 20, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.715 s -- in com.enrollnow.participant.services.ParticipantRegistryServiceTest
[INFO] Running com.enrollnow.participant.services.ParticipantSpecificationsTest
[INFO] Tests run: 12, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.982 s -- in com.enrollnow.participant.services.ParticipantSpecificationsTest
[INFO] Running com.enrollnow.participant.services.RegistryExportServiceTest
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.025 s -- in com.enrollnow.participant.services.RegistryExportServiceTest
[INFO] Running com.enrollnow.participant.services.RegistrySavedSearchServiceTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.153 s -- in com.enrollnow.participant.services.RegistrySavedSearchServiceTest
[INFO]
[INFO] Results:
[INFO]
[INFO] Tests run: 49, Failures: 0, Errors: 0, Skipped: 0
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] Total time:  20.826 s
[INFO] ------------------------------------------------------------------------
```

### 4.3 Frontend Unit Tests — `enrollnow-study-mfe`
**Command**:
```powershell
npm test --workspace=enrollnow-study-mfe --prefix frontend
```
**Output**:
```text
> enrollnow-study-mfe@1.0.0 test
> vitest run

 RUN  v2.1.9 D:/ProjectsWorkSpace/ProjectCode/EnrollnowSpace/EnrollNowApp/frontend/microfrontends/study

 ✓ src/test/studyNavigation.test.tsx (13 tests) 36ms
 ✓ src/test/studySettingsDetails.test.tsx (11 tests) 21ms
 ✓ src/test/addStudyAndImport.test.ts (18 tests) 35ms
 ✓ src/test/study.test.ts (6 tests) 14ms
 ✓ src/test/studyModuleWorkflow.test.tsx (7 tests) 21ms

 Test Files  5 passed (5)
      Tests  55 passed (55)
   Start at  23:29:23
   Duration  2.50s
```

### 4.4 Frontend Monorepo Typecheck
**Command**:
```powershell
npm run typecheck --prefix frontend
```
**Output**:
```text
> enrollnow-frontend-monorepo@1.0.0 typecheck
> npm run typecheck --workspaces --if-present

> @enrollnow/shared@1.0.0 typecheck
> tsc --noEmit
...
> enrollnow-study-mfe@1.0.0 typecheck
> tsc --noEmit
...
(All 12 workspaces exited with code 0)
```

### 4.5 Frontend Production Build — `enrollnow-shell`
**Command**:
```powershell
npm run build --workspace=enrollnow-shell --prefix frontend
```
**Output**:
```text
> enrollnow-shell@1.0.0 build
> tsc && vite build

vite v6.4.5 building for production...
transforming...
✓ 17379 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                              0.84 kB │ gzip:   0.39 kB
...
✓ built in 35.32s
```
