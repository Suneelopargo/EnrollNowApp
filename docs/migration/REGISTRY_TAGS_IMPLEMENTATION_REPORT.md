# Registry Participant Tags — Implementation Report

## 1. Overview

This implementation replaces the legacy plain comma-delimited text input for Participant Tags in the EnrollNow Registry with a searchable, multi-select, creatable dropdown component backed by PostgreSQL JSONB aggregation and Spring Boot APIs.

---

## 2. Architecture & Database Design

### 2.1 Persistence Strategy
Participant tags are stored inside the `custom_attributes` JSONB column on the `enrollnow.participants` table:
```json
{
  "tags": ["ADRC", "Pediatric", "Cardio"],
  "creationSource": "registry"
}
```
No dedicated `participant_tags` table was introduced, adhering to legacy parity and avoiding redundant relational tables.

### 2.2 PostgreSQL Native Aggregation Query
To replicate MongoDB's `$unwind` + `$sortByCount: '$tags'` in PostgreSQL, a native query in `ParticipantRepository` extracts JSONB array elements, tallies occurrences, and sorts by frequency:

```sql
SELECT t.tag
FROM enrollnow.participants p,
     jsonb_array_elements_text(COALESCE(p.custom_attributes->'tags', '[]'::jsonb)) AS t(tag)
WHERE p.tenant_id = :tenantId
  AND (:siteId IS NULL OR p.site_id = :siteId)
  AND (p.status IS NULL OR p.status <> 'DELETED')
  AND (:search IS NULL OR t.tag ILIKE CONCAT('%', :search, '%'))
GROUP BY t.tag
ORDER BY COUNT(*) DESC, t.tag ASC
LIMIT :limit
```

---

## 3. Backend Implementation

### 3.1 Repository
- **File:** `backend/enrollnow-participant-service/src/main/java/com/enrollnow/participant/repositories/ParticipantRepository.java`
- Method: `findDistinctTagsByTenantAndSearch(@Param("tenantId") UUID tenantId, @Param("siteId") UUID siteId, @Param("search") String search, @Param("limit") int limit)`
- Excludes soft-deleted participants (`status <> 'DELETED'`).
- Ranks suggestions by occurrence count descending with secondary alphabetical sort.

### 3.2 Service Layer
- **File:** `backend/enrollnow-participant-service/src/main/java/com/enrollnow/participant/services/ParticipantRegistryService.java`
- **Method:** `getParticipantTags(UUID tenantId, UUID siteId, String search, int limit)`
  - Clamps limits safely: `limit <= 0 ? 20 : Math.min(limit, 100)`.
  - Executes database native query with fallback `getParticipantTagsFallback` for environments without PostgreSQL JSONB functions (H2/unit tests).
  - Fallback parses in-memory custom attributes JSON, tallies tag frequencies with `Collectors.groupingBy`, filters out deleted participants, and applies case-insensitive search and sorting.
- **Method:** `createParticipant` & `updateParticipant`
  - Sanitizes user input: filters null/blank entries, trims whitespace, and deduplicates tags case-insensitively using `TreeSet<>(String.CASE_INSENSITIVE_ORDER)`.
  - Removed artificial default fallback `['New Participant']`.

### 3.3 Controller Layer
- **File:** `backend/enrollnow-participant-service/src/main/java/com/enrollnow/participant/controllers/ParticipantRegistryController.java`
- **Endpoint:** `GET /api/v1/registry/participant-tags`
  - Parameters: `search` (optional string), `limit` (int, default 20), `tenantId` (optional UUID), `siteId` (optional UUID).
  - Authorizes caller via `siteAuthorizationService.requireRegistryAccess(effectiveTenantId, siteId)`.
  - Returns `ResponseEntity<List<String>>`.

---

## 4. Frontend Implementation

### 4.1 API Client
- **File:** `frontend/shared/api/participantApi.ts`
- **Method:** `getParticipantTags(search?: string, limit: number = 20, config?: any): Promise<string[]>`
  - Issues GET request to `/api/v1/registry/participant-tags`.

### 4.2 Creatable Multi-Select Component
- **File:** `frontend/microfrontends/participant/src/components/ParticipantTagSelect.tsx`
- **Features:**
  - **Dynamic Suggestions:** Queries `participantApi.getParticipantTags` with 250ms debouncing as user types.
  - **Tag Creation:** If typed text does not exactly match existing tags, displays `"Create \"<input>\""`. User can click or press Enter/Tab to create.
  - **Keyboard Accessibility:**
    - `ArrowDown` / `ArrowUp`: Navigate through dropdown suggestions.
    - `Enter`: Select highlighted option or create current input.
    - `Backspace`: When search input is empty, removes the rightmost selected tag pill.
    - `Escape`: Closes dropdown.
  - **Tag Pills:** Displayed inside control with individual removal button (`X`).
  - **Clear All:** Quick-action button to remove all selected tags when tags are present.
  - **ARIA Support:** Full `role="combobox"`, `role="listbox"`, `aria-expanded`, `aria-activedescendant`, and `aria-label` tags.

### 4.3 Participant Detail Drawer Integration
- **File:** `frontend/microfrontends/participant/src/components/ParticipantDetailModal.tsx`
- Replaced plain text input with `<ParticipantTagSelect />`.
- Cleanly updates `selectedTags` state on add/remove.
- Persists selected tags directly in save payload without injecting unwanted fallback tags.

### 4.4 Design System SCSS Styling
- **File:** `frontend/shared/design-system/styles/_components.scss`
- Added comprehensive styles for `.participant-tag-select`, including control, pill badges, focus ring, dropdown positioning, option highlights, and loading spinner.
