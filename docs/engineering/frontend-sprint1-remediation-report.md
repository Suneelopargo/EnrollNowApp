# EnrollNow — Sprint 1 Frontend Quality Remediation & Final Code Review Report

> **Date:** October 2026
> **Scope:** Source-code-based verification and targeted remediation of the EnrollNow frontend (`frontend/shared`, `frontend/shell`, `frontend/packages/administrator`, and all 11 microfrontends under `frontend/microfrontends/*`) for Sprint 2 readiness.
> **Backend Impact:** Zero backend Java or database files were modified during this frontend remediation.

---

## 1. Executive Summary & Readiness Verdict

An independent, file-by-file source code inspection and final review of the EnrollNow frontend was performed against the initial Sprint 1 remediation report and engineering documentation (`docs/engineering/frontend-*.md`).

- **Sprint 2 Readiness Verdict:** **READY FOR SPRINT 2**
- **Overall Verification Summary:**
  - `cd frontend && npm run typecheck`: **VERIFIED** (12/12 TypeScript workspaces passed with 0 errors)
  - `cd frontend && npm run test`: **VERIFIED** (13/13 test workspaces passed — **31 test files, 272 passing tests across all microfrontends**)
  - `cd frontend && npm run build --workspaces --if-present`: **VERIFIED** (14/14 workspaces built cleanly)

---

## 2. Differences Identified Between Initial Report Claims and Source Code (and Targeted Fixes Applied)

During the final source-code verification pass, four discrepancies/gaps were identified between the initial remediation report claims and the actual source code. All four were remediated and covered by new regression tests during this review:

### Finding 1 — Interactive `<Card>` Click & Keyboard Event Bubbling from Nested Interactive Children
- **Location:** `frontend/shared/design-system/components/Card.tsx` (lines 13–149)
- **Issue Found:** When `onClick` was passed to `<Card>`, the outer container assigned `onClick={onClick}` directly and `handleKeyDown` originally did not guard against nested interactive descendants (`button`, `a`, `input`, `select`, `textarea`, `label`, `summary`, `[role="button"]`, or header `actions`). Clicking or pressing `Enter`/`Space` on a nested button or control inside a clickable card could bubble up and trigger both the child action and the card action.
- **Accessibility & Usage Inspection:** Inspected all `<Card>` usages across `frontend/microfrontends/dashboard/src/remoteEntry.tsx` (charts with legend buttons, screening funnel buttons, `Active Study Protocols` with header `actions` button, and `Operational Microservices` with nested `role="button"` quick-launch cards) and `frontend/microfrontends/organization/src/remoteEntry.tsx`. None of those composite container cards pass `onClick`, so `role="button"` and `tabIndex={0}` are omitted on them (`role={onClick ? 'button' : undefined}`).
- **Remediation Applied:** Added `isNestedInteractiveTarget` and `handleClick` in `Card.tsx` (alongside `data-card-actions="true"` on the header actions slot and `handleKeyDown` guards) so clicks and keyboard activations on nested interactive controls never trigger the card's `onClick`, while clicks on non-interactive card content (`<h3>`, `<p>`, `.card-body`) and direct `Enter`/`Space` keydowns on the focused card execute `onClick()` once. Added regression tests in `frontend/shared/design-system.test.ts`.
- **Status:** **VERIFIED**

### Finding 2 — `EnrollNowApiError` Missing `.response` Reference & `getApiErrorMessage` Missing `.raw` Inspection
- **Location:** `frontend/shared/api-client/index.ts` (lines 27–47, 138–158, 535)
- **Issue Found:** The Axios response error interceptor rejects promises with `new EnrollNowApiError(normalized)`. `EnrollNowApiError` stored the backend payload on `this.raw`, whereas several callers (`SiteAdminDashboard.tsx`, `ActivateAccountPage.tsx`, `ResetPasswordPage.tsx`) inspected `err.response?.status` or `err.response?.data`, and `getApiErrorMessage` did not inspect `err?.raw?.error?.message` or `err?.raw?.message`.
- **Remediation Applied:**
  - Added `public response?: any` to `EnrollNowApiError` (populated from `error?.response` or `{ status: normalized.status, data: normalized.raw }`).
  - Enhanced `getApiErrorMessage` to check `err?.raw?.error?.message` and `err?.raw?.message` in addition to `err?.response?.data?.error?.message`, `err?.response?.data?.message`, `err?.normalized?.message`, `err?.apiError?.message`, and `err?.message`.
  - Added regression assertions in `frontend/shared/api-client.test.ts`.
- **Status:** **VERIFIED**

### Finding 3 — Remaining Direct `apiClient` Calls Bypassing Shared Domain API Services
- **Locations:**
  - `frontend/microfrontends/administration/src/components/SiteAdminDashboard.tsx` (line 81: `apiClient.get('/api/v1/sites')`)
  - `frontend/microfrontends/study/src/remoteEntry.tsx` (lines 45–46: `apiClient.get('/api/v1/dashboard/overview')` and `apiClient.get('/api/v1/participants')`)
  - `frontend/microfrontends/dashboard/src/demo/dashboardDataAdapter.ts` (lines 134 & 179: `apiClient.get('/api/v1/studies')` and `apiClient.get('/api/v1/participants')`)
- **Issue Found:** While `study/src/remoteEntry.tsx` and `organization/src/remoteEntry.tsx` had been partially updated to use `studyApi` and `organizationApi`, these 5 calls in `SiteAdminDashboard.tsx`, `study/src/remoteEntry.tsx`, and `dashboardDataAdapter.ts` still called `apiClient.get(...)` directly.
- **Remediation Applied:**
  - Updated `organizationApi.getSites(config?)`, `dashboardApi.getOverview(config?)`, and `participantApi.getParticipants(config?)` in `frontend/shared/api/` to accept optional Axios config (`{ skipToast: true }`) and safely unwrap both `{ data: ... }` and unwrapped payloads.
  - Replaced all 5 direct `apiClient.get` calls in `SiteAdminDashboard.tsx`, `study/src/remoteEntry.tsx`, and `dashboardDataAdapter.ts` with `organizationApi.getSites`, `dashboardApi.getOverview`, `studyApi.getStudies`, and `participantApi.getParticipants`.
  - Documented the single remaining intentional `apiClient.get('/api/v1/dashboard/overview')` call in `dashboardDataAdapter.ts` (line 105), which inspects raw HTTP `res.status === 501` (`Not Implemented`) on the Axios response envelope to trigger the `coming_soon` mode.
- **Status:** **VERIFIED**

### Finding 4 — Remaining Direct `localStorage` Reads and Inline Error Message Chains
- **Locations:**
  - `frontend/shell/src/remotes/RemoteLoader.tsx` (line 52)
  - `frontend/shared/api/authApi.ts` (lines 436, 486, 504)
  - `frontend/microfrontends/identity/src/components/RecoverPasswordPage.tsx` (line 71)
  - `frontend/microfrontends/identity/src/components/usePasswordValidation.ts` (line 48)
- **Issue Found:** `RemoteLoader.tsx` and `authApi.ts` still contained direct `localStorage.getItem('enrollnow_token')` and `JSON.parse(localStorage.getItem('enrollnow_user'))` lookups, and `RecoverPasswordPage.tsx` and `usePasswordValidation.ts` still used `err?.response?.data?.message || err?.message || ...` inline chains.
- **Remediation Applied:** Updated `RemoteLoader.tsx` and `authApi.ts` to use `getAccessToken()` and `getStoredAuthUser()`, updated `frontend/shared/authApi.test.ts` to preserve `importOriginal` exports on its `./api-client` mock, and updated `RecoverPasswordPage.tsx` and `usePasswordValidation.ts` to use `getApiErrorMessage()`.
- **Status:** **VERIFIED**

---

## 3. Section-by-Section Verification Matrix

| Review Area | Status | Evidence & Verification Notes |
|---|---|---|
| **1. Actual Git Diff & Docs Alignment** | **VERIFIED** | All 4 docs under `docs/engineering/` (`frontend-duplication-register.md`, `frontend-engineering-standards.md`, `frontend-story-review-checklist.md`, `frontend-sprint1-remediation-report.md`) accurately reflect the implemented code. |
| **2. Shared API Consolidation** | **VERIFIED** | `surveyApi` consolidated in `frontend/shared/api/surveyApi.ts`; all 7 alias pairs preserved and deduplicated; `exportResponsesCsvUrl` `/api/api` bug fixed; `normalizePasswordPolicy` shared between `authApi` and `securitySettingsApi`; `studyApi`, `organizationApi`, `dashboardApi`, and `participantApi` used consistently across MFEs. |
| **3. Authentication & Session Handling** | **VERIFIED** | `getAccessToken()` and `getStoredAuthUser()` in `frontend/shared/api-client/index.ts` are used across `shell`, `shared/api/authApi.ts`, and `administration`. `handleSessionExpired` clears storage and dispatches `enrollnow_auth_change` without redirect loops. Public auth endpoints (`/auth/login`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/activate`, `/password-policy`) do not trigger false session-expired toasts on 401. |
| **4. Accessibility & UI Behavior (Code/Unit Level)** | **VERIFIED** | `AccessibleField` adopted across `AddUserModal`, `AddParticipantModal`, and `SaveFilterModal`. `Card` and Dashboard quick-launch cards support keyboard `Enter`/`Space` without nested child bubbling. `useFocusTrap` wired into Dashboard drill-down modal, Study Add Study dialog, and Survey Response detail modal. `window.confirm` and `alert` replaced with `requestConfirmation` and `toast.info`. |
| **4b. Accessibility (Live Browser Screen Reader & Contrast Audit)** | **PARTIALLY VERIFIED** | Programmatic ARIA semantics, `htmlFor`/`id` bindings, `role="dialog"`, `useFocusTrap` DOM behavior, and keyboard handlers are verified via Vitest unit tests (`accessibility.test.ts`, `design-system.test.ts`, `KeyboardShortcutsHelp.test.ts`). Live assistive-technology screen-reader announcements (NVDA/JAWS/VoiceOver) and computed CSS pixel contrast ratios require browser E2E inspection outside Node/Vitest. |
| **5. Automated Verification (`typecheck`, `test`, `build`)** | **VERIFIED** | `npm run typecheck` (12/12 workspaces), `npm run test` (31 test files, 272 passing tests), and `npm run build --workspaces --if-present` (14/14 workspaces) all succeed with exit code 0. |

---

## 4. Baseline vs. Final Verification Metrics

| Check Command | Baseline (Pre-Remediation) | Initial Remediation Pass | Final Code Review Pass | Status |
|---|---|---|---|---|
| `cd frontend && npm run typecheck` | PASS (12/12 workspaces) | PASS (12/12 workspaces) | **PASS (12/12 workspaces)** | **VERIFIED** |
| `cd frontend && npm run test` | PASS (31 files, 263 tests) | PASS (31 files, 270 tests) | **PASS (31 files, 272 tests)** | **VERIFIED** |
| `cd frontend && npm run build --workspaces --if-present` | PASS (14/14 workspaces) | PASS (14/14 workspaces) | **PASS (14/14 workspaces)** | **VERIFIED** |

---

## 5. Complete List of Modified & Created Files

### `frontend/shared`
- `frontend/shared/api-client/index.ts` — Added `getStoredAuthUser<T>()`, `getApiErrorMessage(error, fallbackMessage)` (including `.raw` inspection), and `.response` preservation on `EnrollNowApiError`.
- `frontend/shared/api/surveyApi.ts` — Consolidated full typed `createSurveyApiClient`, `surveyApi`, and all Survey domain interfaces; deduplicated 7 alias method pairs; fixed `exportResponsesCsvUrl` double `/api/api` prefix bug.
- `frontend/shared/api/authApi.ts` — Extracted and exported `normalizePasswordPolicy(data)`; replaced direct `localStorage` reads in `getCurrentUser` and `verifySessionStatus` with `getStoredAuthUser()` and `getAccessToken()`.
- `frontend/shared/api/securitySettingsApi.ts` — Reused `normalizePasswordPolicy` from `authApi.ts`.
- `frontend/shared/api/studyApi.ts` — Aligned `Study` interface with backend `StudySummaryResponse` and added `deleteStudy`.
- `frontend/shared/api/organizationApi.ts` — Added optional `config` parameter and safe response unwrapping to `getSites`/`getSite`.
- `frontend/shared/api/dashboardApi.ts` — Added optional `config` parameter and safe response unwrapping to `getOverview`.
- `frontend/shared/api/participantApi.ts` — Added safe array/object response unwrapping to `getParticipants`/`getParticipant`/`updateParticipantStatus`.
- `frontend/shared/confirmation/confirmationManager.ts` — Used `getApiErrorMessage` in `handleConfirm`.
- `frontend/shared/design-system/components/Card.tsx` — Added `role="button"`, `tabIndex={0}`, `handleClick`, `handleKeyDown`, and `isNestedInteractiveTarget` child-bubbling guards when `onClick` is provided.
- `frontend/shared/design-system/components/Footer.tsx` — Added `'app-shell' | 'auth' | 'auth-card'` variant support.
- `frontend/shared/index.ts` — Exported `./design-system/validation` and `./supportLinks`.
- `frontend/shared/api-client.test.ts`, `frontend/shared/authApi.test.ts`, `frontend/shared/design-system.test.ts` — Added unit and regression tests for `getStoredAuthUser`, `getApiErrorMessage`, `EnrollNowApiError.response`, `normalizePasswordPolicy`, interactive `Card` (including child keydown bubbling guard), and `Footer` variants.

### `frontend/shell` & `frontend/microfrontends/*`
- `frontend/shell/src/modules/index.tsx`, `frontend/shell/src/remotes/RemoteLoader.tsx`, `frontend/shell/src/routing/ProtectedRoute.tsx` — Replaced direct `localStorage.getItem('enrollnow_token')` calls with `getAccessToken()`.
- `frontend/microfrontends/identity/src/remoteEntry.tsx`, `ActivateAccountPage.tsx`, `RecoverPasswordPage.tsx`, `ResetPasswordPage.tsx`, `usePasswordValidation.ts` — Replaced 4 duplicated inline footers with shared `<Footer variant="auth" />` and `<Footer variant="auth-card" />`; standardized error message extraction with `getApiErrorMessage`.
- `frontend/microfrontends/administration/src/components/AddUserModal.tsx` — Imported shared `AvailableStudy`, used `getStoredAuthUser()`, and replaced 3 manual field blocks with `<AccessibleField>`.
- `frontend/microfrontends/administration/src/components/SiteAdminDashboard.tsx`, `SecurityView.tsx`, `GeneralSettingsView.tsx` — Replaced direct `apiClient.get('/api/v1/sites')` with `organizationApi.getSites()`, manual `localStorage` user parsing with `getStoredAuthUser()`, and 16 inline error message chains with `getApiErrorMessage()`.
- `frontend/microfrontends/dashboard/src/remoteEntry.tsx` & `demo/dashboardDataAdapter.ts` — Added `useFocusTrap` to the drill-down modal, keyboard operability to the 4 quick-launch cards, and replaced direct `/api/v1/studies` and `/api/v1/participants` `apiClient` calls with `studyApi.getStudies` and `participantApi.getParticipants`.
- `frontend/microfrontends/study/src/remoteEntry.tsx` — Replaced direct `apiClient` calls with `studyApi`, `dashboardApi`, and `participantApi`, added `useFocusTrap` to the Add Study modal, and added `aria-label` to the hidden JSON import file input.
- `frontend/microfrontends/organization/src/remoteEntry.tsx` — Replaced direct `apiClient.get('/api/v1/sites')` with `organizationApi.getSites()`.
- `frontend/microfrontends/participant/src/components/AddParticipantModal.tsx`, `SaveFilterModal.tsx`, `FilterCard.tsx`, `LeftFilterPanel.tsx`, `ParticipantGrid.tsx`, `ParticipantDetailModal.tsx` — Adopted `<AccessibleField>` and added explicit `htmlFor`/`id`, `aria-label`, `role="group"`, and `aria-pressed` attributes.
- `frontend/microfrontends/survey/src/api/surveyApi.ts`, `types/survey.ts`, `test/survey.test.ts`, `views/*`, `builder/*`, `runner/SurveyRunner.tsx` — Re-exported consolidated shared `surveyApi` and types; replaced `window.confirm` with `requestConfirmation` and `alert` with `toast.info`; added `useFocusTrap` and dialog ARIA semantics to the response detail modal; standardized error extraction with `getApiErrorMessage`.

### `docs/engineering`
- `docs/engineering/frontend-duplication-register.md`
- `docs/engineering/frontend-engineering-standards.md`
- `docs/engineering/frontend-story-review-checklist.md`
- `docs/engineering/frontend-sprint1-remediation-report.md`
