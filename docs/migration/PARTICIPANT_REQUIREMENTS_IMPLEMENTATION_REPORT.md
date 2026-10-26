# EnrollNow — Participant Requirements: Implementation Report

## 1. Executive Summary

This report documents the end-to-end architecture, implementation, and verification of the **Study Settings → Participants → Requirements** module and its dynamic integration into the **Participant Registry** search and filter engine within EnrollNow.

The legacy Ripple application (`ripple-develop`) implemented participant study requirements across multiple Meteor collections (`study_requirements`, `groups`, `gender_groups`, `custom_variables`, `study_milestones`, `contact_relationships`, `contact_outcomes`) and tightly coupled client templates (`requirements.jsx`, `custom-variables/`, `registry-filter-options.js`). In EnrollNow, this functionality has been modernized into a cohesive, secure, multi-tenant cloud-native architecture:

1. **Backend (`enrollnow-study-service`)**:
   - Single source of truth using PostgreSQL `study_requirements` (JSONB configuration + sample size) and `study_milestones` relational table.
   - Type-safe DTOs for milestones, demographic groups (with age ranges and nested gender groups), custom variables (with options and flags), variable groups, sortable layout items, and contact taxonomies.
   - Comprehensive CRUD APIs in `StudyController` and `StudyConfigurationService` with strict tenant isolation, authenticated caller resolution, and `STUDY_SETTINGS_MANAGE` role-based access control.
2. **Backend (`enrollnow-participant-service`)**:
   - Dynamic custom variable filter metadata endpoint (`GET /api/v1/registry/filter-metadata`).
   - JPA Criteria and in-memory evaluation supporting numeric comparisons (`<, >, =, between, not between`), date evaluation, categorical multi-select options matching, and presence operators (`has any value`, `has no value`) across participant custom variables.
3. **Frontend Microfrontends (`study` & `participant`)**:
   - Responsive, accessible React/TypeScript `StudySettingsRequirements.tsx` covering all 6 functional legacy sections.
   - Replaced static placeholder routing in `StudySettingsWorkspace.tsx` with dirty tracking and unsaved change safeguards.
   - Central design system styling in `_study.scss`.
   - Dynamic custom filter registration in `filterMetadata.ts` and data-type-aware rendering in `FilterCard.tsx` and `RegistryDashboard.tsx`.

---

## 2. Architectural Design & Entity Models

```
+--------------------------------------------------------------------------------------------------+
|                                        FRONTEND LAYER                                            |
|                                                                                                  |
|   +------------------------------------+          +------------------------------------------+   |
|   |    enrollnow-study-mfe             |          |       @enrollnow/mfe-participant         |   |
|   |  - StudySettingsWorkspace.tsx      |          |  - RegistryDashboard.tsx                 |   |
|   |  - StudySettingsRequirements.tsx   |          |  - LeftFilterPanel.tsx / FilterCard.tsx  |   |
|   |  - _study.scss (Shared Design)     |          |  - filterMetadata.ts (Dynamic Registry)  |   |
|   +-----------------+------------------+          +--------------------+---------------------+   |
|                     |                                                  |                         |
+---------------------|--------------------------------------------------|-------------------------+
                      | REST / JSON                                      | REST / JSON
                      v                                                  v
+--------------------------------------------------------------------------------------------------+
|                                        BACKEND SERVICES                                          |
|                                                                                                  |
|   +------------------------------------+          +------------------------------------------+   |
|   |    enrollnow-study-service         |          |       enrollnow-participant-service      |   |
|   |  - StudyController.java            |          |  - ParticipantRegistryController.java    |   |
|   |  - StudyConfigurationService.java  |          |  - ParticipantRegistryService.java       |   |
|   |  - StudyRequirementRepository.java |          |  - ParticipantSpecifications.java        |   |
|   |  - StudyMilestoneRepository.java   |          |  - StudyRequirementRepository (Injected) |   |
|   +-----------------+------------------+          +--------------------+---------------------+   |
|                     |                                                  |                         |
+---------------------|--------------------------------------------------|-------------------------+
                      | JPA / JDBC                                       | JPA / JDBC
                      v                                                  v
+--------------------------------------------------------------------------------------------------+
|                                       POSTGRESQL DATABASE                                        |
|                                                                                                  |
|   - study_requirements (id, tenant_id, study_id, sample_size, configuration JSONB)               |
|   - study_milestones (id, tenant_id, study_id, milestone_date, participant_target)               |
|   - participants (id, tenant_id, site_id, first_name, last_name, custom_attributes TEXT)         |
+--------------------------------------------------------------------------------------------------+
```

---

## 3. Detailed Component Breakdown

### 3.1 General Sample Requirements & Milestones
- **Sample Size (N)**:
  - Backed by `study_requirements.sample_size` integer column and `StudyRequirementsResponse.sampleSize`.
  - Non-negative integer validation with clean empty-value handling.
- **Recruitment Milestones**:
  - Direct persistence into `study_milestones` table.
  - Endpoints:
    - `POST /api/v1/studies/{studyId}/milestones`: creates milestone with date validation (`YYYY-MM-DD`) and participant target > 0.
    - `PUT /api/v1/studies/{studyId}/milestones/{milestoneId}`: updates date or participant target.
    - `DELETE /api/v1/studies/{studyId}/milestones/{milestoneId}`: deletes milestone safely.
  - Sorted chronologically by milestone date.
  - UI includes confirmation modal safeguard before deletion.

### 3.2 Age Requirements
- Supported operations:
  - Age group creation with name, target sample size (N), and range boundaries (`minAge` and `maxAge` in years).
  - Inline editing of sample targets.
  - Deletion with confirmation safeguard.
- Backwards compatibility:
  - Dual parser supports both EnrollNow JSON format (`label`, `sampleSize`, `ageRange: {min, max}`) and legacy Ripple format (`name`, `sample`, `minAge`, `maxAge`).

### 3.3 Sex / Gender Requirements
- Supported operations:
  - Predefined and custom sex/gender categories (`Male`, `Female`, `Other`, `Unspecified`, or study-specific).
  - Target sample quotas per group.
  - Dual parser supports top-level `genderGroups` and unified `studyGroups` with `defaultCategoryName: "sex"`.

### 3.4 Ethnic & Racial Requirements with Nested Gender Targets
- Supported operations:
  - Configurable ethnicity groups (e.g., `Hispanic or Latino`, `Not Hispanic or Latino`).
  - Configurable race groups (e.g., `White`, `Black or African American`, `Asian`, `American Indian`, `Pacific Islander`, `Multi-racial`).
  - Individual target quotas per group.
  - **Nested Gender Sub-Targets**: Each ethnic or racial group allows specifying breakdown participant targets by gender (`Male`, `Female`, `Other`).

### 3.5 Custom Protocol Variables & Variable Groups
- **Variable Types**:
  - `single` (Single-select dropdown)
  - `multi` (Multi-select checkboxes)
  - `short` (Short text input)
  - `long` (Multi-line text area)
  - `number` (Numeric input)
  - `date` (Calendar date `YYYY-MM-DD`)
  - `dateTime` (Date & time picker)
- **Variable Options**:
  - Dynamic option builder for single and multi-select variables with label and value management.
- **Convert to Multi-Select**:
  - One-click transformation for single-select dropdowns into multi-select variables without losing options.
- **Security & Privacy Flags**:
  - `isGlobal`: marks variable as global across all tenant studies in Registry.
  - `isBlind`: marks variable as double-blind (masked from unauthorized coordinators).
- **Variable Groups**:
  - Create, rename, and delete variable groups.
  - Assign variables into groups or return to ungrouped pool.
  - Safe group deletion: un-groups child variables without deleting the underlying variables.
- **Layout & Reordering**:
  - Move Up / Move Down buttons for groups and variables.
  - Persisted into `customVariableLayout` in study configuration.
  - Reordering fallback automatically handles newly added or ungrouped variables.
- **Search & Filtering**:
  - Real-time client-side search input filters visible custom variables by name and type.

### 3.6 Contact Taxonomy (Relationships & Outcomes)
- **Contact Relationships**:
  - Customizable relationship labels (e.g., `Mother`, `Father`, `Guardian`, `Self`, `Spouse`, `Other`).
  - Add and delete with confirmation safeguard.
- **Contact Outcomes**:
  - Customizable call/contact outcome labels (e.g., `Participant Added`, `Call Completed`, `Voicemail Left`, `Email Sent`, `Other`).
  - Add and delete with confirmation safeguard.

### 3.7 Participant Registry Dynamic Custom Variable Integration
- **Backend Metadata Resolution & Deterministic Conflict Handling**:
  - `GET /api/v1/registry/filter-metadata`: Scans tenant study requirements with deterministic scoping:
    - In study context (`studyId != null`), returns only global custom variables and active study variables.
    - Global variables are authoritative tenant-wide and can never be overridden or shadowed by study-specific variables.
    - In tenant-wide context (`studyId == null`), merges identically named and typed variables, while disambiguating conflicting types with study name attribution.
    - Handles malformed configuration safely with structured logging and without exposing sensitive data.
- **Filter Rule Validation**:
  - `ParticipantRegistryService.validateFilterRules`:
    - Checks that requested filter fields exist in authorized metadata.
    - Validates operator compatibility with declared field data types (`validateOperatorForFieldType`).
    - Enforces numeric and date range boundaries (`min <= max`) and non-empty boundary values.
    - Returns `HTTP 400 Bad Request` with descriptive messaging for invalid rules, preventing invalid queries.
- **Type-Safe Query Execution (PostgreSQL JSONPath & JPA)**:
  - `ParticipantSpecifications.java`:
    - Replaced vulnerable whole-string matching with PostgreSQL `jsonb_path_exists` targeting `$.variables[*] ? ((@.id == "target" || @.name == "target") && ...)`.
    - Zero cross-variable false positive leakage: evaluation strictly isolates the target variable item inside the `variables` array.
    - Type-safe operations:
      - Strict equality (`@.value == "val"`) and inequality (`!exists(...)`).
      - Numeric comparisons and ranges (`@.value.double() > num`, `< num`, `>= low && <= high`).
      - Date and datetime comparisons (`@.value >= "..." && @.value <= "..."`).
      - Categorical multi-select matching with disjunctions (`@.value == "A" || @.value == "B"`).
      - Presence checks (`assigned` / `not_assigned`).
      - Text contains with case-insensitive regex flag (`like_regex "..." flag "i"`).
    - Escapes JSONPath strings (`\\`, `\"`) to guarantee safe handling of special characters.
    - Unsupported or invalid custom rules return JPA disjunctions (`cb.disjunction()`), ensuring unsupported filters never become unrestricted queries.
  - `ParticipantRegistryService.java`:
    - In-memory `getFieldValue` and `applyCustomRule` parse `ParticipantVariableDto` by exact ID/name match.
    - Accurately evaluates numeric bounds, date comparisons, and multi-select comma-separated values.
    - Invalid ranges return `false` preventing unrestricted in-memory matches.
- **Frontend Registry UI**:
  - `filterMetadata.ts`: registers dynamic filter fields and provides type-aware operator resolution (`ALL_NUMERIC_OPERATORS`, `ALL_DATE_OPERATORS`, `CATEGORICAL_OPERATORS`, plus presence operators `has any value` / `has no value`).
  - `FilterCard.tsx`: populates filter field dropdown from `getAllFilterFields()`, automatically adapts input controls (date picker, numeric input, multi-select badges) based on variable type.
  - `RegistryDashboard.tsx`: automatically fetches dynamic filter metadata on mount and on queue refresh.

---

## 4. Security & Tenant Isolation

1. **Fail-Closed Authentication & Caller Resolution**:
   - Eliminated production fallbacks to hardcoded `DEFAULT_TENANT_ID` and `DEFAULT_USER_ID`.
   - Missing authenticated caller identity throws `InsufficientAuthenticationException` (401/403).
   - Cross-tenant requests throw `AccessDeniedException` (403).
2. **Tenant Scoping**:
   - Every API endpoint requires an authenticated caller identity and enforces tenant boundary validation via `SiteAuthorizationService.requireTenantMatch(tenantId)`.
   - All repository queries filter by `tenantId`.
3. **Permission Checks**:
   - Modifying study requirements or milestones requires `STUDY_SETTINGS_MANAGE` permission or `STUDY_ADMIN` role or Site Admin authority.
   - Read-only users cannot mutate requirements; mutation controls in the UI are disabled or hidden.
4. **Double-Blind Protection**:
   - `isBlind` flag persists in custom variable definitions, enabling downstream blind masking in participant views.

---

## 5. Verification & Test Execution Results

All automated test suites were executed directly against the workspace codebase.

### 5.1 Backend Verification
- **`enrollnow-study-service`**:
  - Command: `mvn -f backend/pom.xml test -pl enrollnow-study-service`
  - Result: **110 tests passed**, 0 failures, 0 errors, 0 skipped.
  - Includes comprehensive tests for:
    - `getStudyRequirements_retrievesAllSectionsCorrectly`
    - `updateStudyRequirements_persistsAllSectionsCorrectly`
    - `milestoneManagement_addUpdateDelete`
- **`enrollnow-participant-service`**:
  - Command: `mvn -f backend/pom.xml test -pl enrollnow-participant-service`
  - Result: **65 tests passed**, 0 failures, 0 errors, 0 skipped.
  - Includes targeted tests for:
    - `getParticipants_rejectsUnauthenticatedAccess`
    - `getParticipants_rejectsMalformedCustomFiltersJson`
    - `buildSpecification_preventsCrossVariableCollision`
    - `buildSpecification_handlesCustomNumericGreaterThanLessThanBetween`
    - `buildSpecification_handlesCustomDateComparisons`
    - `buildSpecification_handlesCustomCategoricalMultiSelect`
    - `buildSpecification_handlesSafeJsonKeysWithSpecialCharacters`
    - `buildSpecification_unsupportedOrInvalidCustomRuleReturnsDisjunction`
    - `getFilterMetadata_resolvesGlobalVariablesAuthoritatively`
    - `getFilterMetadata_studySpecificContext_onlyReturnsGlobalsAndTargetStudyVariables`
    - `getFilterMetadata_resolvesConflictingStudyVariablesDeterministically`
    - `getFilterMetadata_handlesMalformedJsonGracefully`
    - `validateFilterRules_acceptsValidRules`
    - `validateFilterRules_rejectsUnknownField`
    - `validateFilterRules_rejectsUnsupportedOperatorForFieldType`
    - `validateFilterRules_rejectsInvalidNumericAndDateRanges`

### 5.2 Frontend Verification
- **Study Microfrontend (`enrollnow-study-mfe`)**:
  - Command: `npm --prefix frontend/microfrontends/study run typecheck` -> **Passed** (0 errors).
  - Command: `npm --prefix frontend/microfrontends/study test`
  - Result: **8 test files passed (81 tests)**, 0 failures.
  - Includes suite: `studySettingsRequirements.test.tsx` (verifying requirements rendering, workspace navigation integration, and submenus preservation).
- **Participant Microfrontend (`@enrollnow/mfe-participant`)**:
  - Command: `npm --prefix frontend/microfrontends/participant run typecheck` -> **Passed** (0 errors).
  - Command: `npm --prefix frontend/microfrontends/participant test`
  - Result: **1 test file passed (29 tests)**, 0 failures.
  - Includes tests for dynamic custom variable metadata registration, operator adaptation, presence operators, and boundary validations.
- **Frontend Monorepo Typecheck**:
  - Command: `npm --prefix frontend run typecheck`
  - Result: **Passed cleanly across all 13 workspaces**.
- **Production Build**:
  - Command: `npm --prefix frontend run build`
  - Result: **Vite production build succeeded** (17,383 modules transformed, bundle emitted into `dist/`).
