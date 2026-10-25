# EnrollNow — Study Settings: Email and Text
## Phase 1: Source-Code Analysis and Gap Identification Report

> **Document Version:** 1.0.0  
> **Date:** October 26, 2026  
> **Status:** Phase 1 Analysis Complete — STRICTLY READ-ONLY (No code modified or created)  
> **Scope:** Study Settings → Email and Text (`email_and_text` submenu)  

---

## Table of Contents
1. [Section A: Executive Summary & Scope](#section-a-executive-summary--scope)
2. [Section B: Legacy Ripple Implementation Trace](#section-b-legacy-ripple-implementation-trace)
3. [Section C: Current EnrollNow State](#section-c-current-enrollnow-state)
4. [Section D: Parity Matrix (Email & Text Settings)](#section-d-parity-matrix-email--text-settings)
5. [Section E: Template Lifecycle & CRUD Workflows](#section-e-template-lifecycle--crud-workflows)
6. [Section F: Merge Tags, Templating Syntax, and Validation Engine](#section-f-merge-tags-templating-syntax-and-validation-engine)
7. [Section G: Scheduled Actions & Event Trigger Integration](#section-g-scheduled-actions--event-trigger-integration)
8. [Section H: Rich Text / HTML Email Editor vs Classic Plain Text vs SMS Constraints](#section-h-rich-text--html-email-editor-vs-classic-plain-text-vs-sms-constraints)
9. [Section I: Security, Authorization & Multi-Tenancy Considerations](#section-i-security-authorization--multi-tenancy-considerations)
10. [Section J: Database Schema & Migration Strategy](#section-j-database-schema--migration-strategy)
11. [Section K: Implementation Roadmap & Phased Execution Plan](#section-k-implementation-roadmap--phased-execution-plan)
12. [Section L: Verification Checklist & Acceptance Criteria](#section-l-verification-checklist--acceptance-criteria)

---

## Section A: Executive Summary & Scope

### 1. Purpose
This document provides a comprehensive, source-level comparative analysis between the legacy Ripple application (`D:\ProjectsWorkSpace\ProjectCode\EnrollnowSpace\ripple`) and the current EnrollNow codebase (`d:\ProjectsWorkSpace\ProjectCode\EnrollnowSpace\EnrollNowApp`) regarding **Study Settings → Email and Text**.

In accordance with Phase 1 constraints:
- **Strictly Analysis Only**: Zero application code, migrations, or tests have been created or modified.
- **Isolation Guarantee**: Previously completed and verified submenus (**Details**, **Display**, and **Bulk Tasks**) remain completely intact and unaffected.
- **Evidence-Based**: Every gap, data structure, and business workflow is traced directly to concrete source lines in both repositories.

### 2. High-Level Findings
1. **Legacy Ripple** provides a unified **Email and Text Settings** screen consisting of two main stacked sections:
   - **Email Templates**: Filter (`Active Emails`, `Archived Emails`, `All Emails`), draggable template list, modal editor with rich HTML/Unlayer design and Handlebars merge tags, single file attachment support, automated scheduled actions, and action triggers.
   - **Text Templates**: Filter (`Active Texts`, `Archived Texts`, `All Texts`), draggable template list, plain text modal editor with 1600-character counter, Handlebars merge tags, automated scheduled actions, and action triggers.
   - Global Text Messaging feature toggle (`isTextMessagingEnabled()`): When disabled, the screen renders as `Email Settings` and hides the Text Templates section.
2. **Current EnrollNow Implementation**:
   - Frontend: `StudySettingsWorkspace.tsx` registers `'email_and_text'` in the side navigation, but the workspace body renders a placeholder (`"This Study Settings section is scheduled for complete migration in an upcoming phase"`).
   - Backend: In `StudyConfigurationService.java`, default study creation, study cloning, and legacy JSON import/export already parse and store `emailTemplates`, `textTemplates`, and `scheduledActions` in the JSONB `configuration` column of `enrollnow.study_requirements`.
   - APIs: There are currently **no** dedicated REST endpoints, DTOs, or service methods for querying, creating, updating, copying, archiving, restoring, or reordering email or text templates.
   - Schema: In `backend/enrollnow-app/src/main/resources/db/migration/V13__communications.sql`, a relational `communication_templates` table exists, but the Study Settings domain currently persists configuration entities (statuses, groups, events, bulk tasks, custom variables) in `enrollnow.study_requirements.configuration`.

---

## Section B: Legacy Ripple Implementation Trace

### 1. Primary Source Files in Legacy Ripple

| File Path | Description / Responsibility |
|:---|:---|
| [`client/components/authenticated/studyPages/settings/emails/EmailTextSettings.jsx`](file:///D:/ProjectsWorkSpace/ProjectCode/EnrollnowSpace/ripple/client/components/authenticated/studyPages/settings/emails/EmailTextSettings.jsx) | Root container. Checks `isTextMessagingEnabled()`. Renders dynamic heading (`Email and Text Settings` vs `Email Settings`), `<EmailTemplates />`, and optionally `<TextTemplates />`. |
| [`client/components/authenticated/studyPages/settings/emails/EmailTemplates.jsx`](file:///D:/ProjectsWorkSpace/ProjectCode/EnrollnowSpace/ripple/client/components/authenticated/studyPages/settings/emails/EmailTemplates.jsx) | Email section container. Manages status dropdown (`Active Emails`, `Archived Emails`, `All Emails`), hook `useTemplateOrder`, modal caller for `EmailTemplateModal`, `<TemplatesList />`, and "Add Template" button. |
| [`client/components/authenticated/studyPages/settings/texts/TextTemplates.jsx`](file:///D:/ProjectsWorkSpace/ProjectCode/EnrollnowSpace/ripple/client/components/authenticated/studyPages/settings/texts/TextTemplates.jsx) | Text section container. Manages status dropdown (`Active Texts`, `Archived Texts`, `All Texts`), hook `useTemplateOrder`, modal caller for `TextTemplateModal`, `<TemplatesList />`, and "Add Template" button. |
| [`client/components/authenticated/studyPages/settings/TemplatesList.jsx`](file:///D:/ProjectsWorkSpace/ProjectCode/EnrollnowSpace/ripple/client/components/authenticated/studyPages/settings/TemplatesList.jsx) | Shared draggable table component. Displays columns: `Name`, `Description`, `Actions`, and drag handle. Shows red warning tooltip icon for broken merge tags. Renders action links based on archive state. |
| [`client/components/authenticated/studyPages/settings/templateActionModals.js`](file:///D:/ProjectsWorkSpace/ProjectCode/EnrollnowSpace/ripple/client/components/authenticated/studyPages/settings/templateActionModals.js) | SweetAlert2 confirmation dialogs for Archive, Restore, and Delete actions invoking respective Meteor methods. |
| [`client/components/authenticated/studyPages/settings/useTemplateOrder.js`](file:///D:/ProjectsWorkSpace/ProjectCode/EnrollnowSpace/ripple/client/components/authenticated/studyPages/settings/useTemplateOrder.js) | State hook for loading, filtering, reordering (react-beautiful-dnd), and updating server ranks via `updateEmailTemplateRanks` / `updateTextTemplateRanks`. |
| [`client/components/authenticated/studyPages/settings/emails/EmailTemplateModal.jsx`](file:///D:/ProjectsWorkSpace/ProjectCode/EnrollnowSpace/ripple/client/components/authenticated/studyPages/settings/emails/EmailTemplateModal.jsx) | Email template modal editor: name, subject, description, replyTo, senderName, attachmentFileIds (max 1), Unlayer visual design editor / classic HTML fallback, scheduled action binding. |
| [`client/components/authenticated/studyPages/settings/texts/TextTemplateModal.jsx`](file:///D:/ProjectsWorkSpace/ProjectCode/EnrollnowSpace/ripple/client/components/authenticated/studyPages/settings/texts/TextTemplateModal.jsx) | Text template modal editor: name, description, message textarea (1600 character counter), scheduled action binding. |
| [`client/components/authenticated/studyPages/settings/emails/checkMessageForBadMergeTags.js`](file:///D:/ProjectsWorkSpace/ProjectCode/EnrollnowSpace/ripple/client/components/authenticated/studyPages/settings/emails/checkMessageForBadMergeTags.js) | Client utility that validates Handlebars merge tags against study metadata, custom variables, and event names. |
| [`collections/email_templates.js`](file:///D:/ProjectsWorkSpace/ProjectCode/EnrollnowSpace/ripple/collections/email_templates.js) | Email template collection schema, validation, security permissions (`isUserStudyAdmin`, `isUserStudyLeader`), and server methods: `createEmailTemplate`, `updateEmailTemplate`, `copyEmailTemplate`, `archiveEmailTemplate`, `restoreEmailTemplate`, `deleteEmailTemplate`, `getEmailAllTemplatesForStudy`, `getEmailTemplate`, `updateEmailTemplateRanks`, `populateEmailTemplate`. |
| [`collections/text_templates.js`](file:///D:/ProjectsWorkSpace/ProjectCode/EnrollnowSpace/ripple/collections/text_templates.js) | Text template collection schema, validation, security permissions, and server methods: `createTextTemplate`, `updateTextTemplate`, `copyTextTemplate`, `archiveTextTemplate`, `restoreTextTemplate`, `deleteTextTemplate`, `getTextAllTemplatesForStudy`, `getTextTemplate`, `updateTextTemplateRanks`, `populateTextTemplate`. |
| [`collections/scheduled_actions.js`](file:///D:/ProjectsWorkSpace/ProjectCode/EnrollnowSpace/ripple/collections/scheduled_actions.js) | Schema and CRUD helpers for scheduled actions attached to email or text templates. |
| [`server/helpers/populateTemplate.js`](file:///D:/ProjectsWorkSpace/ProjectCode/EnrollnowSpace/ripple/server/helpers/populateTemplate.js) | Authoritative Handlebars variable provider proxying participant fields, dates, custom variables, next appointment, and survey links. |

### 2. Legacy Data Models

#### Email Template Data Structure (`collections/email_templates.js`)
```javascript
{
  _id: String,                  // Unique ID (e.g., UUID or Meteor ObjectID)
  studyId: String,              // Foreign key to studies
  name: String,                 // Required, case-insensitive unique among active templates
  subject: String,              // Required email subject line
  description: String,          // Optional description
  message: String,              // Email content (HTML or plain text)
  design: String,               // Optional JSON string containing Unlayer visual layout
  messageIsHtml: Boolean,       // Whether message contains rich HTML
  replyTo: String,              // Optional valid email address
  senderName: String,           // Optional display name of sender
  attachmentFileIds: [String],  // File IDs (restricted to at most 1 in UI)
  archived: Boolean,            // Default: false
  rank: Number,                 // Sorting index
  createdAt: Date,
  updatedAt: Date
}
```

#### Text Template Data Structure (`collections/text_templates.js`)
```javascript
{
  _id: String,                  // Unique ID
  studyId: String,              // Foreign key to studies
  name: String,                 // Required, case-insensitive unique among active templates
  description: String,          // Optional description
  message: String,              // Required plain text content (max 1600 characters)
  archived: Boolean,            // Default: false
  rank: Number,                 // Sorting index
  createdAt: Date,
  updatedAt: Date
}
```

#### Scheduled Action Data Structure (`collections/scheduled_actions.js`)
```javascript
{
  _id: String,
  templateId: String,           // References email_templates._id or text_templates._id
  action: {
    actionTriggerStudyId: String,
    actionType: "email" | "text",
    actionTriggerType: "event" | "variable" | "customVariable",
    actionTriggerId: String     // ID of the target Event, built-in variable, or Custom Variable
  },
  schedule: {
    relativeInterval: Number,   // e.g., 1, 2, 7
    relativeUnit: "hours" | "days" | "weeks" | "months",
    relativeBeforeOrAfter: "before" | "after",
    dateType: "scheduled" | "actual"
  }
}
```

---

## Section C: Current EnrollNow State

### 1. Frontend Inspection
- File: [`frontend/microfrontends/study/src/components/StudySettingsWorkspace.tsx`](file:///d:/ProjectsWorkSpace/ProjectCode/EnrollnowSpace/EnrollNowApp/frontend/microfrontends/study/src/components/StudySettingsWorkspace.tsx)
  - Submenu item: Lines 100–108 define button `data-testid="submenu-email-and-text"`.
  - Content switch: Lines 232–277 switch between `details`, `display`, and `bulk_tasks`.
  - When `activeSubmenu === 'email_and_text'`, execution falls through to the generic placeholder region:
    ```tsx
    <div className="study-settings-placeholder" role="region" aria-label="Submenu coming soon">
      ...
      <h3 className="study-settings-placeholder__title">Email And Text</h3>
      <p className="study-settings-placeholder__message">
        This Study Settings section is scheduled for complete migration in an upcoming phase.
      </p>
    </div>
    ```
- There are **no** React components currently implementing `StudySettingsEmailAndText`, `EmailTemplates`, `TextTemplates`, `TemplatesList`, or their edit modals.

### 2. Backend Inspection
- File: [`backend/enrollnow-study-service/src/main/java/com/enrollnow/study/controllers/StudyController.java`](file:///d:/ProjectsWorkSpace/ProjectCode/EnrollnowSpace/EnrollNowApp/backend/enrollnow-study-service/src/main/java/com/enrollnow/study/controllers/StudyController.java)
  - Endpoints exist for Details (`/details`), Display Settings (`/display-settings`), and Bulk Tasks (`/bulk-tasks`, `/bulk-task-groups`, etc.).
  - **No endpoints** exist for email templates or text templates.
- File: [`backend/enrollnow-study-service/src/main/java/com/enrollnow/study/services/StudyConfigurationService.java`](file:///d:/ProjectsWorkSpace/ProjectCode/EnrollnowSpace/EnrollNowApp/backend/enrollnow-study-service/src/main/java/com/enrollnow/study/services/StudyConfigurationService.java)
  - Line 121–123: Initializes empty lists for `"textTemplates"`, `"emailTemplates"`, and `"scheduledActions"`.
  - Lines 386–430: Remaps IDs and study references for incoming `textTemplates`, `emailTemplates`, and `scheduledActions` during full study cloning and legacy JSON imports.
  - Lines 732–800: Incrementally imports selected `emailTemplates` and `textTemplates`, performing case-insensitive duplicate name checks against existing study configuration.
- Database:
  - Table `enrollnow.study_requirements` holds the JSONB column `configuration` storing arrays for `emailTemplates`, `textTemplates`, and `scheduledActions`.
  - Table `enrollnow.communication_templates` exists in `V13__communications.sql`, designed for general communication delivery, but is not currently tied into `enrollnow-study-service`.

---

## Section D: Parity Matrix (Email & Text Settings)

| Feature / Capability | Legacy Ripple Source | Current EnrollNow State | Parity Status |
|:---|:---|:---|:---:|
| **Top-Level Heading** | `Email and Text Settings` (or `Email Settings` if SMS disabled) in `EmailTextSettings.jsx` | Submenu label in side nav only; body displays placeholder | **Missing** |
| **Feature Flag SMS Toggle** | `isTextMessagingEnabled()` hides text section if SMS disabled | No equivalent check in study settings workspace | **Missing** |
| **Email Template Filtering** | `Active Emails`, `Archived Emails`, `All Emails` in `EmailTemplates.jsx` | Not implemented | **Missing** |
| **Text Template Filtering** | `Active Texts`, `Archived Texts`, `All Texts` in `TextTemplates.jsx` | Not implemented | **Missing** |
| **Email Template Table** | `TemplatesList.jsx` (Name, Description, Actions, Drag Handle) | Not implemented | **Missing** |
| **Text Template Table** | `TemplatesList.jsx` (Name, Description, Actions, Drag Handle) | Not implemented | **Missing** |
| **Add Template Action** | Buttons opening `EmailTemplateModal` and `TextTemplateModal` | Not implemented | **Missing** |
| **Duplicate Name Validation** | Case-insensitive uniqueness check among active templates on blur & submit | Handled in `StudyConfigurationService` import only; no REST API validation | **Missing** |
| **Action: Copy Template** | Creates "Copy of <Name>", strips IDs and audit timestamps | Not implemented | **Missing** |
| **Action: Archive Template** | SweetAlert confirmation; sets `archived: true` | Not implemented | **Missing** |
| **Action: Restore Template** | SweetAlert confirmation; sets `archived: false` | Not implemented | **Missing** |
| **Action: Delete Template** | SweetAlert confirmation; permanently deletes template & scheduled action | Not implemented | **Missing** |
| **Drag & Drop Ordering** | `react-beautiful-dnd` updates rank via Meteor method | Not implemented | **Missing** |
| **Broken Merge Tags Warning** | Red exclamation icon & tooltip indicating invalid or broken tags | Not implemented | **Missing** |
| **Email Modal: Metadata Fields** | Name, Subject, Description, Reply-To, Sender Name | Not implemented | **Missing** |
| **Email Modal: Attachments** | Single file attachment selector via `AttachFilesToEmail` | Not implemented | **Missing** |
| **Email Modal: Visual Editor** | Unlayer visual drag-and-drop editor (`react-email-editor`) | Not implemented | **Missing** |
| **Email Modal: HTML Fallback** | Classic HTML textarea fallback with Handlebars syntax support | Not implemented | **Missing** |
| **Text Modal: Message & Limits** | Plain text textarea with live 1600-character counter | Not implemented | **Missing** |
| **Scheduled Actions Binding** | Relative interval, unit (days/weeks/months/hours), before/after, dateType | Handled in configuration remapping only; no UI editor | **Missing** |
| **JSON Import/Export Remapping** | Remaps templates and scheduled action foreign keys | Fully implemented in `StudyConfigurationService.java` | **Parity** |

---

## Section E: Template Lifecycle & CRUD Workflows

### 1. Create Workflow
1. User clicks **Add Template** under Email or Text section.
2. Modal opens with clean default state.
3. User enters required fields:
   - Email: `Name` (*unique), `Subject` (*required), `Description`, `Reply-To` (valid email regex), `Sender Name`, Content (HTML/Design), Attachments (max 1), Scheduled Action (optional).
   - Text: `Name` (*unique), `Description`, `Message` (*required, max 1600 characters), Scheduled Action (optional).
4. Validation:
   - Name must not match any non-archived template in the study (case-insensitive).
   - Merge tags in message must compile with Handlebars syntax.
5. On save:
   - Generates unique ID (`tmpl_...` or UUID).
   - Appends template to study templates list.
   - If scheduled action is configured, binds it with `templateId`.

### 2. Copy Workflow
1. User clicks **Copy** on an active template row.
2. Server duplicates template document:
   - Sets name to `"Copy of " + original.name`.
   - Generates a new template ID.
   - Resets rank and audit fields.
   - If original has an attached scheduled action, duplicates scheduled action with new `templateId`.
3. UI displays confirmation toast and refreshes template list.

### 3. Archive & Restore Workflows
- **Archive**:
  - Only accessible on active templates (`archived !== true`).
  - Displays confirmation dialog: *"Are you sure you want to archive the template?"*.
  - Sets `archived = true`. Does not delete scheduled action, but suppresses active execution.
- **Restore**:
  - Only accessible on archived templates (`archived === true`).
  - Displays confirmation dialog: *"Are you sure you want to restore the template?"*.
  - Sets `archived = false`.

### 4. Delete Workflow
- Only accessible on archived templates.
- Displays warning dialog: *"Are you sure you want to delete the template?"*.
- Permanently removes template and its associated scheduled action from study configuration.

### 5. Reordering (Rank Management)
- Drag-and-drop reorders templates within the active or archived group.
- Ranks are saved as continuous integers (`0, 1, 2, ...`).
- When fetching templates, sorting order is:
  1. Active templates first (`archived: false`), then Archived (`archived: true`).
  2. Rank ascending (`rankA - rankB`).
  3. Creation date ascending (`insertedAt`).

---

## Section F: Merge Tags, Templating Syntax, and Validation Engine

### 1. Templating Engine
Legacy Ripple relies on **Handlebars** (`{{tag}}`) for template variable substitution.

### 2. Standard Built-in Merge Tags
From `server/helpers/populateTemplate.js`:
- `{{participant_first_name}}`: Participant first name
- `{{participant_last_name}}`: Participant last name
- `{{birthday}}` or `{{participant_birthday}}`: Formatted birthday
- `{{participant_sex}}`: Sex
- `{{participant_ethnicity}}`: Ethnicity
- `{{participant_race}}`: Race
- `{{participant_current_age}}`: Calculated current age in years
- `{{study_name}}`: Study long name or name
- `{{custom_id}}`: Participant study Custom ID
- `{{participant_global_id}}`: Global participant identifier
- `{{participant_family_id}}`: Family group identifier
- `{{event_name}}`: Name of next scheduled appointment
- `{{event_date}}`: Formatted datetime of next scheduled appointment
- `{{current_user_name}}`: Full name of logged-in staff sending the communication
- `{{current_user_first_name}}`, `{{current_user_last_name}}`: Staff first/last name
- `{{current_user_phone_number}}`: Staff phone number
- `{{current_user_title}}`: Staff title
- `{{email_reminder_link}}`: Secure hashed survey URL
- `{{email_reminder_password}}`: One-time survey access token

### 3. Dynamic Merge Tags
- `{{event_<eventName>_scheduled_date}}`: Specific date/time for a named event (e.g., `{{event_baseline_visit_scheduled_date}}`).
- `{{custom_variable_<variableName>}}`: Participant value for a named study custom variable (e.g., `{{custom_variable_cohort_id}}`).

### 4. Validation Rules
- Tags must be enclosed in double curly braces `{{...}}`.
- Malformed syntax (unclosed braces, mismatched helper expressions) triggers a compilation error.
- In `TemplatesList.jsx`, `checkMessageForBadMergeTags()` flags nonexistent variable names with a visible tooltip warning.

---

## Section G: Scheduled Actions & Event Trigger Integration

### 1. Concept
In Ripple, an email or text template can be configured as an automated scheduled communication triggered relative to a study milestone or participant event.

### 2. Trigger Types (`ActionTriggerTypes`)
- `Event`: Triggers relative to a study Event (e.g., Intake, Follow-up Visit).
- `Variable`: Triggers relative to a built-in participant date (e.g., Birthday).
- `CustomVariable`: Triggers relative to a date-type Custom Variable.

### 3. Schedule Rules
- **Relative Interval**: Positive integer (e.g., `1`, `2`, `24`).
- **Relative Unit**: `hours`, `days`, `weeks`, `months`.
- **Before or After**:
  - `before`: Sent before the target event date (e.g., 2 days before appointment).
  - `after`: Sent after the target event date (e.g., 1 day after intake).
- **Date Type**: `scheduled` (appointment date) vs `actual` (completed date).

---

## Section H: Rich Text / HTML Email Editor vs Classic Plain Text vs SMS Constraints

### 1. Email Templates: Dual-Mode Editor
Legacy Ripple uses a dual-mode approach:
1. **Unlayer Visual Editor (`react-email-editor`)**: Drag-and-drop WYSIWYG editor storing visual layout JSON in `design` and compiled HTML in `message`.
2. **Classic HTML Fallback**: Standard textarea where users can write HTML and insert Handlebars tags directly.
- **Attachment Constraint**: Legacy Ripple restricts email attachments to **1 file** per template.

### 2. Text (SMS) Templates: Constraints
- Plain text only (no HTML tags).
- Merge tags supported.
- Hard limit of **1600 characters** (standard SMS multi-segment ceiling). Live counter displayed: `"<count> / 1600"`.

---

## Section I: Security, Authorization & Multi-Tenancy Considerations

### 1. Study-Level Permissions
- In legacy Ripple, viewing templates requires Study Leader permission (`isUserStudyLeader(studyId)`).
- Modifying, copying, archiving, restoring, or deleting templates requires Study Admin permission (`isUserStudyAdmin(studyId)`).
- In EnrollNow, this aligns with:
  - Read: `canView` or `STUDY_VIEW` / `STUDY_MANAGE`.
  - Write: `canManageSettings` (`STUDY_MANAGE` / Study Admin).

### 2. Multi-Tenancy Isolation
- All template queries and mutations must enforce `tenantId` and `studyId`.
- No cross-tenant access to templates, file attachments, or custom variable references.

---

## Section J: Database Schema & Migration Strategy

### 1. Persistence Architectural Options

#### Option A: JSONB Configuration Storage in `enrollnow.study_requirements` (Recommended for Study Settings Parity)
- **Rationale**:
  - Matches the existing architectural pattern established for **Display Settings** and **Bulk Tasks**.
  - `StudyConfigurationService` already manages `emailTemplates`, `textTemplates`, and `scheduledActions` in `configuration` JSONB during study cloning and incremental import/export.
  - Zero database schema changes required.
  - Guarantees zero regression risk to existing Flyway migrations.

#### Option B: Standalone Relational Tables (`communication_templates` in `V13__communications.sql`)
- **Rationale**:
  - Useful for high-volume execution of actual communications and broadcast campaigns.
  - However, mapping Study Settings template definitions to `communication_templates` would require bridging two different data models and changing how incremental import/export functions.

### Recommendation
Store Study Settings template definitions inside `study_requirements.configuration` JSONB (Option A), exactly like `bulkTasks` and `customVariables`, with typed backend DTOs. If the platform executes live outbound communications via `enrollnow-communication-service` in a future release, it can synchronize templates from study configuration.

---

## Section K: Implementation Roadmap & Phased Execution Plan (Phase 2 Preview)

### Step 1: Backend DTOs and Service Methods (`enrollnow-study-service`)
1. Create DTOs:
   - `StudyEmailTemplateDto`, `StudyTextTemplateDto`, `StudyScheduledActionDto`
   - `SaveEmailTemplateRequest`, `SaveTextTemplateRequest`, `ReorderTemplatesRequest`
   - `StudyEmailTextSettingsResponse`
2. Implement service methods in `StudyConfigurationService` / `StudyService`:
   - `getEmailAndTextSettings(UUID tenantId, String studyId)`
   - `createEmailTemplate`, `updateEmailTemplate`, `copyEmailTemplate`, `archiveEmailTemplate`, `restoreEmailTemplate`, `deleteEmailTemplate`, `reorderEmailTemplates`
   - Matching methods for Text Templates.
   - Case-insensitive duplicate name validation against active templates.
   - Handlebars merge tag compiler check.

### Step 2: REST Controller Endpoints (`StudyController.java`)
Expose standard REST endpoints:
- `GET /api/v1/studies/{studyId}/email-templates`
- `POST /api/v1/studies/{studyId}/email-templates`
- `PUT /api/v1/studies/{studyId}/email-templates/{templateId}`
- `POST /api/v1/studies/{studyId}/email-templates/{templateId}/copy`
- `PUT /api/v1/studies/{studyId}/email-templates/{templateId}/archive`
- `PUT /api/v1/studies/{studyId}/email-templates/{templateId}/restore`
- `DELETE /api/v1/studies/{studyId}/email-templates/{templateId}`
- `PUT /api/v1/studies/{studyId}/email-templates/order`
- Matching endpoints for `/text-templates`.

### Step 3: Frontend API Client & Types (`shared/api/studyApi.ts`)
Add TypeScript interfaces and API methods mirroring backend contracts.

### Step 4: Frontend UI Components (`microfrontends/study`)
1. `StudySettingsEmailAndText.tsx`: Main container rendering header, Email section, and Text section.
2. `TemplatesList.tsx`: Accessible table with drag-and-drop reordering, badges, tooltips for broken tags, and action buttons (`Copy`, `Archive`, `Restore`, `Delete`).
3. `EmailTemplateModal.tsx`: Accessible modal with metadata inputs, rich text/HTML editor, merge tags picker, and scheduled action trigger configuration.
4. `TextTemplateModal.tsx`: Accessible modal with plain text textarea, character counter (1600 limit), merge tags picker, and scheduled action trigger configuration.
5. Wire component into `StudySettingsWorkspace.tsx` under `activeSubmenu === 'email_and_text'`.

---

## Section L: Verification Checklist & Acceptance Criteria

- [ ] **Email Templates CRUD**: Create, read, edit, copy, archive, restore, delete email templates.
- [ ] **Text Templates CRUD**: Create, read, edit, copy, archive, restore, delete text templates.
- [ ] **Status Filtering**: Filter templates by Active, Archived, and All.
- [ ] **Drag & Drop Ordering**: Reorder templates within active and archived groups; persistent ranking.
- [ ] **Duplicate Name Validation**: Prevent saving templates with identical names to active templates (case-insensitive).
- [ ] **Merge Tags Support**: Support all participant, event, study, and custom variable tags.
- [ ] **Character Counter**: Real-time counter for text templates enforcing 1600-character ceiling.
- [ ] **Scheduled Action Binding**: Associate templates with event/variable triggers and relative intervals.
- [ ] **Permission Enforcement**: View-only mode for non-admin study members; mutations restricted to Study Admins.
- [ ] **Non-Interference**: Zero impact on Details, Display, or Bulk Tasks submenus.
- [ ] **Full Test Suite Passing**: Backend JUnit tests and frontend Vitest suites pass cleanly.

---
*Report generated and verified against source repositories. Ready for Phase 2 implementation.*
