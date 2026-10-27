# Participant Creation — Legacy Default Arrays & Field Mapping

## 1. Executive Summary

In legacy Ripple (`StudyParticipantsSchema.js`), ten participant-level arrays were declared with `defaultValue: []`. This document reconciles these MongoDB-specific document structures with EnrollNow's relational PostgreSQL architecture.

It categorizes each array, determines whether default initialization is applied automatically or explicitly, explains how EnrollNow represents the equivalent domain model, and establishes the strict rule: **No relational rows are created simply to mimic empty MongoDB arrays.**

---

## 2. Comprehensive Reconciliation of Legacy Default Arrays

| # | Legacy Array Name | Legacy Ripple Declaration & Behavior | EnrollNow Relational Representation | Creation-Time Persistence Policy | Response DTO Mapping |
|---|---|---|---|---|---|
| 1 | `studyInfos` | Declared in `StudyParticipantsSchema.js:33-37` with `defaultValue: []`. Explicitly set to `[]` in `addRegistryParticipant.js:27`. | Normalized into `enrollnow.study_candidates` and `enrollnow.study_enrollments`. | **0 rows persisted**. A Registry participant does not belong to any study until explicitly assigned. | Maps to `studies: []` in `RegistryParticipantDto`. |
| 2 | `assignedCustomVariables` | Declared in `StudyParticipantsSchema.js:106-110` with `defaultValue: []`. Stores dynamic study/registry custom variable responses. | Modeled via `custom_attributes` JSONB in `enrollnow.participants` and `participant_custom_variables`. | **0 variable rows persisted**. Initial custom attributes JSON stores only creation metadata. | Maps to `variables: []` in `RegistryParticipantDto`. |
| 3 | `participantEvents` | Declared in `StudyParticipantsSchema.js:114-118` with `defaultValue: []`. Stores milestone and lifecycle events. | Modeled via `enrollnow.audit_events` and study workflow event tables. | **0 rows persisted**. No synthetic event is generated during participant creation. | Not exposed directly on Registry grid. |
| 4 | `contactLog` | Declared in `StudyParticipantsSchema.js:122-126` with `defaultValue: []`. Stores communication attempts and logs. | Normalized into `enrollnow.participant_contact_logs` (V24 migration). | **0 rows persisted**. Newly created participant has no historical contact logs. | `GET /api/v1/participants/{id}/contact-logs` returns `[]`. |
| 5 | `contacts` | Declared in `StudyParticipantsSchema.js:130-134` with `defaultValue: []`. Ripple later called `createSelfContact` to create a self contact. | Normalized into `enrollnow.participant_contacts` (email, phone, etc.). | **0 rows persisted** when no contacts are supplied at creation time. Contact management is handled via dedicated contact endpoints. | `contactMethods` in `RegistryParticipantDto` contains empty fields (`phone: ""`, `primaryEmail: null`). |
| 6 | `comments` | Declared in `StudyParticipantsSchema.js:138-142` with `defaultValue: []`. Stores participant notes and comments. | Normalized into `enrollnow.participant_comments` (V25 migration). | **0 rows persisted**. No placeholder comment is generated. | `GET /api/v1/participants/{id}/comments` returns `[]`. |
| 7 | `consentLog` | Declared in `StudyParticipantsSchema.js:146-150` with `defaultValue: []`. Stores signed consents and waivers. | Normalized into `enrollnow.participant_consents` (V25 migration). | **0 rows persisted**. Newly created participant has no initial consents. | `GET /api/v1/participants/{id}/consent` returns `[]`. |
| 8 | `emailLog` | Declared in `StudyParticipantsSchema.js:154-158` with `defaultValue: []`. Stores transactional and template emails sent. | Normalized into `enrollnow.communications` (`channel = 'EMAIL'`). | **0 rows persisted**. No fake emails are recorded. | `GET /api/v1/participants/{id}/communications?channel=EMAIL` returns `[]`. |
| 9 | `tasks` | Declared in `StudyParticipantsSchema.js:162-166` with `defaultValue: []`. Stores scheduled follow-ups and reminders. | Modeled via `enrollnow-task-service` tables. | **0 rows persisted**. No automatic tasks are scheduled on creation. | Task endpoints return `[]`. |
| 10 | `textLog` | Declared in `StudyParticipantsSchema.js:170-174` with `defaultValue: []`. Stores SMS messages sent/received. | Normalized into `enrollnow.communications` (`channel = 'SMS'`). | **0 rows persisted**. No fake text messages are recorded. | `GET /api/v1/participants/{id}/communications?channel=SMS` returns `[]`. |

---

## 3. Participant Preferences & Status History Reconciliation

### 3.1 Participant Preferences (`participant_preferences`)
In EnrollNow, each participant has a 1-to-1 configuration record in `participant_preferences`.
- `allow_email`: `TRUE` (business default)
- `allow_sms`: `TRUE` (business default)
- `allow_phone`: `TRUE` (business default)
- `do_not_contact`: `FALSE` (inferred from `contactForFutureStudies`, which defaults to `true`)
- `preferred_language`: `"English"` (default when unset)
- `timezone`: `NULL` (or explicitly provided; never a fabricated `'America/New_York'` string)
- **Integrity**: `participant_id` is the primary key and unique constraint, guaranteeing exactly one preference record per participant.

### 3.2 Participant Status History (`participant_status_history`)
- Legacy Ripple does **not** create a status history record upon participant creation.
- In EnrollNow, `participant_status_history` is an append-only audit log reserved for administrative status changes (`ACTIVE -> INACTIVE`, `ACTIVE -> DELETED`).
- **Policy**: Do **not** create an initial status history record during creation. Creating a synthetic transition with `previous_status: null` or `previous_status: 'ACTIVE'` would violate audit fidelity.

---

## 4. Creation Metadata & Field Invariants

### 4.1 Authoritative Metadata Mapping
```
Legacy Meteor / Mongo          PostgreSQL / EnrollNow
---------------------------    --------------------------------------------------
creationInfo.creationSource -> participants.custom_attributes->>'creationSource' ('registry')
creationInfo.creationInfo   -> participants.custom_attributes->'creationInfo'
insertedAt                  -> participants.created_at (server-generated OffsetDateTime.now())
insertedBy                  -> participants.created_by (authenticated SecurityContext userId)
globalId                    -> participant_identifiers (identifier_type='GLOBAL_ID', 'PART-XXXXXXXX')
```

### 4.2 Strict Negative Constraints (What NOT to Fabricate)
1. **No Fabricated Demographics**: `date_of_birth`, `sex_at_birth`, `gender_identity`, `race`, and `ethnicity` remain `NULL`/unset if omitted by the user.
2. **No Fabricated Family Data**: `familyId`, `familyRole`, `guardianName`, and `pedigreeTreeId` remain `NULL`/unset.
3. **No Fabricated Contact Info**: Do not generate dummy emails (`example.org`), dummy phone numbers (`555-...`), or clinic addresses.
4. **No Fabricated Tags**: Do not inject default tags such as `['New Participant']`. Tags collection is empty `[]`.
5. **No Fabricated Contact Timestamps**: Do not set `global_last_contact_date` or `lastContact` to `"Just now"` on creation. A new participant has not yet been contacted.
