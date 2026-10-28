# Participant Creation — Implementation Report

## 1. Executive Summary

This report documents the end-to-end implementation of the **Add Participant** workflow in EnrollNow, achieving full business and functional parity with the legacy Ripple application (`D:\ProjectsWorkSpace\ProjectCode\EnrollnowSpace\ripple`) while conforming to EnrollNow's React microfrontends, Spring Boot backend, and PostgreSQL database architecture.

The implementation completely eliminates client-side data fabrication (fake DOBs, fake emails, fake family IDs, fake pedigree trees, fake tags), restores the authoritative two-phase duplicate confirmation workflow, enforces server-generated global identifiers and creation metadata (`creationSource = 'registry'`), initializes clean default collections, and guarantees transactional integrity.

---

## 2. Legacy Ripple Analysis & Gaps Identified

### 2.1 Authoritative Legacy Sources
- **Modal Form & Duplicate Workflow**:
  - `ripple/client/components/authenticated/studyPages/modals/add-registry-participant-modal.jsx`:
    - Handles form submission with fields `firstName`, `middleName`, `lastName`.
    - Invokes `Meteor.call('findParticipantsByName', { firstName, lastName }, callback)`.
    - If duplicates are detected (`result && result.length > 0`):
      Sets `participantExists: true` and triggers warning:
      `"A matching participant with the same First Name & Last Name already exits. Please confim that you still want to add this participant."`
    - Modal button transforms into `"Confirm Add Participant"`, invoking `submitParticipant()`.
  - `ripple/client/components/authenticated/studyPages/modals/add-registry-participant-modal-layout.jsx`:
    - Layout displaying First Name (required), Middle Name (optional), Last Name (required).
- **Backend Creation & Initialization**:
  - `ripple/imports/collections/study_participants/methods/addRegistryParticipant.js`:
    - Checks required `firstName`, `lastName`, and optional `middleName`.
    - Generates authoritative global ID on backend if missing.
    - Explicitly sets `studyInfos = []`.
    - Explicitly sets `creationInfo = { creationSource: 'registry' }`.
    - Records `insertedAt = new Date()` and `insertedBy = Meteor.userId()`.
    - Returns authoritative `participantId`.
- **Default Arrays in Schema**:
  - `ripple/imports/collections/study_participants/StudyParticipantsSchema.js`:
    - Declares defaults `[]` for 10 arrays: `studyInfos`, `assignedCustomVariables`, `participantEvents`, `contactLog`, `contacts`, `comments`, `consentLog`, `emailLog`, `tasks`, `textLog`.

### 2.2 Root Causes of Previous Gaps in EnrollNow
1. **Frontend Synthetic Data Fabrication**:
   - `AddParticipantModal.tsx` previously constructed a fake `ParticipantRecord` containing:
     - Synthetic ID: `String(Date.now())`
     - Synthetic `familyId`: `FAM-...`
     - Synthetic `pedigreeTreeId`: `PED-...`
     - Synthetic demographics: `dob: '01/01/1995'`, `gender: 'Unspecified'`, `ethnicity: 'Not Disclosed'`
     - Synthetic contact methods: `primaryEmail: ...@example.org`, `phone: +1 (555) 019-2831`, `address: Clinical Center...`
     - Synthetic tags: `['New Participant']`
     - Synthetic contact date: `lastContact: 'Just now'`
   - This synthetic object was passed to `RegistryDashboard.tsx`, which forwarded these fabricated values to the backend.
2. **Broken Error Handling & Premature Modal Closure**:
   - `AddParticipantModal.tsx` closed itself before `createParticipant` completed on the backend. If backend persistence failed, the modal was gone and the user's input was lost.
   - Duplicate-check failures were caught and ignored (`catch { allow continuing }`), silently bypassing required duplicate verification.
3. **Missing Legacy Duplicate Confirmation**:
   - The modal lacked the legacy button state transition (`"Add Participant"` -> `"Confirm Add Participant"`) and the exact legacy confirmation warning.
4. **Backend Creation Metadata Gaps**:
   - Backend `createParticipant` did not store `creationSource: "registry"` or `creationInfo` in `custom_attributes`.
   - `RegistryParticipantDto` lacked `middleName` and omitted `middleName` from `fullName`.
   - If an invalid `studyId` was supplied, it was silently caught without rolling back the transaction.

---

## 3. Implementation Details

### 3.1 Frontend (`@enrollnow/mfe-participant` & `@enrollnow/shared`)

#### 1. `AddParticipantModal.tsx`
- **Clean Form Inputs**:
  - Collects only First Name (required), Middle Name (optional), and Last Name (required).
  - All fabricated values (`dob`, `gender`, `familyId`, `tags`, `email`, `phone`, `pedigreeTreeId`) completely removed.
- **Authoritative Two-Phase Duplicate Workflow**:
  - On submit, validates names using shared design-system validators.
  - Calls `participantApi.checkDuplicates(firstName.trim(), lastName.trim(), { params: { tenantId, siteId } })`.
  - Fail-safe policy: If duplicate check fails (network/server error), displays error banner and **halts**; does not bypass check.
  - If matches found:
    - Sets `participantExists = true`.
    - Displays legacy warning banner: `"A matching participant with the same First Name & Last Name already exits. Please confim that you still want to add this participant."`
    - Transforms action button into `"Confirm Add Participant"` (`id="confirm-add-participant-btn"`).
    - Provides `"Review Name"` option to clear warning and resume editing.
- **Backend Persistence & Safe Error Handling**:
  - Submits clean `CreateParticipantPayload`: `{ firstName, middleName, lastName }`.
  - Disables submit buttons and renders spinner (`isSubmitting`) to prevent double-clicks.
  - On success: clears form state, closes modal, calls `onSuccess(created)`.
  - On failure: keeps modal open, preserves entered text, displays server error banner, and allows retry.

#### 2. `RegistryDashboard.tsx`
- Refactored `handleParticipantCreated` to receive the real persisted participant returned by the backend.
- Displays success notification: `"Success! Participant added to registry."` (exact legacy notification).
- Refreshes registry participant grid (`fetchParticipants(true)`).
- Selects the newly created participant in the dashboard using `created.id`.

#### 3. `participantApi.ts`
- Corrected `checkDuplicates` query parameter propagation to merge `{ firstName, lastName, ...config?.params }` without shallow overwriting.

---

### 3.2 Backend (`enrollnow-participant-service` & `enrollnow-app`)

#### 1. `ParticipantRegistryService.java`
- **Authoritative Required & Optional Field Persistence**:
  - Validates `firstName` (required) and `lastName` (required).
  - Persists optional `middleName` trimmed, without requiring demographics or family data.
  - Generates authoritative backend `GLOBAL_ID` with format `PART-XXXXXXXX` and collision retry loop against `participant_identifiers`.
- **Creation Metadata**:
  - Records server-generated `createdAt` (`OffsetDateTime.now()`) and authenticated `createdBy` (`userId`).
  - Stores `{"creationSource": "registry", "creationInfo": {"creationSource": "registry"}}` in `custom_attributes` JSONB.
- **Collection & Preference Defaults**:
  - Initializes `participant_preferences` with business defaults: `allowEmail=true`, `allowSms=true`, `allowPhone=true`, `doNotContact=false`, `preferredLanguage="English"`.
  - Does NOT persist any fake rows in `participant_contacts`, `participant_addresses`, or `study_candidates` when optional fields are omitted.
- **Transactional Study Assignment**:
  - If `studyId` is supplied, validates UUID format and tenant ownership. If invalid or study not found, throws `IllegalArgumentException` causing immediate `@Transactional` rollback.
- **Duplicate Detection**:
  - `findDuplicatesByName` queries non-deleted participants matching case-insensitively via `findByTenantIdAndFirstNameIgnoreCaseAndLastNameIgnoreCaseAndStatusNot(tenantId, firstName, lastName, "DELETED")`.
- **DTO Mapping**:
  - Added `middleName` to `RegistryParticipantDto`.
  - `buildDto` formats `fullName` using `firstName`, `middleName`, `lastName`.
  - Returns `studies: []`, `tags: []`, `familyId: ""` for clean participants without inventing values.

#### 2. Repositories
- `ParticipantRepository.java`: Added `findByTenantIdAndFirstNameIgnoreCaseAndLastNameIgnoreCaseAndStatusNot`.
- `ParticipantIdentifierRepository.java`: Added `findByTenantIdAndIdentifierTypeAndIdentifierValue`.

#### 3. Database Migration (`V27__participant_creation_metadata.sql`)
- Created idempotent, non-destructive Flyway migration backfilling `creationSource='registry'` in `custom_attributes` for existing participant rows lacking creation source metadata.

---

## 4. Files Modified and Created

### Backend
- `backend/enrollnow-participant-service/src/main/java/com/enrollnow/participant/dtos/RegistryParticipantDto.java`
- `backend/enrollnow-participant-service/src/main/java/com/enrollnow/participant/dtos/CreateParticipantRequest.java`
- `backend/enrollnow-participant-service/src/main/java/com/enrollnow/participant/repositories/ParticipantRepository.java`
- `backend/enrollnow-participant-service/src/main/java/com/enrollnow/participant/repositories/ParticipantIdentifierRepository.java`
- `backend/enrollnow-participant-service/src/main/java/com/enrollnow/participant/services/ParticipantRegistryService.java`
- `backend/enrollnow-participant-service/src/test/java/com/enrollnow/participant/services/ParticipantRegistryServiceTest.java`
- `backend/enrollnow-app/src/main/resources/db/migration/V27__participant_creation_metadata.sql`

### Frontend
- `frontend/microfrontends/participant/src/components/AddParticipantModal.tsx`
- `frontend/microfrontends/participant/src/components/RegistryDashboard.tsx`
- `frontend/microfrontends/participant/src/test/fullRegistryWorkflow.test.tsx`
- `frontend/shared/api/participantApi.ts`

### Documentation
- `docs/migration/PARTICIPANT_CREATION_LEGACY_PARITY_MATRIX.md`
- `docs/migration/PARTICIPANT_CREATION_DEFAULTS_MAPPING.md`
- `docs/migration/PARTICIPANT_CREATION_IMPLEMENTATION_REPORT.md`
- `docs/migration/PARTICIPANT_CREATION_VERIFICATION_REPORT.md`
