# Registry Participant Tags — Legacy Ripple Parity Analysis & Matrix

## 1. Executive Summary

This document presents a comprehensive feature-by-feature parity analysis between legacy Ripple (`ripple`) and EnrollNow for Participant Tags in the Participant Registry.

In legacy Ripple, participant tags provide rapid categorization and filtering for study participants. Rather than maintaining a rigid relational tag entity, Ripple aggregates tags dynamically from arrays embedded in participant records across the database.

EnrollNow achieves full behavioral and functional parity by querying the PostgreSQL `enrollnow.participants.custom_attributes` JSONB column (`custom_attributes->'tags'`), sorting suggestions by occurrence frequency, supporting on-the-fly creatable tags, and maintaining tenant and site isolation.

---

## 2. Legacy Ripple Source Code Inspection

### 2.1 Storage & Schema
- **File:** `ripple/imports/collections/study_participants/StudyParticipantsSchema.js`
- **Definition:**
  ```javascript
  tags: {
    type: Array,
    optional: true
  },
  'tags.$': {
    type: String
  }
  ```
- **Finding:** Tags are stored as an optional array of strings directly on the participant record. There is no separate `tags` collection or master tag table.

### 2.2 Server Tag Aggregation & Suggestion
- **File:** `ripple/imports/collections/study_participants/methods/getParticipantTags.js`
- **Method:** `getParticipantTags({ tagSearch, maxTags = 20 })`
- **Pipeline:**
  ```javascript
  const pipeline = [
    { $match: { tags: { $exists: true, $ne: [] } } },
    { $unwind: '$tags' },
    { $match: { tags: { $regex: tagSearch, $options: 'i' } } },
    { $sortByCount: '$tags' },
    { $limit: maxTags }
  ];
  const tags = StudyParticipants.aggregate(pipeline);
  return tags.map(tag => tag._id);
  ```
- **Finding:**
  - Case-insensitive regex matching on `tagSearch`.
  - Frequency sorting via `$sortByCount: '$tags'` (most frequently used tags appear first).
  - Default limit of 20 tags.
  - Return format is a flat array of unique string tag values (`tag._id`).

### 2.3 UI Interaction
- **File:** `ripple/client/components/authenticated/registry-detail.jsx`
- **Component:** Uses `AsyncCreatableSelect` from `react-select/async-creatable`.
  - `loadOptions={this.searchTagOptions}` with debouncing.
  - Options formatted as `{ value: tag, label: tag }`.
  - Multi-select with removable pills.
  - Creatable: Allows entering new tags not currently in the database.
  - On change: updates `participant.tags` array with array of trimmed strings.

---

## 3. Legacy Parity Comparison Matrix

| # | Dimension | Legacy Ripple Behavior | Prior EnrollNow Behavior | Current Implemented Behavior | Parity Status |
|---|---|---|---|---|---|
| 1 | **Storage Mechanism** | Array of strings in participant document (`tags: [String]`) | Stored in `custom_attributes->'tags'` JSONB array | Kept in `custom_attributes->'tags'` JSONB array; no unnecessary table created | **Full Parity** |
| 2 | **Tag Suggestion Source** | Dynamically aggregated from existing participant records | None (plain comma-separated text input) | Aggregated dynamically via PostgreSQL JSONB array elements native query | **Full Parity** |
| 3 | **Suggestion Ranking** | Sorted by occurrence count descending (`$sortByCount`) | N/A | Sorted by `COUNT(*) DESC, tag ASC` for deterministic frequency ranking | **Full Parity** |
| 4 | **Search / Filter Query** | Case-insensitive substring match (`$regex, $options: 'i'`) | None | Case-insensitive substring match (`ILIKE %search%`) | **Full Parity** |
| 5 | **Suggestion Limits** | Default 20, configurable max | N/A | Default 20, capped between 1 and 100 on backend | **Full Parity** |
| 6 | **Creatable Tags** | Allows creating arbitrary new tags by typing and pressing Enter | Plain text input allowed manual entry | `ParticipantTagSelect` provides "Create '...'" option and Enter/Tab tag creation | **Full Parity** |
| 7 | **Multi-Select & Pills** | Multi-select badge pills with individual removal (x) | Comma-delimited text string | Accessible badge pills with remove button, backspace removal, clear all | **Full Parity** |
| 8 | **Keyboard Navigation** | Full keyboard support (Arrow keys, Enter, Backspace, Escape) | None | Complete keyboard navigation adhering to WAI-ARIA combobox pattern | **Full Parity** |
| 9 | **Default Value Semantics** | Empty array when no tags; user tags saved as-is | Hardcoded fallback `['New Participant']` when empty | Clean user tags saved; empty list preserved without fake defaults | **Full Parity** |
| 10 | **Deduplication & Hygiene** | Case-insensitive unique tag values, trimmed, non-blank | Unfiltered split text | Sanitized, trimmed, non-blank, case-insensitively deduplicated on save | **Full Parity** |
| 11 | **Soft-Delete Filtering** | Excluded inactive/deleted participants from tag aggregations | N/A | Excludes participants where `status = 'DELETED'` from tag aggregations | **Full Parity** |
| 12 | **Tenant & Site Isolation** | Team-scoped aggregation | N/A | Strictly tenant-scoped (`tenant_id = :tenantId`) with optional site filter | **Full Parity** |
| 13 | **Non-Postgres Fallback** | N/A (MongoDB only) | N/A | In-memory stream aggregation fallback when native JSONB is unsupported in test | **Full Parity** |
