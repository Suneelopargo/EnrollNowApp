# EnrollNow — Frontend Duplication Register

> **Scope:** Complete source-code-verified audit of code duplications across `frontend/shared`, `frontend/shell`, and `frontend/microfrontends/*` at the conclusion of Sprint 1.
> **Policy:** Every confirmed duplication entry records exact file paths, line ranges, root causes, canonical shared owners, and verification status (`VERIFIED`, `PARTIALLY VERIFIED`, `NOT VERIFIED`, or `FAILED`).

---

## Summary Table

| ID | Category | Affected Files | Canonical Shared Owner | Disposition | Status |
|---|---|---|---|---|---|
| `DUP-FE-001` | API Client & Types | `frontend/shared/api/surveyApi.ts`, `frontend/microfrontends/survey/src/api/surveyApi.ts`, `frontend/microfrontends/survey/src/types/survey.ts` | `frontend/shared/api/surveyApi.ts` | Consolidated + 7 alias pairs deduplicated + `/api/api` export URL bug fixed | **VERIFIED** |
| `DUP-FE-002` | Password Policy Normalization | `frontend/shared/api/authApi.ts`, `frontend/shared/api/securitySettingsApi.ts` | `normalizePasswordPolicy` in `frontend/shared/api/authApi.ts` | Extracted & reused across both API modules | **VERIFIED** |
| `DUP-FE-003` | Domain API Services & Types (`Study`, `Site`, `DashboardOverview`, `Participant`) | `frontend/shared/api/studyApi.ts`, `frontend/shared/api/administrationApi.ts`, `frontend/shared/api/organizationApi.ts`, `frontend/shared/api/dashboardApi.ts`, `frontend/shared/api/participantApi.ts`, `AddUserModal.tsx`, `SiteAdminDashboard.tsx`, `study/src/remoteEntry.tsx`, `organization/src/remoteEntry.tsx`, `dashboardDataAdapter.ts` | `frontend/shared/api/{studyApi,administrationApi,organizationApi,dashboardApi,participantApi}.ts` | Unified `AvailableStudy`, enriched `Study`, and eliminated direct `apiClient` bypasses across `study`, `organization`, `administration`, and `dashboard` | **VERIFIED** |
| `DUP-FE-004` | API Error Message Extraction | `frontend/shared/confirmation/confirmationManager.ts`, `SiteAdminDashboard.tsx`, `SecurityView.tsx`, `GeneralSettingsView.tsx`, `RecoverPasswordPage.tsx`, `usePasswordValidation.ts`, `SurveyAssignmentsView.tsx`, `SurveyBuilder.tsx`, `Step2AiTemplates.tsx`, `SurveyRunner.tsx` | `getApiErrorMessage` in `frontend/shared/api-client/index.ts` | Centralized helper added (inspecting `response.data.error.message`, `response.data.message`, `raw.error.message`, `raw.message`, `normalized.message`, `apiError.message`, `message`) and adopted across 22+ catch blocks | **VERIFIED** |
| `DUP-FE-005` | Direct `localStorage` Session/Token Parsing | `frontend/shell/src/modules/index.tsx`, `frontend/shell/src/remotes/RemoteLoader.tsx`, `frontend/shell/src/routing/ProtectedRoute.tsx`, `frontend/shared/api/authApi.ts`, `SiteAdminDashboard.tsx`, `AddUserModal.tsx` | `getAccessToken` and `getStoredAuthUser` in `frontend/shared/api-client/index.ts` | Consolidated onto shared `getAccessToken()` and `getStoredAuthUser()` across shell, shared `authApi`, and microfrontends | **VERIFIED** |
| `DUP-FE-006` | System & Auth Footer Markup | `frontend/shared/design-system/components/Footer.tsx`, `frontend/microfrontends/identity/src/remoteEntry.tsx`, `ActivateAccountPage.tsx`, `RecoverPasswordPage.tsx`, `ResetPasswordPage.tsx` | `Footer` (`variant?: 'app-shell' \| 'auth' \| 'auth-card'`) in `frontend/shared/design-system/components/Footer.tsx` | Consolidated 4 inline footer implementations into shared `<Footer />` | **VERIFIED** |
| `DUP-FE-007` | Accessible Form Field Boilerplate | `frontend/shared/accessibility/AccessibleField.tsx`, `AddUserModal.tsx`, `AddParticipantModal.tsx`, `SaveFilterModal.tsx` | `AccessibleField` in `frontend/shared/accessibility/AccessibleField.tsx` | Replaced 6 manual field blocks across 3 modals with `<AccessibleField>` | **VERIFIED** |
| `DUP-FE-008` | Tabular ExcelJS & jsPDF Export Formatting | `frontend/microfrontends/dashboard/src/remoteEntry.tsx`, `frontend/microfrontends/administration/src/components/UsersGrid.tsx`, `frontend/microfrontends/participant/src/components/ParticipantGrid.tsx` | MFE-local export handlers (due to heavy optional peer dependencies `exceljs`/`jspdf`) | Documented intentional boundary; standardized palette constants | **VERIFIED** |
| `DUP-FE-009` | Study Creation & Import Logic Duplication | `frontend/microfrontends/study/src/remoteEntry.tsx`, `frontend/shared/design-system/components/AddStudyModal.tsx` | `AddStudyModal` in `frontend/shared/design-system/components/AddStudyModal.tsx` | Removed obsolete dead handlers (`handleCreateStudy`, `handleImportStudy`), dead state and dialog refs from `remoteEntry.tsx`; preserved `AddStudyModal` as canonical | **VERIFIED** |
| `DUP-FE-010` | Study Name Validation Logic | `AddStudyModal.tsx`, `remoteEntry.tsx`, `validation.ts`, `addStudyAndImport.test.ts` | `validateStudyName` in `frontend/shared/design-system/validation.ts` | Consolidated onto canonical `validateStudyName`; replaced copied validation logic in tests with component-level `AddStudyModal` tests | **VERIFIED** |

---

## Detailed Duplication Entries

### DUP-FE-001 — Duplicate `surveyApi` Client, Types, and Internal Alias Methods
- **Locations Inspected:**
  - `frontend/shared/api/surveyApi.ts` (previously a 44-line untyped 6-method stub)
  - `frontend/microfrontends/survey/src/api/surveyApi.ts` (previously a 196-line client with 7 duplicate method pairs)
  - `frontend/microfrontends/survey/src/types/survey.ts` (159 lines of Survey domain interfaces)
- **What Was Duplicated:**
  1. Two separate `surveyApi` implementations existed in `shared/api/surveyApi.ts` and `microfrontends/survey/src/api/surveyApi.ts`.
  2. Within `createSurveyApiClient`, 7 method pairs duplicated identical HTTP calls (`listSurveys`/`getSurveys`, `listResponses`/`getSurveyResponses`, `listAssignments`/`getSurveyAssignments`, `getDashboard`/`getDashboardData`, `generateSurveyAi`/`generateWithAi`, `suggestLogicAi`/`generateLogicWithAi`, `assessResponseAi`/`assessResponseWithAi`).
  3. `exportResponsesCsvUrl(surveyId)` concatenated `${getApiBaseUrl()}/api/v1/surveys/${surveyId}/responses/export`, producing `/api/api/v1/surveys/...` when `getApiBaseUrl()` returned `'/api'`.
- **Canonical Owner:** `frontend/shared/api/surveyApi.ts`
- **Resolution & Final Review Verification (`VERIFIED`):**
  - Consolidated all Survey domain interfaces and `createSurveyApiClient` + `surveyApi` into `frontend/shared/api/surveyApi.ts`.
  - Deduplicated all 7 alias method pairs to reference single canonical implementations (`expect(surveyApi.getSurveys).toBe(surveyApi.listSurveys)`, etc., verified in `frontend/microfrontends/survey/src/test/survey.test.ts`).
  - Fixed `exportResponsesCsvUrl` to normalize the `/api` prefix and prevent `/api/api/v1/...`.
  - Converted `frontend/microfrontends/survey/src/api/surveyApi.ts` and `frontend/microfrontends/survey/src/types/survey.ts` into thin re-exports of `frontend/shared/api/surveyApi.ts`.

---

### DUP-FE-002 — Duplicate `getPasswordPolicy` Normalization Logic
- **Locations Inspected:**
  - `frontend/shared/api/authApi.ts` (`getPasswordPolicy`)
  - `frontend/shared/api/securitySettingsApi.ts` (`getPasswordPolicy`)
- **What Was Duplicated:** Identical default fallback and normalization logic (`minimumPasswordLength ?? 10`, `(minimumPasswordStrength || 'MODERATE').toUpperCase()`, `requireDigit ?? true`, `requireSymbol ?? true`, `requireMixedCase ?? true`).
- **Canonical Owner:** `normalizePasswordPolicy` in `frontend/shared/api/authApi.ts`
- **Resolution & Final Review Verification (`VERIFIED`):** Extracted and exported `normalizePasswordPolicy(data: any): PasswordPolicy` in `frontend/shared/api/authApi.ts` and reused it in both `authApi.getPasswordPolicy` and `securitySettingsApi.getPasswordPolicy`. Unit-tested in `frontend/shared/api-client.test.ts`.

---

### DUP-FE-003 — Duplicate `AvailableStudy` Interface & Domain API Client Bypasses
- **Locations Inspected:**
  - `frontend/shared/api/administrationApi.ts` (`AvailableStudy`)
  - `frontend/microfrontends/administration/src/components/AddUserModal.tsx` (`AvailableStudy`)
  - `frontend/shared/api/studyApi.ts`, `frontend/shared/api/organizationApi.ts`, `frontend/shared/api/dashboardApi.ts`, `frontend/shared/api/participantApi.ts`
  - `frontend/microfrontends/administration/src/components/SiteAdminDashboard.tsx`
  - `frontend/microfrontends/study/src/remoteEntry.tsx`
  - `frontend/microfrontends/organization/src/remoteEntry.tsx`
  - `frontend/microfrontends/dashboard/src/demo/dashboardDataAdapter.ts`
- **What Was Duplicated:**
  1. `AvailableStudy` was defined identically in both `administrationApi.ts` and `AddUserModal.tsx`.
  2. `study/src/remoteEntry.tsx` bypassed `studyApi`, `dashboardApi`, and `participantApi` by calling `apiClient.get('/api/v1/studies')`, `apiClient.post('/api/v1/studies')`, `apiClient.get('/api/v1/dashboard/overview')`, and `apiClient.get('/api/v1/participants')` directly.
  3. `organization/src/remoteEntry.tsx` and `SiteAdminDashboard.tsx` bypassed `organizationApi.getSites()` by calling `apiClient.get('/api/v1/sites')` directly.
  4. `dashboardDataAdapter.ts` bypassed `studyApi.getStudies()` and `participantApi.getParticipants()` by calling `apiClient.get('/api/v1/studies')` and `apiClient.get('/api/v1/participants')` directly.
- **Canonical Owners:** `frontend/shared/api/{administrationApi,studyApi,organizationApi,dashboardApi,participantApi}.ts`
- **Resolution & Final Review Verification (`VERIFIED`):**
  - Imported and re-exported `AvailableStudy` in `AddUserModal.tsx` from `administrationApi.ts`.
  - Updated `studyApi`, `organizationApi`, `dashboardApi`, and `participantApi` to accept optional Axios request configs (e.g., `{ skipToast: true }`) and unwrap both `{ data: ... }` and direct array/object responses.
  - Updated `study/src/remoteEntry.tsx`, `organization/src/remoteEntry.tsx`, `SiteAdminDashboard.tsx`, and `dashboardDataAdapter.ts` to use those shared domain API services.
  - **Documented Exception:** `dashboardDataAdapter.ts` (line 105) retains a single direct `apiClient.get('/api/v1/dashboard/overview', { skipToast: true })` call because it must inspect raw HTTP status `res.status === 501` (`Not Implemented`) on the Axios response envelope to trigger the `coming_soon` UI state.

---

### DUP-FE-004 — Repeated Error Message Extraction (`err?.response?.data?.message || err?.message || ...`)
- **Locations Inspected:**
  - `frontend/shared/confirmation/confirmationManager.ts`
  - `frontend/microfrontends/administration/src/components/SiteAdminDashboard.tsx` (10 occurrences)
  - `frontend/microfrontends/administration/src/components/SecurityView.tsx` (4 occurrences)
  - `frontend/microfrontends/administration/src/components/GeneralSettingsView.tsx` (2 occurrences)
  - `frontend/microfrontends/identity/src/components/RecoverPasswordPage.tsx` (1 occurrence)
  - `frontend/microfrontends/identity/src/components/usePasswordValidation.ts` (1 occurrence)
  - `frontend/microfrontends/survey/src/views/SurveyAssignmentsView.tsx`, `SurveyBuilder.tsx`, `Step2AiTemplates.tsx`, `SurveyRunner.tsx`
- **What Was Duplicated:** Inline property chains (`err?.response?.data?.message || err?.message || 'Fallback'`) repeated over 22 times, several of which missed `err?.response?.data?.error?.message`, `err?.raw?.error?.message`, or `err?.normalized?.message`.
- **Canonical Owner:** `getApiErrorMessage(error: unknown, fallbackMessage?: string): string` in `frontend/shared/api-client/index.ts`
- **Resolution & Final Review Verification (`VERIFIED`):**
  - Implemented and exported `getApiErrorMessage` in `frontend/shared/api-client/index.ts` (checking `response.data.error.message`, `response.data.message`, `raw.error.message`, `raw.message`, `normalized.message`, `apiError.message`, and `message`).
  - Preserved `.response` on `EnrollNowApiError` instances rejected by the Axios response interceptor so callers inspecting `err.response?.status` or `err.response?.data` work seamlessly alongside `getApiErrorMessage(err)`.
  - Refactored all 22+ call sites (including `RecoverPasswordPage.tsx` and `usePasswordValidation.ts` during final review) to use `getApiErrorMessage`.
  - **Documented Exceptions:** `ActivateAccountPage.tsx` and `ResetPasswordPage.tsx` inspect structured backend token error codes (`TOKEN_EXPIRED`, `TOKEN_ALREADY_USED`, `TOKEN_INVALID`, `WEAK_PASSWORD`) in `classifyTokenFailure` to render specialized recovery banners and password policy violation lists before falling back to message strings.

---

### DUP-FE-005 — Direct `localStorage` Session & Token Parsing Across Shell, Shared API, and Microfrontends
- **Locations Inspected:**
  - `frontend/shell/src/modules/index.tsx`
  - `frontend/shell/src/remotes/RemoteLoader.tsx`
  - `frontend/shell/src/routing/ProtectedRoute.tsx`
  - `frontend/shared/api/authApi.ts`
  - `frontend/microfrontends/administration/src/components/SiteAdminDashboard.tsx`
  - `frontend/microfrontends/administration/src/components/AddUserModal.tsx`
- **What Was Duplicated:** Direct `localStorage.getItem('enrollnow_token')` and `try { JSON.parse(localStorage.getItem('enrollnow_user')) } catch {}` blocks outside `AuthContext` and `api-client`.
- **Canonical Owner:** `getAccessToken()` and `getStoredAuthUser<T>()` in `frontend/shared/api-client/index.ts`
- **Resolution & Final Review Verification (`VERIFIED`):** Added `getStoredAuthUser<T>()` to `frontend/shared/api-client/index.ts` and updated `shell/src/modules/index.tsx`, `shell/src/remotes/RemoteLoader.tsx`, `ProtectedRoute.tsx`, `shared/api/authApi.ts`, `SiteAdminDashboard.tsx`, and `AddUserModal.tsx` to use `getAccessToken()` and `getStoredAuthUser()`.

---

### DUP-FE-006 — Quadruplicated Footer Markup Across Identity Microfrontend
- **Locations Inspected:**
  - `frontend/shared/design-system/components/Footer.tsx`
  - `frontend/microfrontends/identity/src/remoteEntry.tsx`
  - `frontend/microfrontends/identity/src/components/ActivateAccountPage.tsx`
  - `frontend/microfrontends/identity/src/components/RecoverPasswordPage.tsx`
  - `frontend/microfrontends/identity/src/components/ResetPasswordPage.tsx`
- **What Was Duplicated:** Four separate `<footer role="contentinfo">` blocks in `identity` hardcoded the copyright notice and `EnrollNow | Terms of Service | Support Center` links.
- **Canonical Owner:** `Footer` in `frontend/shared/design-system/components/Footer.tsx`
- **Resolution & Final Review Verification (`VERIFIED`):** Enhanced `Footer.tsx` to support `variant?: 'app-shell' | 'auth' | 'auth-card'` (preserving the exact `enl-login-strong-footer` and `enl-activation-footer` class names) and replaced all four inline footers in `identity` with `<Footer variant="auth" />` and `<Footer variant="auth-card" />`.

---

### DUP-FE-007 — Manual Duplication of `AccessibleField` Pattern in Modals
- **Locations Inspected:**
  - `frontend/shared/accessibility/AccessibleField.tsx`
  - `frontend/microfrontends/administration/src/components/AddUserModal.tsx` (3 fields)
  - `frontend/microfrontends/participant/src/components/AddParticipantModal.tsx` (2 fields)
  - `frontend/microfrontends/participant/src/components/SaveFilterModal.tsx` (1 field)
- **What Was Duplicated:** All 6 required fields manually reconstructed `<label>`, `<span className="form-required-marker">*</span>`, `placeholder={!val && error ? error : 'Enter ...'}`, `aria-invalid`, `aria-describedby`, and `<div id="...-error" className="sr-only" role="alert">`.
- **Canonical Owner:** `AccessibleField` in `frontend/shared/accessibility/AccessibleField.tsx`
- **Resolution & Final Review Verification (`VERIFIED`):** Refactored `AddUserModal.tsx`, `AddParticipantModal.tsx`, and `SaveFilterModal.tsx` to render those fields through `<AccessibleField>`.

---

### DUP-FE-008 — Tabular ExcelJS & jsPDF Export Formatting
- **Locations Inspected:**
  - `frontend/microfrontends/dashboard/src/remoteEntry.tsx`
  - `frontend/microfrontends/administration/src/components/UsersGrid.tsx`
  - `frontend/microfrontends/participant/src/components/ParticipantGrid.tsx`
- **What Was Duplicated:** Similar ExcelJS header/row styling (`#123A5A` header fill, `#F1F7FB` alternating row fill) and `jsPDF` + `jspdf-autotable` configuration.
- **Disposition (`VERIFIED`):** Kept in the respective microfrontends and documented. Moving `exceljs` and `jspdf` into `@enrollnow/shared` would force all lightweight microfrontends and shared unit tests to depend on heavy binary document generation libraries. If Sprint 2 introduces additional export grids, a dedicated `@enrollnow/export-utils` workspace package should be extracted.
