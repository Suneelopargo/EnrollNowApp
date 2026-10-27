# EnrollNow Registry — Legacy Ripple Contact Log Implementation Report

## 1. Executive Summary

This report documents the end-to-end migration and implementation of the Participant Contact Log functionality from legacy Ripple into the EnrollNow production architecture. The implementation achieves complete functional and behavioral parity with legacy Ripple contact management while maintaining EnrollNow's multi-tenant isolation, PostgreSQL persistence, Spring Boot REST architecture, and React microfrontend UI standards.

All fabricated mock data, hardcoded comments, and placeholder tabs have been removed and replaced with production-grade backend persistence and dynamic option fetching.

---

## 2. Architecture & Design Decisions

### 2.1 Database Persistence (`enrollnow.participant_contact_logs`)

In legacy Ripple, contact logs were stored as an embedded BSON array inside the `study_participants` collection documents (`contactLog` sub-schema). In EnrollNow's relational PostgreSQL model, a dedicated table was created via Flyway migration `V24__participant_contact_logs.sql`:

1. **`enrollnow.contact_outcomes`**:
   - Stores configurable and standard contact outcome options per tenant (and system defaults).
   - Pre-seeded with canonical outcomes: `Completed`, `Left Voicemail`, `Busy`, `No Answer`, `Disconnected / Wrong Number`, `Callback Requested`, `Refused / Declined`, `Other`.
2. **`enrollnow.participant_contact_logs`**:
   - Primary key `id` (UUID).
   - Scoped by `tenant_id` (UUID) with composite foreign key to `enrollnow.participants(tenant_id, id)` ensuring strict tenant boundary isolation.
   - Optional `study_id` (UUID) linking to `enrollnow.studies(id)`.
   - Fields: `date_time_of_contact`, `contact_type`, `contact_method`, `contacted_by`, `spoke_to`, `regarding`, `outcome`, `comments`, `sticky` (pinned), `notify`, `global`, `last_contact`, `created_at`, `created_by`, `updated_at`, `updated_by`.
   - Comprehensive performance indexes on `(tenant_id, participant_id, sticky DESC, date_time_of_contact DESC)`, `(tenant_id, study_id)`, and `(tenant_id, date_time_of_contact DESC)`.
3. **`enrollnow.participants.global_last_contact_date`**:
   - Added `global_last_contact_date TIMESTAMPTZ` column to `enrollnow.participants` to store the participant's global date of last contact without table scanning.

### 2.2 Last-Contact Semantics & Parity Logic

Matching legacy Ripple methods `updateLastContact.js` and `updateGlobalLastContact.js`:
- When logging in **Global Registry context** (`studyId == null`):
  - If marked `lastContact = true`, sets `participant.global_last_contact_date = contactDate`.
- When logging in **Study context** (`studyId != null`):
  - Updates the corresponding `study_candidates.last_contact_at` if the contact date is later than the existing candidate timestamp.
  - Recalculates `participant.global_last_contact_date` to be the latest date across all study candidate contacts and registry contacts.
- On **Deletion** of a contact log marked as `lastContact`:
  - Recalculates `global_last_contact_date` from the latest remaining contact log for that participant, preventing orphaned or stale timestamps.

### 2.3 Elimination of Mock Data and Hardcoded Fallbacks

1. **Backend Mapper (`ParticipantRegistryService.java`)**:
   - Replaced hardcoded fallback `'Recent'` and fake `'FAM-10001'` family IDs.
   - Accurately maps `participant.globalLastContactDate` (formatted to ISO-8601 string) and real `familyId`.
2. **Frontend Dashboard Mapper (`RegistryDashboard.tsx`)**:
   - Cleaned `p.lastContact || p.globalDateOfLastContact || ''` (eliminated `'Recent'`).
   - Cleaned `familyId: p.familyId || ''` (eliminated `'FAM-10001'`).
   - Cleaned `dateCreated: p.dateCreated || ''` and `globalId: p.globalId || ''`.
3. **Participant Detail Modal (`ParticipantDetailModal.tsx`)**:
   - Removed fake hardcoded comments array (`'Dr. Sarah Connor'`, `'Coordinator Mark'`).
   - Replaced contact placeholder with `<ParticipantContactLogs />`.

---

## 3. Production API Endpoints Implemented

All endpoints are secured under `/api/v1/participants`, enforce tenant isolation via `TenantContextHolder`, and record `AuditEvent` audit trails:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/participants/{participantId}/contact-logs` | Retrieve contact logs for participant (pinned first, then date descending). |
| `GET` | `/api/v1/participants/{participantId}/contact-logs/{logId}` | Retrieve a specific contact log. |
| `POST` | `/api/v1/participants/{participantId}/contact-logs` | Create and persist contact log, update last contact, and record audit event. |
| `PUT` | `/api/v1/participants/{participantId}/contact-logs/{logId}` | Update existing contact log and refresh last contact state if modified. |
| `PATCH` | `/api/v1/participants/{participantId}/contact-logs/{logId}/pin` | Toggle pinned (`sticky`) status. |
| `DELETE` | `/api/v1/participants/{participantId}/contact-logs/{logId}` | Delete contact log, recalculate last contact, and audit deletion. |
| `GET` | `/api/v1/participants/contact-types` | Fetch dynamic contact types (e.g., Phone Call, Email, In-Person). |
| `GET` | `/api/v1/participants/contact-outcomes` | Fetch dynamic contact outcomes from `enrollnow.contact_outcomes`. |
| `GET` | `/api/v1/participants/{participantId}/contact-methods` | Fetch participant-specific contact methods with `isPreferred` indicator. |
| `GET` | `/api/v1/participants/contact-team-members` | Fetch study team members / staff eligible for `contactedBy`. |

---

## 4. Frontend Microfrontend Implementation

### 4.1 Components

1. **`AddContactLogModal.tsx`**:
   - Production dialog using shared design system `Modal`.
   - Form fields: Contact Type (with dynamic "+ Add custom type" toggle), Contact Date/Time (`datetime-local`), Contacted By (dropdown populated from team members API), Method (with dynamic "+ Add custom method" toggle), Spoke To, Regarding, Outcome (with "+ Other" free text specification), Comments.
   - Checkboxes: "Date of Last Contact" (default true), "Pin Contact", "Notify Team", "Global Registry Record".
   - Client-side validation: highlights missing required fields (`contactType`, `dateTimeOfContact`, `contactedBy`, `outcome`) with accessible ARIA error messages.
   - Supports both Create mode and Edit mode (prepopulating fields from existing log).
2. **`ParticipantContactLogs.tsx`**:
   - Header with outreach summary count, refresh action, and "+ Add Contact" button.
   - Cards/list with pinned status indicator (amber highlight & pin badge), formatted date/time, type pill, outcome pill, and global badge (`Global (Registry)` or `Global (<studyName>)`).
   - Detailed metadata display: Contacted By, Method, Spoke To, Regarding, and Comments callout.
   - Inline Pin toggle calling `/pin` endpoint.
   - Edit button opening `AddContactLogModal`.
   - Delete button opening confirmation dialog requiring user to type `DELETE`.
3. **`ParticipantDetailModal.tsx`**:
   - Activated via existing participant grid row click and detail modal.
   - Under `activeTab === 'contact'`, renders `<ParticipantContactLogs />`.
   - Emits `onParticipantUpdated` when contact logs change to refresh parent participant last contact date.
4. **`RegistryDashboard.tsx`**:
   - Preserves existing participant selection and row-click navigation.
   - Updates participant records and details drawer reactively upon contact log persistence.

---

## 5. Verification Summary

- **Backend Unit & Controller Tests**:
  - `ParticipantContactLogServiceTest`: 8 tests covering retrieval, creation, last-contact calculations, updates, pin toggling, and deletion recalculation.
  - `ParticipantContactLogControllerTest`: 6 tests verifying all REST endpoints, status codes (200, 201, 204), and error handling.
  - Overall `enrollnow-participant-service` suite: **79 tests passed (0 failures, 0 errors)**.
- **Frontend Unit & Integration Tests**:
  - `contactLog.test.ts`: 15 tests covering API client calls, dynamic option loading, component rendering, required validation, edit mode, and mock data absence.
  - Overall `@enrollnow/mfe-participant` suite: **44 tests passed (0 failures, 0 errors)**.
  - TypeScript type check (`tsc --noEmit`): Clean, zero errors.
  - Frontend production build (`tsc --noEmit`): Succeeded.
