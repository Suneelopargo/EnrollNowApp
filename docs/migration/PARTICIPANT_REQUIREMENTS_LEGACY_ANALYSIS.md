# EnrollNow — Participant Requirements: Legacy Ripple Functional Analysis

## 1. Executive Summary

This document presents a comprehensive, evidence-based architectural and functional analysis of the legacy Ripple application's **Study Settings → Participants → Requirements** screen and its integration with the participant Registry. The analysis is based directly on the legacy Ripple source code located in `D:\ProjectsWorkSpace\ProjectCode\EnrollnowSpace\ripple`.

The Requirements screen in Ripple serves as the centralized study configuration hub for recruitment targets, demographic quota criteria, custom data-collection variables, and contact workflow taxonomy. It governs:
1. **General Sample Requirements**: Study overall participant target (Sample Size $N$).
2. **Milestone Management**: Scheduled recruitment milestones tracking date and target participant count.
3. **Age Requirements**: Age group quotas with target sample sizes and inclusive age ranges ($min$ to $max$).
4. **Sex/Gender Requirements**: Gender categories with target sample sizes and optional age range restrictions.
5. **Ethnic & Racial Categories**: NIH/US Census classification quota groups with sample sizes, age ranges, and nested gender groups.
6. **Custom & Global Variables**: Study-specific and team-wide global custom variables across 7 supported data types, with options management, single-to-multi conversion, blind data protection, and drag-and-drop sortable layout.
7. **Variable Groups**: Collapsible containers for categorizing variables with default participant card collapse states and member reordering.
8. **Contact Relationships and Outcomes**: Team-scoped taxonomy of contact outcomes and relationship values.
9. **Registry Integration**: Dynamic export of global custom variables into the Registry filter criteria builder, dynamic operator selection, and participant query execution.

---

## 2. Legacy Source Code Inventory & Architecture

### 2.1 Frontend Components

| File Path | Description | Key Responsibilities |
|---|---|---|
| `client/components/authenticated/studyPages/settings/requirements.jsx` | Primary Requirements Container Component | Renders the 6 core sections, handles data subscriptions, DnD Context, search filter, and Meteor call invocations. |
| `client/components/authenticated/studyPages/settings/requirements.tests.jsx` | Requirements Component Unit Tests | Shallow rendering tests verifying headers, input fields, labels, buttons, and subcomponents. |
| `client/components/authenticated/studyPages/settings/custom-variables/custom-variable.jsx` | Custom Variable Item Card | Renders individual variable details, name editing, type badge, convert single-to-multi, lock/unlock global variables, global/blind toggles, options list, and delete actions. |
| `client/components/authenticated/studyPages/settings/custom-variables/variable-group-block.jsx` | Variable Group Container | Renders collapsible group block, group rename/delete, popover to add new or existing variable, and member sortable list. |
| `client/components/authenticated/studyPages/settings/custom-variables/sortable-component.jsx` | Unified Sortable List Component | `@dnd-kit` sortable wrapper with Virtuoso virtualization for smooth drag-and-drop reordering. |
| `client/components/authenticated/studyPages/settings/custom-variables/add-group-variable-select-popover.jsx` | Group Plus Button Popover | Anchored popover offering "New variable in this group" and "Add existing variable…". |
| `client/components/authenticated/studyPages/modals/add-custom-variable-modal.jsx` | Add Custom Variable Modal | Modal to select type, input variable name with duplicate checking, and input initial options. |
| `client/components/authenticated/studyPages/modals/variable-details.jsx` | Variable Options Input | `react-select/creatable` multi-input for adding categorical options. |
| `client/components/authenticated/studyPages/modals/add-global-variable-modal.jsx` | Add Global Variable Modal | Dropdown selecting from `globalVariablesNotInStudy` to attach to study. |
| `client/components/authenticated/studyPages/modals/add-variable-group-modal.jsx` | Create Variable Group Modal | Input for new unique variable group name. |
| `client/components/authenticated/studyPages/modals/assign-variable-to-group-modal.jsx` | Assign/Move Variable to Group Modal | Select target group or `UNASSIGN` to move variable to root layout. |
| `client/components/authenticated/studyPages/modals/add-existing-variable-to-group-modal.jsx` | Add Existing Variable to Group Modal | Select from ungrouped study variables to assign to a group. |
| `client/components/authenticated/studyPages/modals/rename-variable-group-modal.jsx` | Rename Group Modal | Input for editing existing group name with uniqueness validation. |
| `client/components/authenticated/studyPages/modals/add-contact-outcome-or-relationship-modal.jsx` | Add Contact Outcome/Relationship Modal | Input for creating team-level relationship or outcome value. |
| `client/components/authenticated/registry-filter-options.js` | Registry Filter Allowed Operators | Map of variable types (`default`, `date`, `dateTime`, `number`, `single`, `multi`, `short`, `long`) to supported comparison operators. |
| `client/components/authenticated/registry.jsx` | Registry Main Dashboard & Filter Engine | Consumes `returnAllGlobalVariables()`, renders `custom_${id}` filter options, dynamic input controls, and validates saved searches. |

### 2.2 Collections and Data Models

| Collection Name | Mongo Collection | Primary Schema Definition | Methods File |
|---|---|---|---|
| `StudyRequirements` | `studyrequirements` | `studyId`, `sampleSize`, timestamps | `collections/study_requirements.js` |
| `StudyMilestones` | `study_milestones` | `studyId`, `date`, `numParticipants`, timestamps | `collections/study_milestones.js` |
| `Groups` | `groups` | `studyId`, `defaultCategoryName` (`age`, `sex`, `ethnicity`, `race`), `label`, `sampleSize`, `ageRange: {min, max}`, timestamps | `collections/groups.js` |
| `GenderGroups` | `gender_groups` | `studyId`, `groupId`, `gender` (`Male`, `Female`, `Other`), `participants`, timestamps | `collections/gender_groups.js` |
| `CustomVariables` | `custom_variables` | `name`, `variableType`, `options: [{optionId, name}]`, `isGlobal`, `isBlind`, timestamps | `collections/custom_variables.js` |
| `Studies` (Embedded) | `studies` | `customVariables: [{variableId, rank}]`, `variableGroups: [{_id, name, members, isCollapsed}]`, `customVariableLayout: [{_id, type, refId, rank}]` | `imports/collections/studies/` |
| `ContactRelationships` | `contact_relationships` | `teamId`, `relationship`, timestamps | `collections/contact_relationships.js` |
| `ContactOutcomes` | `contact_outcomes` | `teamId`, `outcome`, timestamps | `collections/contact_outcomes.js` |

---

## 3. Detailed Functional Behaviors

### 3.1 General Sample Requirements
- **Entity**: `StudyRequirements` collection.
- **Fields**:
  - `sampleSize`: Positive Integer ($N \ge 0$).
  - `studyId`: String study identifier.
- **Meteor Method**: `updateStudyRequirements({ studyId, sampleSize })`.
- **Validation**: Requires Study Leader authorization. Upserts document matching `{ studyId }`.
- **UI Behavior**: Number input debounced or updated on blur/change. If empty, stored as null/undefined.

### 3.2 Milestone Management
- **Entity**: `StudyMilestones` collection.
- **Fields**:
  - `_id`: String milestone identifier.
  - `studyId`: Study identifier.
  - `date`: Optional Date/timestamp (stored as ISO Date).
  - `numParticipants`: Optional Integer target count.
- **Meteor Methods**:
  - `addStudyMilestone({ studyId })`: Appends a blank milestone row.
  - `updateStudyMilestone(milestoneId, { date, numParticipants })`: Updates date or participant count.
  - `deleteMilestone(milestoneId)`: Deletes milestone after SweetAlert confirmation dialog.
- **Validation**: Date must be valid moment date; participant count must be $\ge 0$.

### 3.3 Demographic Quota Groups (Age, Sex, Ethnicity, Race)
- **Entity**: `Groups` collection.
- **Discriminator**: `defaultCategoryName` matching `GroupCategoryNames`:
  - `age`: Age Requirements section.
  - `sex`: Sex/Gender section.
  - `ethnicity`: Ethnic & Racial Categories section.
  - `race`: Ethnic & Racial Categories section.
- **Fields on Group**:
  - `_id`: Generated string ID.
  - `studyId`: Study reference.
  - `label`: String group name/description (e.g., "Entire Sample", "Cohort A", "Female", "Asian").
  - `sampleSize`: String / number target allocation quota.
  - `ageRange`: Nested object `{ min: Number, max: Number }`. Min must be $\ge 0$. Open-ended if either is omitted.
- **Nested Gender Groups (`GenderGroups`)**:
  - For `ethnicity` and `race` groups (and custom categories), Ripple allows adding nested gender splits.
  - Fields: `groupId` (links to parent `Groups._id`), `gender` ("Male", "Female", "Other"), `participants` (Integer target count).
- **Methods**:
  - `insertGroup({ studyId, defaultCategoryName })`: Creates a new group.
  - `updateGroup(groupId, params)`: Updates `label`, `sampleSize`, `ageRange.min`, `ageRange.max`.
  - `removeGroup(groupId, surveyJsonList)`: Checks survey references and deletes group.
  - `insertGenderGroup({ studyId, groupId })`: Adds nested gender quota row.
  - `updateGenderGroup(studyId, genderGroupId, { gender, participants })`: Updates nested gender row.

### 3.4 Custom Variables Architecture

#### Supported Variable Types (`CustomVariableTypes`)
1. `single`: Single Select (categorical dropdown with predefined options).
2. `multi`: Multi Select (categorical multi-selection with predefined options).
3. `short`: Short Text (single-line string).
4. `long`: Long Text (multi-line string).
5. `number`: Numeric value (integer or decimal).
6. `date`: Calendar date (`YYYY-MM-DD`).
7. `dateTime`: Date and time timestamp.

#### Custom Variable Lifecycle & Operations
- **Creation (`insertCustomVariable`)**:
  - Validates study admin permission.
  - Enforces study-unique variable name (and checks against global variable names).
  - Inserts into `CustomVariables` collection.
  - Appends to `study.customVariables` array with next rank.
  - If `groupId` specified, appends to `group.members`; otherwise adds item to `study.customVariableLayout`.
- **Updating (`updateCustomVariable`)**:
  - Updates `name`. Validates uniqueness among study variables and global variables.
- **Conversion (`convertToMulti`)**:
  - Permitted only for `single` type. Converts `variableType` from `single` to `multi`.
  - Irreversible action with user confirmation.
- **Blind Data Protection (`toggleBlind`)**:
  - Sets `isBlind: boolean`. If true, masks or restricts variable visibility for blinded roles.
- **Global Variable Conversion (`toggleGlobal`)**:
  - If making global: sets `isGlobal: true` and updates all assigned custom variables (ACVs) to global.
  - If removing global setting: creates local copies per study, rewrites ACVs to study-scoped local copies, and deletes original global record.
- **Options Management**:
  - `insertOption(cvId, studyId)`: Appends option with unique `optionId` (nanoid 17) and blank name.
  - `updateOption(cvId, studyId, { optionId, name })`: Updates option label with debouncing.
  - `removeOption(cvId, studyId, optionId)`: Deletes option and pulls it from participant assigned custom variables (`assignedCustomVariables.selectedOptionIds`).
- **Deletion (`deleteCustomVariable`)**:
  - If non-global: deletes variable, pulls from `study.customVariables`, layout, and participants.
  - If global used in multiple studies: unassigns from current study only (`unassignGlobalVariableFromStudy`).
  - If global used only in current study: offers prompt to "Remove From This Study" or "Delete" globally.

### 3.5 Variable Groups & Sortable Layout
- **Variable Group Entity**: Embedded in `Studies.variableGroups`:
  - `_id`: String group ID.
  - `name`: Unique group name.
  - `members`: Ordered array of variable IDs `[cvId1, cvId2, ...]`.
  - `isCollapsed`: Boolean default collapse flag for Participant Profile Card.
- **Root Layout (`Studies.customVariableLayout`)**:
  - Ordered array of items: `{ _id, type: 'group' | 'variable', refId, rank }`.
  - Virtualized rendering via `@dnd-kit` and Virtuoso.
- **Group Operations**:
  - `createVariableGroup`: Adds group and creates corresponding root layout item.
  - `renameVariableGroup`: Renames group with duplicate-name check.
  - `removeVariableGroup`: Destructive deletion safeguard: group must be empty (`members.length === 0`).
  - `addVariableToGroup`: Moves variable from root layout (or another group) into group.
  - `removeVariableFromGroupToLayout`: Moves variable out of group back to root layout.
  - `reorderGroupMembers`: Updates order of `members` array within group.
  - `updateCustomVariableLayout`: Persists reordered root layout items.

### 3.6 Contact Taxonomy
- **Entities**: `ContactRelationships` and `ContactOutcomes`.
- **Scope**: Team-wide (tenant-wide).
- **Default Immutable Entries**: "Other" is always present with special handling.
- **Methods**:
  - `getContactRelationships(teamId)` / `addContactRelationship(teamId, relationship)` / `deleteContactRelationships(id)`.
  - `getContactOutcomes(teamId)` / `addContactOutcome(teamId, outcome)` / `deleteContactOutcome(id)`.

### 3.7 Registry Integration
- **Global Variable Discovery**: Registry calls `returnAllGlobalVariables()` to retrieve all variables where `isGlobal === true`.
- **Dynamic Filter Field Options**:
  - Global variables injected as `custom_${variable._id}` with label `Custom - ${variable.name}`.
- **Dynamic Operators based on `allowedFilterOptions`**:
  - `number`: `equal`, `not_equal`, `greater_than`, `less_than`.
  - `date` / `dateTime`: `equal`, `not_equal`, `greater_than`, `less_than`, `between`, `not_between`.
  - `single` / `multi`: `equal` (and in EnrollNow `not_equal`, `assigned`, `not_assigned`).
  - `short` / `long`: `equal`, `contains`.
- **Dynamic Input Controls**:
  - Categorical variables render selectable option badges/dropdown matching `customVariable.options`.
  - Numeric variables render numeric inputs.
  - Date variables render date/date-range pickers.
  - Text variables render text inputs.
- **Saved Searches**:
  - Saved searches store filter rules with `filterType: "custom_${cvId}"`.
  - If the custom variable is removed, the filter rule is ignored safely to prevent query crashes.

---

## 4. Downstream Consumers & Data Integrity Safeguards

1. **Surveys**: Survey questions can link to demographic quota groups or custom variable options. When a group or option is removed, `parseSurveyPriorToLinkDelete` checks staged changes.
2. **Participant Records**: Assigned custom variables (`assignedCustomVariables`) store values and option IDs. Deleting an option pulls the option ID from assigned variables rather than corrupting the participant record.
3. **Email & Text Templates**: `checkTemplatesForTags` scans template bodies for merge tags referencing custom variables prior to deletion.
4. **Registry Saved Searches**: When global variables are deleted, orphaned search filters referencing `custom_${cvId}` are purged to preserve search execution.
