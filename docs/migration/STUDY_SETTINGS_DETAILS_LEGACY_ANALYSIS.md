# Legacy Ripple Study Settings — Details Analysis & Specification

## 1. Executive Summary

This document provides a comprehensive technical analysis of the **Study Settings → Details** feature from legacy Ripple (`ripple-develop`), detailing the exact data models, UI components, business rules, validation criteria, permissions, and workflows. It establishes the architectural blueprint and traceability matrix for migrating this functionality into EnrollNow (`EnrollNowApp`).

---

## 2. Legacy Ripple Source Inventory

### 2.1 Relevant Legacy Files
- **`client/components/authenticated/studyPages/study-settings.jsx`**:
  - The outer Study Settings container providing the sub-navigation sidebar (`nav-stacked` list):
    1. Details (`/study-settings/:studyId/details`)
    2. Display (`/study-settings/:studyId/display`)
    3. Bulk Tasks (`/study-settings/:studyId/bulk-tasks`)
    4. Email and Text (`/study-settings/:studyId/email-and-text`)
    5. Survey Creator (`/study-settings/:studyId/survey-creator`)
    6. Old Survey Creator (Legacy) (`/study-settings/:studyId/old-survey-creator`)
    7. Participants (`/study-settings/:studyId/participants`)
       - Requirements (`/study-settings/:studyId/requirements`)
       - Statuses (`/study-settings/:studyId/statuses`)
    8. Scheduling (`/study-settings/:studyId/scheduling`)
       - Events (`/study-settings/:studyId/events`)
       - Study Calendar Integration (`/study-settings/:studyId/calendar-integration`)
       - 3rd Party Activity Log (`/study-settings/:studyId/activity-log`)
  - Ensures study context is loaded and routes active sub-views.

- **`client/components/authenticated/studyPages/settings/details.jsx`**:
  - The primary React view component rendering the Details form.
  - Controls:
    - **Header buttons**: "Import Study Components" (triggers incremental JSON component import) and "Export Study" (downloads exported study JSON file).
    - **Short Study Name (`name`)**: Input field, `maxLength={15}`, required, validated against alphanumeric and spaces only, unique within tenant.
    - **Study Name (`longname`)**: Text input for full descriptive study title, optional.
    - **Study Description (`description`)**: Multi-line textarea for study overview, optional.
    - **Active Recruitment Start Date (`startDate`)**: Date picker.
    - **Active Recruitment End Date (`endDate`)**: Date picker; cannot be prior to start date.
    - **Study Completion Date (`completionDate`)**: Date picker; represents final wrap-up / protocol close.
    - **Header URL (`studyURL`) & URL Label (`studyUrlLabel`)**: Optional web link shown in header navigation or participant portal.
    - **Allow study participants to be active in other studies (`allowParticipationInOtherStudies`)**: Checkbox toggling co-enrollment restriction.
    - **IRB Approved # / ID (`irbId`)**: Text input for institutional review board protocol number.
    - **Grants list**: Dynamic table with `Grant #` and `Granting Agency`, "+ Add new grant" button, inline editing, and delete actions.
    - **Form Actions**: "Save Changes" (primary) and "Discard Changes" (secondary); disabled when form is pristine (`!isDirty`) or actively saving.
    - **Dirty Tracking**: Listens to form field modifications, prompts confirmation if user attempts to navigate away with unsaved changes.

- **`imports/collections/studies/methods/updateStudyDetails.js`**:
  - Backend Meteor method executing atomic updates to the study document.
  - Validates caller permissions (`isUserStudyAdmin(studyId)` or site admin).
  - Validates `name` format (<= 15 characters, alphanumeric/spaces, uniqueness).
  - Updates `name`, `longname`, `description`, `studyURL`, `studyUrlLabel`, `startDate`, `endDate`, `completionDate`, `irbId`, `allowParticipationInOtherStudies`.
  - Normalizes date values to start of UTC day or `null`.

- **`collections/grants.js`**:
  - Collection schema defining grant entities associated with a study:
    - `studyId`: Associated study UUID/ID.
    - `grantNum`: Grant or award reference number (varchar).
    - `grantAgency`: Funding agency name (e.g., NIH, NSF, Pfizer, etc.).
    - `createdAt`: Timestamp.

- **`server/studies/studyImportAndExport.js` & `client/components/authenticated/studyPages/settings/IncrementalImport.jsx`**:
  - Export: Serializes study metadata, grants, statuses, requirements, and events into downloadable JSON.
  - Incremental Import: Parses JSON file and updates selected components for the current study.

---

## 3. Data Dictionary & Field Mapping

| Legacy Field (Ripple) | Legacy Type | EnrollNow DB Column (`enrollnow.studies`) | EnrollNow Entity Property (`Study.java`) | Validation Rules | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `name` | String(15) | `name` (varchar 100) | `name` | Required, max 15 chars, alphanumeric & spaces, unique per tenant | Short study name / code used in selectors and breadcrumbs |
| `longname` | String | `long_name` (text) | `longName` | Optional, text | Full formal study title |
| `description` | String | `description` (text) | `description` | Optional, text | Detailed protocol or study description |
| `studyURL` | String | `study_url` (text) | `studyUrl` | Optional, URL format | External study or portal website URL |
| `studyUrlLabel` | String | `study_url_label` (varchar 100) | `studyUrlLabel` | Optional, max 100 chars | Display label for external study URL |
| `startDate` | Date (UTC) | `recruitment_start_date` (date) | `recruitmentStartDate` | Optional, valid date | Date active recruitment began or begins |
| `endDate` | Date (UTC) | `recruitment_end_date` (date) | `recruitmentEndDate` | Optional, must be >= `startDate` | Date active recruitment ends |
| `completionDate` | Date (UTC) | `completion_date` (date) | `completionDate` | Optional, valid date | Date study completed or closed |
| `allowParticipationInOtherStudies` | Boolean | `allow_participation_in_other_studies` (bool) | `allowParticipationInOtherStudies` | Default `true` | Allows participants to simultaneously enroll in other studies |
| `irbId` | String | `irb_id` (varchar 100) | `irbId` | Optional, max 100 chars | Institutional Review Board protocol identifier |
| `study_grants` (grants collection) | Array | `enrollnow.study_grants` | `StudyGrant.java` | 0..N items per study; `grant_number`, `agency` | Funding grants supporting this study |

---

## 4. UI Layout & User Experience Specification

### 4.1 Structural Layout
```
+---------------------------------------------------------------------------------------------------+
| Study Settings                                                                                     |
+-------------------+-------------------------------------------------------------------------------+
| SIDEBAR SUBMENU   | MAIN CONTENT AREA                                                             |
|                   |                                                                               |
| > Details (active)| [Study Title / Code]                                 [Import] [Export Study]  |
|   Display         | ----------------------------------------------------------------------------- |
|   Bulk Tasks      | Section: Study Details                                                        |
|   Email and Text  |   Short Study Name *               Study Name                                 |
|   Survey Creator  |   [____________________]           [________________________________________] |
|   Old Survey (Leg)|                                                                               |
|   Participants    |   Study Description                                                           |
|     Requirements  |   [_________________________________________________________________________] |
|     Statuses      |                                                                               |
|   Scheduling      |   Active Recruitment Start Date   Active Recruitment End Date                 |
|     Events        |   [ YYYY-MM-DD          [cal] ]   [ YYYY-MM-DD                     [cal] ]    |
|     Study Cal Int |                                                                               |
|     3rd Party Log |   Study Completion Date           Header URL                                  |
|                   |   [ YYYY-MM-DD          [cal] ]   [ https://...                            ]  |
|                   |                                                                               |
|                   |   URL Label                                                                   |
|                   |   [ Learn more about our trial ]                                              |
|                   |                                                                               |
|                   |   [x] Allow study participants to be active in other studies                  |
|                   | ----------------------------------------------------------------------------- |
|                   | Section: Regulatory & Funding                                                 |
|                   |   IRB Approved # / ID                                                         |
|                   |   [ IRB-2026-90412             ]                                              |
|                   |                                                                               |
|                   |   Grants                                                                      |
|                   |   +-------------------------------------------------------------------------+ |
|                   |   | Grant #               | Granting Agency                       | Action  | |
|                   |   +-----------------------+---------------------------------------+---------+ |
|                   |   | R01-HL123456          | National Institutes of Health         | [Trash] | |
|                   |   | AHA-987654            | American Heart Association            | [Trash] | |
|                   |   +-------------------------------------------------------------------------+ |
|                   |   [ + Add new grant ]                                                         |
|                   | ----------------------------------------------------------------------------- |
|                   | [ Discard Changes ]                                            [ Save Changes ]|
+-------------------+-------------------------------------------------------------------------------+
```

### 4.2 Accessibility & Design Standards
- **Strict CSS/SCSS**: No inline JSX `style` attributes. All styling in dedicated SCSS stylesheets following BEM methodology and tokens.
- **Form Controls**: Labels linked via `htmlFor` to matching input `id`s. Required fields marked with `aria-required="true"`.
- **Validation Feedback**: Inline errors connected via `aria-describedby` and rendered with `role="alert"`.
- **Dirty State Tracking**: Action buttons ("Save Changes" and "Discard Changes") disabled when `!isDirty` or while saving. Prompt/confirmation prevents accidental data loss when switching tabs or studies.

---

## 5. Security & Authorization

### 5.1 RBAC Rules
- **Viewing Details**: Users with any valid active study role (`STUDY_ADMIN`, `STUDY_LEADER`, `STUDY_RA`, `STUDY_READ_ONLY`) or Site Administrator can view study details.
- **Editing Details**: Only users with `STUDY_SETTINGS_MANAGE` permission (typically `STUDY_ADMIN`) or Site Administrators with `SITE_ALL_STUDIES_MANAGE` / `canManageSiteAdmins` can update study details and grants.
- Backend encloses update operations within tenant boundaries and strictly verifies caller authorization.

---

## 6. Requirements Traceability Matrix

| Requirement ID | Legacy Feature | EnrollNow Backend Component | EnrollNow Frontend Component | Verification Method |
| :--- | :--- | :--- | :--- | :--- |
| **REQ-SD-01** | Study Settings submenu navigation | N/A (Client-side routing) | `StudySettingsWorkspace.tsx` | Unit tests verify Details is active and other submenus render correctly |
| **REQ-SD-02** | Fetch study details & grants | `GET /api/v1/studies/{studyId}/details` in `StudyController.java` & `StudyService.java` | `getStudyDetails` in `studyApi.ts`, invoked by `StudySettingsDetails.tsx` | API integration test, mock response rendering |
| **REQ-SD-03** | Short Study Name validation (<=15 chars, required, unique) | `validateStudyName` in `StudyService.java` | Validation in `StudySettingsDetails.tsx` | Unit tests verify error on empty, >15 chars, or special characters |
| **REQ-SD-04** | Date validation (end date >= start date) | Validation in `updateStudyDetails` in `StudyService.java` | Frontend validation in `StudySettingsDetails.tsx` | Unit tests verify end date before start date triggers validation alert |
| **REQ-SD-05** | Grants multi-row management | `StudyGrantRepository.java`, managed in `updateStudyDetails` | Dynamic table with add/remove rows in `StudySettingsDetails.tsx` | Unit tests verify adding, editing, and deleting grant rows |
| **REQ-SD-06** | Atomic persistence on Save Changes | `PUT /api/v1/studies/{studyId}/details` in `StudyController.java` | `updateStudyDetails` in `studyApi.ts` | Backend integration test verifies study entity and grants update in one transaction |
| **REQ-SD-07** | Dirty state tracking & discard | N/A (React state) | Form dirty state tracking in `StudySettingsDetails.tsx` | Unit tests verify buttons disable when clean and reset upon Discard |
| **REQ-SD-08** | Export Study JSON | `GET /api/v1/studies/{studyId}/export` | Trigger download blob in `StudySettingsDetails.tsx` | Unit tests verify export endpoint and trigger click |
| **REQ-SD-09** | Import Study Components | `POST /api/v1/studies/{studyId}/import-components` | JSON file upload modal in `StudySettingsDetails.tsx` | Unit tests verify file selection and upload flow |
| **REQ-SD-10** | RBAC permission guard | `SiteAuthorizationService` & `StudyService` | Conditional edit/disabled controls based on `canManageSettings` | Unit tests verify read-only mode for users without edit permissions |
