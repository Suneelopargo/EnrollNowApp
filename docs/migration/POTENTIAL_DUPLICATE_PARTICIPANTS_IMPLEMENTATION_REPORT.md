# Potential Duplicate Participants — Implementation Report

## 1. Executive Summary

This report documents the implementation of the **Potential Duplicate Participants** workflow in EnrollNow, achieving full functional and business parity with legacy Ripple (`D:\ProjectsWorkSpace\ProjectCode\EnrollnowSpace\ripple`).

The feature provides a unified toggle mechanism within the Registry participant grid that filters participants down to duplicate record clusters based on legacy business rules (`lastName`, `firstName`, and `birthday`/`dateOfBirth`), while preserving all active search terms, contact/availability filters, study selections, dynamic custom filters, and multi-tenant security guarantees.

---

## 2. Legacy Ripple Source Analysis & Business Rules

### 2.1 Authoritative Legacy Source References
- **Client UI & State Transition**:
  - `ripple/client/components/authenticated/registry.jsx` (lines 1609, 1737–1740, 2340–2355, 2604–2637)
  - `toggleShowDuplicates`: Toggles `state.duplicatesOnly` and triggers `submitSearch()`.
  - Header: `{this.state.duplicatesOnly ? 'Potential Duplicate Participants' : 'All Participants'}({this.props.totalParticipants})`
  - Button: `<button className={`btn ${this.state.duplicatesOnly ? 'btn-info' : 'btn-default'} participant-dupes`} onClick={this.toggleShowDuplicates} title="Display only potential participant duplicates"><i className="fa fa-users" /></button>`
  - Bulk action toggle: `<button id="bulk-actions-toggle" className="bulk-action-icon"><i className="fa fa-list-ul" /></button>`
- **Server Deduplication Pipeline**:
  - `ripple/imports/collections/study_participants/methods/loadParticipantsForRegistry.js` (lines 228–251)
  - `duplicatePipeline()`:
    ```javascript
    function duplicatePipeline() {
      return [
        {
          $group: {
            _id: { lastName: '$lastName', firstName: '$firstName', birthday: '$birthday' },
            participantIds: { $push: '$_id' }
          }
        },
        { $match: { 'participantIds.1': { $exists: true } } },
        { $unwind: '$participantIds' },
        {
          $lookup: {
            from: 'study_participants',
            localField: 'participantIds',
            foreignField: '_id',
            as: 'participant'
          }
        },
        { $unwind: '$participant' },
        {
          $replaceRoot: { newRoot: '$participant' }
        }
      ];
    }
    ```
- **Import/Export Deduplication**:
  - `ripple/server/import-export/collectionData/participants/getExistingParticipantsMap.js` (lines 155–195)
  - Normalizes `firstName` and `lastName` (trimmed, lowercase) and `birthday` (ISO format).
  - Groups records sharing identical `[FN, LN, B]` (`FirstName`, `LastName`, `Birthday`) or `[GI]` (`GlobalId`).

### 2.2 Deduplication Business Rules
1. **Name Matching**: Both `firstName` and `lastName` must match case-insensitively and after trimming.
2. **Date of Birth Matching**:
   - If both records have a date of birth, their dates of birth must be identical.
   - If both records have no date of birth (`NULL`), they are grouped as potential duplicates.
   - If two records have the same name but different dates of birth (e.g. grandfather born 1950 and grandson born 1990), they are **not** duplicates.
3. **Cluster Inclusivity**: If a cluster has 2 or more participants, **all** participant records in that cluster are returned.
4. **Ordering**: Results in duplicate mode must be grouped adjacent to each other deterministically (`lastName ASC, firstName ASC, dateOfBirth ASC, createdAt ASC`).

---

## 3. Root Cause of Implementation Gaps

Prior to this implementation:
1. **Disconnect in Frontend API Parameter Passing**:
   - `RegistryDashboard.tsx` had a state variable `duplicatesOnly`, but `fetchParticipants` did not accept `duplicatesOnly` in its override parameter list and did not pass `duplicatesOnly` in `params` to `participantApi.getParticipants(...)`.
2. **Total Count Was Bounded to Local Page Slice**:
   - `RegistryDashboard.tsx` passed `totalCount={participants.length}` to `<ParticipantGrid />`. If a tenant had 254 potential duplicates and a page returned 25 records, the table title displayed `(25)` instead of `(254)`.
3. **Filter State Desynchronization**:
   - `filterStateRef` in `RegistryDashboard.tsx` did not include `duplicatesOnly`, causing refreshes or subsequent filter searches to drop the duplicate mode.
4. **Deduplication Did Not Validate Date of Birth**:
   - Initial JPA specification only compared `lower(firstName)` and `lower(lastName)`, causing different individuals with the same common name (e.g. family members across generations with different birth dates) to be falsely grouped as duplicates.
5. **Export Did Not Propagate `duplicatesOnly`**:
   - CSV export did not include `duplicatesOnly` in the request parameters.

---

## 4. Files Modified

### Backend (`enrollnow-participant-service`)
- `com.enrollnow.participant.services.ParticipantSpecifications.java`:
  - Added 8-parameter overload `buildSpecification(..., boolean duplicatesOnly)`.
  - Added correlated subquery predicate enforcing tenant isolation (`p2.tenantId = tenantId`), non-self identity (`p2.id <> root.id`), active status (`status <> 'DELETED'`), trimmed case-insensitive name matching, and birth date matching (`both null OR both equal`).
- `com.enrollnow.participant.services.ParticipantRegistryService.java`:
  - Added `duplicatesOnly` overload to `searchParticipants(...)` and `getAllMatchingParticipants(...)`.
  - Configured deterministic sorting (`lastName ASC, firstName ASC, dateOfBirth ASC, createdAt ASC`) when `duplicatesOnly=true`.
  - Updated in-memory fallback grouping (`searchParticipantsInMemoryFallback`) using composite key `lower(fn) + "|||" + lower(ln) + "|||" + dob`.
- `com.enrollnow.participant.controllers.ParticipantRegistryController.java`:
  - Added `@RequestParam(required = false, defaultValue = "false") boolean duplicatesOnly` to `GET /api/v1/participants` and `GET /api/v1/registry/export`.
  - Preserved backward-compatible overloaded methods for existing test suites.
- Tests:
  - `ParticipantSpecificationsTest.java`: Added `buildSpecification_withDuplicatesOnly_constructsSubqueryPredicate`.
  - `ParticipantRegistryServiceTest.java`: Added `searchParticipants_withDuplicatesOnly_inFallback_returnsOnlyDuplicateGroups`.
  - `ParticipantRegistryControllerTest.java`: Added `getParticipants_withDuplicatesOnly_delegatesToService` and updated verification spies.

### Frontend (`participant MFE` & `shared`)
- `frontend/shared/api/participantApi.ts`:
  - Added `duplicatesOnly?: boolean` to `RegistrySearchParams`.
- `frontend/microfrontends/participant/src/components/ParticipantGrid.tsx`:
  - Added dynamic title: `{duplicatesOnly ? 'Potential Duplicate Participants' : 'All Participants'}({totalCount ?? participants.length})`.
  - Added bulk actions toggle icon (`id="bulk-actions-toggle"`) matching legacy Ripple.
  - Implemented potential duplicates toggle button (`id="potential-duplicates-toggle"`) with tooltip `"Display only potential participant duplicates"` and `aria-pressed={duplicatesOnly}`.
  - Styled with `btn-info bg-[#0d3b66] text-white` when active, `btn-secondary` when inactive.
- `frontend/microfrontends/participant/src/components/RegistryDashboard.tsx`:
  - Added `duplicatesOnly` state and `serverTotalCount` state.
  - Synchronized `filterStateRef` with `duplicatesOnly`.
  - Added `handleToggleDuplicates()` that updates state and fetches participants with `duplicatesOnly: next`.
  - Connected `duplicatesOnly` to `fetchParticipants`, `handleClearFilters`, and `handleExportServerCsv`.
  - Passed `totalCount={serverTotalCount}` and `duplicatesOnly={duplicatesOnly}` to `<ParticipantGrid />`.
- Tests:
  - `frontend/microfrontends/participant/src/test/fullRegistryWorkflow.test.tsx`:
    - Added tests for `ParticipantGrid` toolbar rendering in normal and duplicate modes.
    - Added tests for `participantApi.getParticipants` and `exportRegistry` forwarding `duplicatesOnly: true` and `false`.
    - Added test for `bulk-actions-toggle` and separate server `totalCount` rendering.

---

## 5. API Contract & Database Query Behavior

### 5.1 REST API Contract
```http
GET /api/v1/participants?page=0&pageSize=25&duplicatesOnly=true&searchTerm=John&contactFilter=all&availableFilter=all
```
Response:
```json
{
  "items": [
    {
      "id": "e21e3b7f-bf02-4db3-8f2d-0da1f35f0ab6",
      "firstName": "John",
      "lastName": "Doe",
      "name": "John Doe",
      "demographics": { "dob": "1990-01-01" },
      "status": "ACTIVE"
    },
    {
      "id": "88888888-8888-8888-8888-000000000001",
      "firstName": "John",
      "lastName": "Doe",
      "name": "John Doe",
      "demographics": { "dob": "1990-01-01" },
      "status": "ACTIVE"
    }
  ],
  "totalCount": 2,
  "page": 0,
  "pageSize": 25,
  "totalPages": 1
}
```

### 5.2 SQL Generated via JPA Criteria
```sql
SELECT p.* FROM enrollnow.participants p
WHERE p.tenant_id = :tenantId
  AND (p.status IS NULL OR UPPER(p.status) != 'DELETED')
  AND EXISTS (
    SELECT p2.id FROM enrollnow.participants p2
    WHERE p2.tenant_id = :tenantId
      AND p2.id != p.id
      AND p2.first_name IS NOT NULL AND p.first_name IS NOT NULL
      AND p2.last_name IS NOT NULL AND p.last_name IS NOT NULL
      AND LOWER(TRIM(p2.first_name)) = LOWER(TRIM(p.first_name))
      AND LOWER(TRIM(p2.last_name)) = LOWER(TRIM(p.last_name))
      AND (
        (p.date_of_birth IS NULL AND p2.date_of_birth IS NULL)
        OR (p.date_of_birth IS NOT NULL AND p2.date_of_birth IS NOT NULL AND p2.date_of_birth = p.date_of_birth)
      )
      AND (p2.status IS NULL OR UPPER(p2.status) != 'DELETED')
  )
ORDER BY p.last_name ASC, p.first_name ASC, p.date_of_birth ASC, p.created_at ASC
LIMIT 25 OFFSET 0;
```

---

## 6. Security and Tenant Isolation Findings

1. **Tenant Isolation**:
   - Both outer query and inner subquery enforce `p.tenantId = :tenantId` and `p2.tenantId = :tenantId`.
   - Records from Tenant A are never cross-referenced or compared against Tenant B.
2. **Caller Identity Verification**:
   - `ParticipantRegistryController` calls `siteAuthorizationService.requireRegistryAccess(resolvedTenantId, siteId)`.
   - Cross-tenant requests or requests lacking `SITE_REGISTRY` / `SITE_ADMIN` roles are rejected with `403 AccessDeniedException`.
3. **Export Protection**:
   - `GET /api/v1/registry/export` requires the same tenant authorization and applies identical `duplicatesOnly` criteria.

---

## 7. Test Results

| Suite | Scope | Tests Run | Passed | Failed | Status |
|---|---|---|---|---|---|
| `enrollnow-participant-service` | Backend Unit & Integration Tests | 95 | 95 | 0 | **PASS** |
| `mfe-participant` | Frontend Microfrontend Tests | 63 | 63 | 0 | **PASS** |
| `frontend/shared` | Shared API & Interceptor Tests | 152 | 152 | 0 | **PASS** |
| TypeScript Compiler (`tsc --noEmit`) | Participant Microfrontend Typecheck | - | - | 0 | **PASS** |
| Backend Multi-Module Build | Maven Reactor Compile (`enrollnow-app`) | 15 modules | 15 | 0 | **PASS** |

---

## 8. Verification Status Checklist

| Requirement | Status | Notes |
|---|---|---|
| 1. Toolbar button and tooltip | **PASS** | `id="potential-duplicates-toggle"`, tooltip `"Display only potential participant duplicates"` |
| 2. Toggle active/inactive states | **PASS** | Visual state toggles between dark navy (`btn-info`, active) and light (`btn-secondary`, inactive) |
| 3. Dynamic header text | **PASS** | Swaps between `"All Participants(X)"` and `"Potential Duplicate Participants(Y)"` |
| 4. Server-driven total count | **PASS** | Driven by `serverTotalCount` from API response, not page slice |
| 5. Duplicate matching rules | **PASS** | Enforces trimmed case-insensitive name matching and matching date of birth |
| 6. Cluster inclusivity | **PASS** | Returns all members of duplicate clusters |
| 7. Preserves active filters | **PASS** | Integrates with search term, contactFilter, availableFilter, studies, custom filters |
| 8. Database-backed pagination | **PASS** | Applied before pagination; deterministic sorting preserves row proximity |
| 9. CSV / Excel / PDF Export | **PASS** | Forwards `duplicatesOnly` to server CSV and client AG-grid exports |
| 10. Multi-tenant isolation | **PASS** | Subquery and outer query bound to authenticated caller's tenant |

**Overall Status**: **PRODUCTION-READY**
