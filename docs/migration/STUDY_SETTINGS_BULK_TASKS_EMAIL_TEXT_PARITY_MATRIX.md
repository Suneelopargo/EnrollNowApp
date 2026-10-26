# Study Settings: Bulk Tasks and Email & Text Parity Matrix

This parity matrix establishes item-by-item verification comparing the authoritative legacy Ripple application (`D:\ProjectsWorkSpace\ProjectCode\EnrollnowSpace\ripple`) with the current EnrollNow implementation.

---

## 1. Study Settings → Bulk Tasks Parity Matrix

| Feature / Behavior | Legacy Ripple Reference | EnrollNow Implementation | Status | Verification Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **Bulk Task Groups Display** | `client/components/authenticated/studyPages/settings/BulkTasks.jsx` (`renderBulkTaskGroups`) | `StudySettingsBulkTasks.tsx` | Verified Parity | Renders group title, description, trigger status, task list, "+ Add Task", and actions. |
| **Create Task Group** | `imports/collections/bulk_task_groups/methods/insertBulkTaskGroup.js` | `StudyConfigurationService.createBulkTaskGroup()` / POST `/bulk-task-groups` | Verified Parity | Tested in `StudyConfigurationServiceTest.bulkTasks_createGroupAndCascadeDeleteTasks()`. Persists to JSONB. |
| **Edit Task Group** | `imports/collections/bulk_task_groups/methods/updateBulkTaskGroup.js` | `StudyConfigurationService.updateBulkTaskGroup()` / PUT `/bulk-task-groups/{id}` | Verified Parity | Verified payload updates name, description, and event triggers. |
| **Delete Task Group** | `imports/collections/bulk_task_groups/methods/deleteBulkTaskGroup.js` | `StudyConfigurationService.deleteBulkTaskGroup()` / DELETE `/bulk-task-groups/{id}` | Verified Parity | Confirmed cascading deletion of associated tasks in `StudyConfigurationServiceTest`. |
| **Group Trigger Configuration** | `triggerActive`, `trigger.eventId`, `trigger.action` (`'completed'` \| `'scheduled'`) | `BulkTaskTrigger` DTO & JSONB mapping | Verified Parity | Selects study event from dropdown, maps trigger active flag and completion action. |
| **Create Task in Group** | `imports/collections/bulk_tasks/methods/insertBulkTask.js` | `StudyConfigurationService.createBulkTask()` / POST `/bulk-task-groups/{id}/tasks` | Verified Parity | Sets initial rank to group task count, assigns `bulkTaskGroupId`, maps assigned team members. |
| **Edit Task** | `imports/collections/bulk_tasks/methods/updateBulkTask.js` | `StudyConfigurationService.updateBulkTask()` / PUT `/bulk-tasks/{id}` | Verified Parity | Updates name, description, assignee list. |
| **Delete Task** | `imports/collections/bulk_tasks/methods/deleteBulkTask.js` | `StudyConfigurationService.deleteBulkTask()` / DELETE `/bulk-tasks/{id}` | Verified Parity | Deletes task, normalizes remaining ranks in group. |
| **Reorder Tasks within Group** | `imports/collections/bulk_tasks/methods/updateBulkTaskRanks.js` | `StudyConfigurationService.reorderBulkTasks()` / PUT `/bulk-task-groups/{id}/tasks/order` | Enhanced Parity | Drag-and-drop plus accessible keyboard Move Up/Down buttons. Verified in `StudyConfigurationServiceTest`. |
| **Team Member Initials Badge** | `both/helpers/users.js` (`getInitials`) | `StudySettingsBulkTasks.tsx` (`resolveAssigneeNames`) | Verified Parity | Formats team member full name or displays 2-letter uppercase initials badge. |
| **Read-Only / Archived Enforcement** | Disabled controls when user lacks study settings permissions | `effectiveCanManage = canManageSettings && !isArchived && serverCanManage` | Verified Parity | Banners shown, action buttons disabled, inputs read-only. |

---

## 2. Study Settings → Email and Text Parity Matrix

| Feature / Behavior | Legacy Ripple Reference | EnrollNow Implementation | Status | Verification Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **Email & Text Layout** | `client/components/authenticated/studyPages/settings/emails/EmailTextSettings.jsx` | `StudySettingsEmailAndText.tsx` | Verified Parity | Renders Email Templates and Text Templates sections; conditionally toggles Text section based on enablement. |
| **Email Filter Options** | `EmailTemplates.jsx` (`Active Emails`, `Archived Emails`, `All Emails`) | `StudySettingsEmailAndText.tsx` (`emailFilter`) | Verified Parity | Tested in `studySettingsEmailAndText.test.tsx`. Correctly filters `archived === false`, `archived === true`, or all. |
| **Text Filter Options** | `TextTemplates.jsx` (`Active Texts`, `Archived Texts`, `All Texts`) | `StudySettingsEmailAndText.tsx` (`textFilter`) | Verified Parity | Tested in `studySettingsEmailAndText.test.tsx`. Correctly filters active vs archived SMS templates. |
| **Email Template Creation** | `collections/email_templates.js` (`insertEmailTemplate`) | `StudyConfigurationService.createEmailTemplate()` / POST `/email-templates` | Verified Parity | Validates name & subject required. Tested in `StudyConfigurationServiceTest`. |
| **Email Template Update** | `collections/email_templates.js` (`updateEmailTemplate`) | `StudyConfigurationService.updateEmailTemplate()` / PUT `/email-templates/{id}` | Verified Parity | Updates subject, description, senderName, replyTo, content, and scheduled action. |
| **Email Template Copy** | `both/emailTemplates/copyEmailTemplate.js` | `StudyConfigurationService.copyEmailTemplate()` / POST `/email-templates/{id}/copy` | Verified Parity | Clones template with `"Copy of "` prefix; duplicates attached scheduled action with new UUID. |
| **Email Template Archive** | `both/emailTemplates/archiveEmailTemplate.js` | `StudyConfigurationService.archiveEmailTemplate()` / PUT `/email-templates/{id}/archive` | Verified Parity | Sets `archived: true`. Shifts from active table to archived filter. |
| **Email Template Restore** | `both/emailTemplates/restoreEmailTemplate.js` | `StudyConfigurationService.restoreEmailTemplate()` / PUT `/email-templates/{id}/restore` | Verified Parity | Sets `archived: false`. Enforces duplicate name check among active templates. |
| **Email Template Delete** | `both/emailTemplates/deleteEmailTemplate.js` | `StudyConfigurationService.deleteEmailTemplate()` / DELETE `/email-templates/{id}` | Verified Parity | Hard deletes template from JSONB array and cleans up any linked scheduled action. |
| **Email Template Reordering** | `client/components/authenticated/studyPages/settings/useTemplateOrder.js` | `StudyConfigurationService.reorderEmailTemplates()` / PUT `/email-templates/order` | Enhanced Parity | Accessible Move Up / Move Down buttons and drag handling. Updates rank sequence (0, 1, 2...). |
| **Text Template Creation** | `collections/text_templates.js` (`insertTextTemplate`) | `StudyConfigurationService.createTextTemplate()` / POST `/text-templates` | Verified Parity | Validates name and message. Enforces 1600 character limit. Tested in `StudyConfigurationServiceTest`. |
| **Text Template 1600 Char Limit** | `TextTemplateModal.jsx` (`MAX_MESSAGE_LENGTH = 1600`) | `MAX_SMS_LENGTH = 1600` in service & frontend | Verified Parity | Backend throws `InvalidStudyException`; frontend prevents input > 1600 chars and displays live counter `X / 1600`. |
| **Text Template Copy / Archive / Restore / Delete / Reorder** | `both/texts/` methods | `StudyConfigurationService` text mutation methods & `/text-templates` endpoints | Verified Parity | Complete SMS template lifecycle matching email behavior and legacy Ripple specifications. |
| **Broken Merge Tag Warning** | `checkMessageForBadMergeTags.js` | `checkMessageForBrokenMergeTags()` & UI warning indicator | Verified Parity | Red alert icon with tooltip displayed in table row for unclosed tags, empty tags, or syntax errors. |
| **Quick Merge Tag Helpers** | `TemplateVariablesHelp.jsx` | `STANDARD_MERGE_TAGS` quick insert buttons in modal | Verified Parity | One-click insertion of `{{firstName}}`, `{{lastName}}`, `{{customId}}`, `{{studyName}}`, `{{event_date}}`, etc. |
| **Scheduled Action Configuration** | `StudyScheduledActionTriggerSelector.jsx` & `imports/helpers/scheduledActions.js` | `StudyScheduledActionDto` & modal schedule controls | Verified Parity | Supports Event or Variable trigger, interval number, units (hours/days/weeks/months), timing (before/after), and date type (scheduled/actual). |
| **Active Name Uniqueness** | `isDuplicateName` check in Ripple modal | Backend & frontend case-insensitive uniqueness check | Verified Parity | Enforces uniqueness only among active templates (archived duplicates permitted until restore). |
| **Confirmation Modals** | SweetAlert confirmation dialogs in Ripple | `confirmModalOpen` accessible modal in EnrollNow | Enhanced Parity | Native accessible modal with focus trap, clear warning messages, and non-destructive defaults. |

---

## 3. Parity Summary

- **Total Features Audited**: 29
- **Verified Parity**: 26
- **Enhanced Parity** (Accessibility / UI / Safety Improvements): 3
  - Keyboard accessible reordering in addition to pointer drag-and-drop
  - Accessible native React modal dialogs replacing legacy third-party modal wrappers
  - Atomic JSONB persistence with transactional rollback replacing standalone Mongo collection mutations
- **Unresolved Parity Gaps**: 0
