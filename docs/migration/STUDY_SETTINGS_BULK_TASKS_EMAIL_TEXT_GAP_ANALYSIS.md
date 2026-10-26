# EnrollNow — Study Settings Baseline Gap Analysis
## Scope: Bulk Tasks and Email and Text

> **Document Version:** 1.0.0  
> **Date:** October 26, 2026  
> **Scope:** Study Settings → Bulk Tasks (`bulk_tasks`) and Study Settings → Email and Text (`email_and_text`)  
> **Status:** Baseline Established — Proceeding with Implementation & Verification  

---

## 1. Executive Summary

This document establishes the comprehensive baseline comparison between the legacy Ripple application (`D:\ProjectsWorkSpace\ProjectCode\EnrollnowSpace\ripple`) and the current EnrollNow implementation (`d:\ProjectsWorkSpace\ProjectCode\EnrollnowSpace\EnrollNowApp`) across the two targeted Study Settings submenus:
1. **Study Settings → Bulk Tasks**
2. **Study Settings → Email and Text**

The evaluation traces each capability across the full technical stack: frontend components, route handling, shared dialogs, form validation, API client methods, backend REST controllers, service classes, domain models, DTOs, persistence (`enrollnow.study_requirements` JSONB configuration), authorization, tenant isolation, and import/export compatibility.

---

## 2. Baseline Gap Inventory Matrix

| ID | Submenu | Capability | Legacy Ripple behavior | Existing EnrollNow behavior | Evidence | Gap | Planned remediation |
|:---|:---|:---|:---|:---|:---|:---|:---|
| **BT-01** | Bulk Tasks | Task Group Listing | Groups rendered with group name button, description, trigger status, and table of tasks (`bulk-tasks.jsx`) | Fully implemented in `StudySettingsBulkTasks.tsx` rendering groups, event triggers, and nested task tables | `StudySettingsBulkTasks.tsx#L500-L650`, `bulk-tasks.jsx#L760-L786` | Fully implemented and verified | None required; preserve existing implementation |
| **BT-02** | Bulk Tasks | Add/Edit Task Group | Modal editor for Name (*required), Description, Trigger toggle, Event selection, Action selection (`completed`/`scheduled`) | Implemented with modal form, validation, and backend persistence | `StudySettingsBulkTasks.tsx#L680-L820`, `StudyService.java#L1209-L1239` | Fully implemented and verified | None required; preserve existing implementation |
| **BT-03** | Bulk Tasks | Delete Task Group & Cascade | Delete button in edit modal with confirmation (`deleteBulkTaskGroup`); cascades deletion to all tasks in group | Implemented in `deleteBulkTaskGroup`; removes group and all tasks with matching `bulkTaskGroupId` | `bulk_task_groups.js#L123-L127`, `StudyConfigurationService.java#L1596-L1601` | Fully implemented and verified | None required; preserve existing implementation |
| **BT-04** | Bulk Tasks | Add/Edit Task in Group | Modal editor for Title (*required), Description, Assigned To multi-select from study team members | Implemented in `StudySettingsBulkTasks.tsx` with member multi-select and initials computation | `StudySettingsBulkTasks.tsx#L850-L980`, `StudyService.java#L1255-L1285` | Fully implemented and verified | None required; preserve existing implementation |
| **BT-05** | Bulk Tasks | Delete Task | Delete button in edit task modal with warning confirmation | Implemented in `deleteBulkTask` with confirmation dialog and state refresh | `StudySettingsBulkTasks.tsx#L960-L975`, `StudyConfigurationService.java#L1647-L1665` | Fully implemented and verified | None required; preserve existing implementation |
| **BT-06** | Bulk Tasks | Task Drag-and-Drop Reorder | Tasks within a group reordered via drag handle; contiguous ranks saved (`updateBulkTaskOrder`) | Implemented via HTML5 drag-and-drop and accessible Up/Down controls calling `/tasks/order` | `StudySettingsBulkTasks.tsx#L400-L450`, `StudyConfigurationService.java#L1667-L1690` | Fully implemented and verified | None required; preserve existing implementation |
| **BT-07** | Bulk Tasks | Team Member Assignment & Initials | Multi-select populated with study members; displays uppercase initials (e.g., "JD AS") | Backend computes `assignedToInitials` from user names; frontend displays them in table | `StudyService.java#L1180-L1186`, `StudySettingsBulkTasks.tsx#L610-L618` | Fully implemented and verified | None required; preserve existing implementation |
| **BT-08** | Bulk Tasks | Event Triggers Configuration | Optional trigger linking task group to study event on `completed` or `scheduled` | Implemented in group modal; pulls active study events and binds trigger object | `StudySettingsBulkTasks.tsx#L740-L780`, `SaveBulkTaskGroupRequest.java` | Fully implemented and verified | None required; preserve existing implementation |
| **ET-01** | Email and Text | Workspace Navigation & View | Submenu navigates to Email & Text screen rendering Email and Text sections | Navigation button exists, but body renders coming-soon placeholder banner | `StudySettingsWorkspace.tsx#L101-L108, L258-L277` | Missing | Replace placeholder with `StudySettingsEmailAndText.tsx` container |
| **ET-02** | Email and Text | SMS Feature Toggle | Header and text section dynamically adjust based on `isTextMessagingEnabled()` (`Email and Text Settings` vs `Email Settings`) | Not implemented in workspace | `EmailTextSettings.jsx#L6-L15` | Missing | Add support for toggle check or default to unified Email and Text mode |
| **ET-03** | Email and Text | Email Templates List & Filters | Displays table with filter (`Active Emails`, `Archived Emails`, `All Emails`), Name, Description, Actions, and drag handle | Not implemented | `EmailTemplates.jsx#L8-L23`, `TemplatesList.jsx#L50-L77` | Missing | Create `EmailTemplates.tsx` and shared `TemplatesList.tsx` with filter dropdown |
| **ET-04** | Email and Text | Text Templates List & Filters | Displays table with filter (`Active Texts`, `Archived Texts`, `All Texts`), Name, Description, Actions, and drag handle | Not implemented | `TextTemplates.jsx#L8-L23`, `TemplatesList.jsx#L50-L77` | Missing | Create `TextTemplates.tsx` and shared `TemplatesList.tsx` with filter dropdown |
| **ET-05** | Email and Text | Template Lifecycle Actions | Active: `Copy` and `Archive`; Archived: `Restore` and `Delete` with confirmation dialogs | Not implemented | `TemplatesList.jsx#L150-L192`, `templateActionModals.js#L31-L94` | Missing | Implement lifecycle handlers calling REST endpoints with accessible confirmation modals |
| **ET-06** | Email and Text | Copy Template Semantics | Duplicates template, names it `"Copy of " + original.name`, resets ID and audit, clones attached scheduled action | Implemented in import only; no REST API or UI action | `collections/email_templates.js#L113-L174`, `collections/text_templates.js#L74-L133` | Missing | Implement `copyEmailTemplate` and `copyTextTemplate` endpoints and services |
| **ET-07** | Email and Text | Archive / Restore Semantics | Soft-deletion via `archived: true/false`; preserved in database; filtered by status | Not implemented in service or REST layer | `collections/email_templates.js#L436-L465`, `collections/text_templates.js#L335-L363` | Missing | Implement `archiveEmailTemplate`, `restoreEmailTemplate`, and text equivalents |
| **ET-08** | Email and Text | Permanent Delete Semantics | Hard-deletes template and cascades deletion of attached scheduled action; restricted to archived | Not implemented in service or REST layer | `collections/email_templates.js#L466-L486`, `collections/text_templates.js#L364-L383` | Missing | Implement `deleteEmailTemplate` and `deleteTextTemplate` endpoints and services |
| **ET-09** | Email and Text | Drag & Drop Reordering | Reorder templates within active and archived groups; contiguous ranks saved (`updateEmailTemplateRanks`) | Not implemented | `useTemplateOrder.js#L42-L87`, `collections/email_templates.js#L488-L505` | Missing | Implement drag-and-drop table with rank persistence via `/email-templates/order` and `/text-templates/order` |
| **ET-10** | Email and Text | Broken Merge Tags Visual Warning | Displays red exclamation warning icon with tooltip indicating invalid or broken tags | Not implemented | `TemplatesList.jsx#L124-L141`, `checkMessageForBadMergeTags.js` | Missing | Implement client-side tag validation highlighting invalid merge tag syntax |
| **ET-11** | Email and Text | Email Template Modal Editor | Modal editor for Name (*required, duplicate-checked), Subject (*required), Description, Reply-To, Sender Name, Content, Scheduled Action | Not implemented | `EmailTemplateModal.jsx#L53-L400` | Missing | Implement `EmailTemplateModal.tsx` with all fields and validation |
| **ET-12** | Email and Text | Text Template Modal Editor | Modal editor for Name (*required, duplicate-checked), Description, Message (*required, 1600-character ceiling with counter), Scheduled Action | Not implemented | `TextTemplateModal.jsx#L49-L250` | Missing | Implement `TextTemplateModal.tsx` with live character counter |
| **ET-13** | Email and Text | Scheduled Actions Binding | Binds template to Event, Variable, or CustomVariable trigger with relative interval, unit, before/after, dateType | Handled in import remapping only; no UI editor or CRUD API | `collections/scheduled_actions.js#L88-L112`, `EmailTemplateModal.jsx#L306-L322` | Missing | Implement scheduled action selector in modals and persist in configuration JSONB |
| **ET-14** | Email and Text | Dual-Mode Email Content | Unlayer visual editor (`react-email-editor`) and classic HTML fallback | Not implemented | `EmailTemplateModal.jsx#L60-L130` | Partially Implemented | Provide robust HTML textarea with merge tag insertion buttons and preview; preserve `design` JSON schema |
| **ET-15** | Email and Text | Backend REST Endpoints | Meteor methods for CRUD, copy, archive, restore, reorder | No endpoints in `StudyController.java` | `StudyController.java` | Missing | Add complete REST controller endpoints in `StudyController.java` |
| **ET-16** | Email and Text | Service Layer Persistence | Stored in `enrollnow.study_requirements.configuration` JSONB | Handled in `StudyConfigurationService` during import only | `StudyConfigurationService.java#L121-L123, L734-L775` | Missing | Implement full service methods in `StudyConfigurationService` and `StudyService` |
| **ET-17** | Email and Text | Frontend API Client | Client methods for querying and mutating templates | Not in `studyApi.ts` | `frontend/shared/api/studyApi.ts` | Missing | Add TypeScript DTOs and API methods to `studyApi.ts` |
| **ET-18** | Email and Text | Negative Authorization & Tenant Isolation | Viewing requires Study Leader/View; mutations require Study Admin (`STUDY_MANAGE`) with tenant verification | Not implemented for templates | `collections/email_templates.js#L197-L200`, `StudyService.java#L1236` | Missing | Enforce `resolveCanManageStudySettings` and `study.getTenantId()` on all template mutations |

---

## 3. Planned Remediation Steps

1. **Step 1: Backend DTOs & Service Methods (`enrollnow-study-service`)**:
   - Create DTOs: `StudyEmailTemplateDto`, `StudyTextTemplateDto`, `StudyScheduledActionDto`, `SaveEmailTemplateRequest`, `SaveTextTemplateRequest`, `ReorderTemplatesRequest`, `StudyEmailTextSettingsResponse`.
   - Implement CRUD, copy, archive, restore, and reordering methods in `StudyConfigurationService` and `StudyService`.
   - Enforce case-insensitive duplicate name validation among active templates.
   - Enforce cascade removal of scheduled actions when a template is deleted.
2. **Step 2: REST Controller Endpoints (`StudyController.java`)**:
   - Expose endpoints for `/email-templates` and `/text-templates` under `/tenants/{tenantId}/studies/{studyId}` and `/studies/{studyId}`.
   - Enforce study authorization and tenant boundaries.
3. **Step 3: Frontend API Client (`shared/api/studyApi.ts`)**:
   - Add TypeScript contracts and API methods for all email and text template operations.
4. **Step 4: Frontend Components (`microfrontends/study`)**:
   - Create `StudySettingsEmailAndText.tsx`, `EmailTemplateModal.tsx`, and `TextTemplateModal.tsx`.
   - Implement status filters (`Active`, `Archived`, `All`), action dialogs (`Copy`, `Archive`, `Restore`, `Delete`), live character counter for SMS, merge tag insertions, and scheduled action configuration.
   - Wire into `StudySettingsWorkspace.tsx` under `activeSubmenu === 'email_and_text'`.
5. **Step 5: Testing & Verification**:
   - Add comprehensive unit and integration tests covering CRUD, lifecycle actions, reordering, validation, authorization, and non-interference.
   - Run typecheck, frontend build, and backend test suites.
   - Produce final remediation report and parity matrix.
