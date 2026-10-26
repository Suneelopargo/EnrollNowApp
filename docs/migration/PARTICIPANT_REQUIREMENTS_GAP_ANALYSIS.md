# EnrollNow — Participant Requirements: Gap Analysis

## 1. Overview and Assessment Methodology

This gap analysis compares the legacy Ripple **Study Settings → Participants → Requirements** implementation against the current EnrollNow codebase across the database schema, backend services, REST APIs, frontend components, and Registry integration.

Each capability is classified as:
- **PASS**: Fully implemented, verified against backend, and functionally equivalent to legacy Ripple.
- **PARTIAL**: Partially implemented or missing specific operational behaviors.
- **MISSING**: Not implemented in the current EnrollNow system.
- **INCORRECT**: Implementation diverges from supported legacy business rules.
- **UNVERIFIED**: Evidence insufficient to establish functional parity.

---

## 2. Requirements Baseline Gap Matrix

| ID | Capability | Legacy Behavior | Existing EnrollNow Behavior | Source Evidence | Gap Classification | Remediation Plan |
|---|---|---|---|---|---|---|
| **REQ-01** | Navigation Submenu & Workspace Shell | Selecting "Requirements" renders the participant requirements configuration screen. | Selecting `participants_requirements` renders a placeholder message: "This Study Settings section is scheduled for complete migration in an upcoming phase." | `StudySettingsWorkspace.tsx:269-288` | **MISSING** | Implement dedicated `StudySettingsRequirements.tsx` and mount inside `StudySettingsWorkspace.tsx`. |
| **REQ-02** | General Sample Size (N) Persistence | Persisted in `StudyRequirements.sampleSize` and reloaded per study. | `StudyRequirement` entity has `sampleSize` column, and `createDefaultConfiguration` sets 100, but no dedicated endpoint or UI exists to view/update it. | `StudyRequirement.java:25`, `StudySettingsWorkspace.tsx` | **PARTIAL** | Expose sample size in Requirements API DTO, service methods, and UI input with debounced persistence. |
| **REQ-03** | Milestone Management (CRUD) | List, add, update (date & participant target), delete with confirmation dialog. | `StudyMilestone` entity and `StudyMilestoneRepository` exist in PostgreSQL database (`V3__study_foundation.sql`), but no service methods, controller endpoints, or UI controls exist. | `StudyMilestone.java`, `StudyMilestoneRepository.java` | **MISSING** | Add milestone lifecycle methods in `StudyService` and endpoints in `StudyController`, plus responsive UI with confirmation modal. |
| **REQ-04** | Age Groups Configuration | Create, edit label, sample size, age range (`min` and `max`), delete age groups. | Stored in `StudyRequirement.configuration` JSONB (`studyGroups`), but no dedicated endpoints or UI components exist. | `StudyConfigurationService.java:75-81`, `requirements.jsx:1108-1128` | **MISSING** | Support demographic group CRUD in `StudyService` JSONB configuration and render responsive Age Groups section. |
| **REQ-05** | Sex/Gender Quota Groups | List default groups (Male, Female, Other), edit labels, quotas, optional age ranges. | Initialized in default configuration JSONB (`studyGroups`), but cannot be modified, deleted, or supplemented. | `StudyConfigurationService.java:83-90` | **PARTIAL** | Implement full CRUD for gender groups including label, sample size, and age range inputs. |
| **REQ-06** | Ethnic & Racial Categories | List NIH/Census groups, edit quotas, age ranges, and add nested gender groups. | Default groups seeded in JSONB (`studyGroups`), but no nested gender group support or UI management exists. | `StudyConfigurationService.java:92-108`, `requirements.jsx:1159-1216` | **PARTIAL** | Support ethnicity and race group editing, deletion, addition, and nested gender groups (`genderGroups`). |
| **REQ-07** | Custom Variable Creation & Editing | Supports 7 types: `single`, `multi`, `short`, `long`, `number`, `date`, `dateTime`. Enforces unique names. | Default configuration initializes empty `customVariables` array in JSONB, but no UI or API exists to manage them. | `StudyConfigurationService.java:125`, `custom-variable.jsx:650-658` | **MISSING** | Implement custom variable CRUD with type selection, name validation, and JSONB persistence. |
| **REQ-08** | Variable Options Management | For `single` and `multi` select types: add, edit option label, delete option, pull from participants. | No option management UI or service logic exists in EnrollNow. | `custom-variable.jsx:376-412`, `collections/custom_variables.js:1035-1256` | **MISSING** | Implement option addition, editing, and removal controls for categorical custom variables. |
| **REQ-09** | Convert Single Select to Multi Select | Action converts `single` to `multi` select irreversibly with confirmation. | Not implemented in EnrollNow. | `custom-variable.jsx:414-473` | **MISSING** | Add convert-to-multi action in UI and service handler. |
| **REQ-10** | Blind Variable Flag (`isBlind`) | Study admins can toggle `isBlind` to hide variable value from unauthorized roles. | `ParticipantVariableDto` has no blind flag; configuration JSONB does not track it. | `custom-variable.jsx:475-502` | **MISSING** | Add `isBlind` toggle and persist in custom variable definition. |
| **REQ-11** | Global Variable Flag (`isGlobal`) & Attachment | Global variables can be attached to multiple studies or made global. | Global custom variables are not modeled or exposed across studies. | `custom-variable.jsx:504-572`, `collections/custom_variables.js:918-978` | **MISSING** | Implement global custom variables catalog and modal to attach global variables to the current study. |
| **REQ-12** | Variable Groups | Group creation, rename, delete (empty safeguard), and default collapsed toggle for participant card. | Default configuration has empty `variableGroups` list, but no endpoints or UI exist. | `variable-group-block.jsx:1-355` | **MISSING** | Implement variable groups with rename, empty-group deletion protection, and collapse toggle. |
| **REQ-13** | Variable Assignment to Groups | Variables can be assigned to a group, moved between groups, or unassigned to root layout. | Not implemented in EnrollNow. | `assign-variable-to-group-modal.jsx`, `collections/custom_variables.js:353-457` | **MISSING** | Implement group assignment modal/dropdown and update group `members` and layout. |
| **REQ-14** | Custom Variable Layout & Reordering | Sortable layout for root variables and groups, and member ordering inside groups. | No layout model or ordering exists in EnrollNow study configuration. | `Studies.customVariableLayout`, `requirements.jsx:748-762` | **MISSING** | Implement sortable layout ordering in backend configuration and accessible reordering controls in frontend. |
| **REQ-15** | Contact Relationships & Outcomes Taxonomy | Team-scoped list of contact relationships and outcomes with "Other" handling. | No contact relationship or outcome taxonomy endpoints or settings exist in EnrollNow. | `requirements.jsx:1480-1563`, `collections/contact_relationships.js` | **MISSING** | Add contact outcomes and relationships management to Requirements UI and backend configuration. |
| **REQ-16** | Registry Dynamic Custom Variable Discovery | Registry fetches global custom variables and displays them as `custom_${id}` ("Custom - Name"). | Registry filter fields are completely static (`REGISTRY_FILTER_FIELDS`). Custom variables are not loaded dynamically. | `filterMetadata.ts:87-189`, `registry.jsx:1284-1298` | **MISSING** | Add backend endpoint to retrieve filter metadata for authorized context, and dynamically inject custom variable options into Registry. |
| **REQ-17** | Registry Variable-Type-Aware Controls | Categorical variables display option chips; numeric display number; date display date/range. | For any `custom_` field, `FilterCard` defaults to plain text input. | `filterMetadata.ts:194-201`, `FilterCard.tsx:185-194` | **INCORRECT** | Enhance `FilterCard` to resolve dynamic field metadata and render proper control (options chips, date, number, text). |
| **REQ-18** | Registry Dynamic Operators | Operators matched to variable type (e.g., number gets `<, >, between`; categorical gets `equal, not equal`). | `getOperatorsForField` for `custom_` hardcoded to only 4 operators (`equal to`, `not equal to`, `has any value`, `has no value`). | `filterMetadata.ts:80-85, 207-209` | **INCORRECT** | Update `getOperatorsForField` to return type-specific operators based on the dynamic variable definition. |
| **REQ-19** | Registry Search Query Execution for Custom Variables | Database and in-memory queries evaluate participant custom attributes by ID, type, and operator. | Previously used whole-string matching (`LIKE '%val%'`) in `ParticipantSpecifications` vulnerable to cross-variable collisions. In-memory `getFieldValue` returned empty string. | `ParticipantSpecifications.java`, `ParticipantRegistryService.java` | **PASS (Remediated)** | Implemented PostgreSQL JSONPath (`jsonb_path_exists`) evaluating variable entries specifically by ID/name in `$.variables[*]`. In-memory evaluation parses `ParticipantVariableDto` by ID/name with type-safe numeric, date, and categorical matching. |
| **REQ-20** | Registry Saved Searches Compatibility | Saved searches store `custom_${id}` and gracefully handle renamed or deleted variables. | `RegistrySavedSearch` stores filters, but does not validate against dynamic custom variables. | `RegistrySavedSearchService.java`, `registry.jsx:1305-1315` | **PASS (Remediated)** | Implemented strict validation of filter rules (`validateFilterRules`) ensuring fields exist, operators are valid for field types, range boundaries are valid (`min <= max`), and unsupported rules safely return disjunctions (`1=0`) rather than unrestricted searches. |

---

## 3. Targeted Remediation Summary

Following the baseline implementation, targeted remediation was performed to address critical integrity and security items:

1. **Type-Safe Custom-Variable Filtering (`ParticipantSpecifications.java`)**:
   - Replaced fragile whole-JSON string matching with PostgreSQL `jsonb_path_exists` targeting `$.variables[*] ? ((@.id == "target" || @.name == "target") && ...)`.
   - Guaranteed zero cross-variable false positive leakage (one variable's value cannot match another).
   - Implemented exact matching for equality, inequality, numeric comparisons (`@.value.double() > num`, `< num`, between ranges), date comparisons, categorical multi-select (`||`), presence (`assigned`, `not_assigned`), and text contains with case-insensitive regex flags.
   - Protected against JSON injection by escaping JSONPath strings (`\\`, `\"`).
   - Ensured unsupported or invalid custom rules return JPA disjunctions (`cb.disjunction()`), preventing unrestricted searches.

2. **Filter Rule Validation (`ParticipantRegistryService.java`)**:
   - `validateFilterRules` enforces field existence against authorized metadata.
   - Validates that requested operators are valid for the declared variable type (`validateOperatorForFieldType`).
   - Validates numeric and date range boundaries (`min <= max`) and required boundary values.
   - Rejects invalid rules with `HTTP 400 Bad Request` before query execution.

3. **Deterministic Registry Metadata Resolution (`ParticipantRegistryService.java`)**:
   - In study-specific views (`studyId != null`), returns only global custom variables and active study variables.
   - Global custom variables are authoritative across the tenant and cannot be shadowed or overwritten by study-specific definitions.
   - For tenant-wide views (`studyId == null`), variables with identical names and types are unified; conflicting types across studies are preserved and disambiguated with study name attribution.

4. **Malformed Configuration & Parsing Error Handling**:
   - Structured error logging without leaking sensitive configuration or participant data.
   - Prevents silent suppression; safely preserves access to unrelated valid configurations.

5. **Fail-Closed Authentication (`ParticipantRegistryController.java`)**:
   - Eliminated production fallbacks to hardcoded `DEFAULT_TENANT_ID` and `DEFAULT_USER_ID`.
   - Missing caller identity throws `InsufficientAuthenticationException` (401/403).
   - Cross-tenant requests throw `AccessDeniedException` (403).

---

## 4. Architecture & Remediation Summary

To achieve full functional parity with legacy Ripple without violating architectural constraints:
1. **Database Schema**: Reuses existing `enrollnow.study_requirements` (storing sample size and JSONB configuration) and `enrollnow.study_milestones`. Participant custom attributes are stored in PostgreSQL JSONB (`custom_attributes`). No DDL alterations required.
2. **Backend Services (`enrollnow-study-service`)**:
   - Provide comprehensive Requirements DTOs (`StudyRequirementsResponse`, `UpdateStudyRequirementsRequest`, `StudyMilestoneDto`, `DemographicGroupDto`, `CustomVariableDto`, `VariableGroupDto`, `LayoutItemDto`).
   - Implement service methods in `StudyService` and `StudyConfigurationService`.
   - Expose REST endpoints in `StudyController`:
     - `GET /api/v1/studies/{studyId}/requirements`
     - `PUT /api/v1/studies/{studyId}/requirements`
     - `POST/PUT/DELETE /api/v1/studies/{studyId}/milestones`
     - `POST/PUT/DELETE /api/v1/studies/{studyId}/groups`
     - `POST/PUT/DELETE /api/v1/studies/{studyId}/custom-variables`
     - `GET /api/v1/custom-variables/global`
3. **Backend Services (`enrollnow-participant-service`)**:
   - Expose `GET /api/v1/registry/filter-metadata` returning dynamic fields (including global custom variables and their options/types with deterministic conflict resolution).
   - Type-safe PostgreSQL JSONPath queries in `ParticipantSpecifications.java` and type-safe in-memory evaluation in `ParticipantRegistryService.java`.
   - Strict filter rule validation and fail-closed security.
4. **Frontend Microfrontends (`study` & `participant`)**:
   - Implement `StudySettingsRequirements.tsx` with all 6 functional sections matching legacy Ripple.
   - Wire `StudySettingsWorkspace.tsx` to mount `StudySettingsRequirements`.
   - Update `filterMetadata.ts` and `FilterCard.tsx` in `participant` microfrontend to consume dynamic metadata.
