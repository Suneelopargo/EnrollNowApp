# EnrollNow — Frontend Engineering Standards

> **Audience:** All Frontend & Full-Stack Engineers working on EnrollNow Sprint 2 and beyond.
> **Enforcement:** Automated architectural tests (`frontend/shared/api-architecture.test.ts`), TypeScript strict typechecking (`npm run typecheck`), Vitest test suites (`npm run test`), and mandatory PR review gates (`docs/engineering/frontend-story-review-checklist.md`).

---

## 1. Workspace & Module Boundaries

The EnrollNow frontend monorepo (`frontend/`) is organized into:

1. **`frontend/shared` (`@enrollnow/shared`)** — Authoritative shared library containing:
   - `api-client/` — Centralized Axios singleton (`apiClient`), request/response interceptors, error normalization (`normalizeApiError`, `getApiErrorMessage`), and token/session accessors (`getAccessToken`, `getStoredAuthUser`).
   - `api-config.ts` — Runtime/env API base URL (`getApiBaseUrl`), API mode (`getApiMode`), and tenant resolution (`getTenantId`).
   - `api/` — Domain API service clients (`authApi`, `administrationApi`, `securitySettingsApi`, `generalSettingsApi`, `studyApi`, `participantApi`, `surveyApi`, `dashboardApi`, `organizationApi`, `recruitmentApi`, `taskApi`, `communicationApi`, `documentApi`).
   - `design-system/` — Reusable UI components (`Modal`, `Card`, `DataGrid`, `DataTable`, `Tabs`, `PageHeader`, `StatCard`, `StatusBadge`, `LoadingSpinner`, `Skeleton`, `Footer`, `ErrorBoundary`, `ComingSoon`), SCSS tokens, and `validation/` rules.
   - `accessibility/` — WCAG 2.2 AA utilities (`AccessibleField`, `useFocusTrap`, `useEscapeKey`, `useRovingTabIndex`, `modalA11yManager`, `LiveRegion`, `KeyboardShortcutsModal`).
   - `confirmation/` — Cross-MFE confirmation dialog manager (`confirmation`, `requestConfirmation`, `ConfirmationModalHost`).
   - `toaster/` & `loader/` — Cross-MFE notification toaster (`toast`) and global request loader (`loader`).
2. **`frontend/shell` (`enrollnow-shell`)** — Application host, top-level routing (`ProtectedRoute`), authentication provider (`AuthContext`), navigation chrome, and lazy microfrontend loader (`MODULE_REGISTRY`).
3. **`frontend/microfrontends/*`** — Domain feature modules (`identity`, `administration`, `dashboard`, `study`, `participant`, `survey`, `recruitment`, `organization`, `task`, `communication`, `document`).

### Architectural Boundary Rules
- **No Upward Imports:** `frontend/shared` must **never** import from `frontend/shell` or `frontend/microfrontends/*`.
- **No Cross-MFE Deep Imports:** Microfrontends must **never** import internal files from sibling microfrontends. Cross-MFE communication must occur via `MfeContext`, `frontend/shared`, or documented custom window events.

---

## 2. Centralized API Client & Domain Service Rules

1. **Single Axios Client:** All HTTP requests must route through `apiClient` from `frontend/shared/api-client`.
   - **Prohibited:** Calling `axios.create(...)`, `fetch(...)`, or hardcoding `http://localhost:8080` in any application or microfrontend source file. This rule is automatically enforced by `frontend/shared/api-architecture.test.ts`.
2. **Domain API Modules Live in `frontend/shared/api/`:**
   - Every backend domain resource (`/api/v1/studies`, `/api/v1/surveys`, `/api/v1/participants`, `/api/v1/sites`, `/api/v1/tenants/{tenantId}/...`) must have a single authoritative API module in `frontend/shared/api/`.
   - Microfrontends must call domain API methods (`studyApi.getStudies()`, `surveyApi.getSurveys()`, `organizationApi.getSites()`, `administrationApi.getDetailedUsers()`) rather than issuing raw `apiClient.get('/api/v1/...')` calls inside React components.
3. **Standard Error Extraction:**
   - Always extract user-facing error messages using `getApiErrorMessage(err, 'Contextual fallback message')` from `frontend/shared/api-client`.
   - Do not repeat ad-hoc `err?.response?.data?.message || err?.message` chains in component `catch` blocks.
4. **Silent Background Requests:**
   - Pass `{ skipToast: true }` (or `{ silent: true }`) when a component handles errors inline or performs background polling/fallback loading, preventing duplicate global error toasts.

---

## 3. Authentication, Session & Authorization Standards

1. **Token & User Storage Access:**
   - Do not read `localStorage.getItem('enrollnow_token')` or `JSON.parse(localStorage.getItem('enrollnow_user'))` directly in components.
   - Use `useAuth()` (within `shell`), `context.user` / `context.token` (from `MfeContext`), or the shared helpers `getAccessToken()` and `getStoredAuthUser()` from `frontend/shared/api-client`.
2. **Permission & Role Derivation:**
   - Always derive role/permission flags through `deriveUserAccessFlags`, `userIsFullSiteAdmin`, and `userCanManageSiteSettings` in `frontend/shared/api/authApi.ts`.
   - Remember that UI permission checks (`ProtectedRoute`, disabled buttons, hidden tabs) are for user experience only; the Spring Boot backend enforces authoritative RBAC and tenant isolation.
3. **Password Policy Validation:**
   - Always normalize backend password policy payloads via `normalizePasswordPolicy` from `frontend/shared/api/authApi.ts` and validate password inputs using `usePasswordValidation` + `PasswordValidationPanel`.

---

## 4. Accessibility (WCAG 2.2 Level AA) & Keyboard Navigation Standards

1. **Form Fields (`AccessibleField`):**
   - All validated form inputs must either use `<AccessibleField>` from `frontend/shared/accessibility/AccessibleField` or provide:
     - An explicit `<label htmlFor={id}>` (or `aria-label` for compact toolbar/filter inputs).
     - `aria-invalid={Boolean(error)}` and `aria-describedby="${id}-error"` when invalid.
     - An assertive screen-reader error container (`role="alert"`).
2. **Modals & Dialogs (`Modal` / `useFocusTrap`):**
   - Prefer the shared `<Modal>` component (`frontend/shared/design-system/components/Modal.tsx`).
   - Any custom dialog overlay **must** use `useFocusTrap` from `frontend/shared/accessibility/useFocusTrap` (which automatically manages focus containment, `Escape` key dismissal, reference-counted scroll locking, ancestor-safe background `inert`, and focus restoration) and set `role="dialog"`, `aria-modal="true"`, and `aria-labelledby`.
3. **Interactive Controls & Buttons:**
   - Use native `<button type="button">` for clickable actions.
   - If a container element (such as `<Card onClick={...}>` or a launch card) is interactive, it **must** include `role="button"`, `tabIndex={0}`, and an `onKeyDown` handler supporting both `Enter` and `Space`.
   - Every icon-only button **must** have a descriptive `aria-label`, and decorative icons inside labeled buttons should set `aria-hidden="true"`.
   - Segmented filter/toggle button groups must use `role="group"` with `aria-label`/`aria-labelledby` and `aria-pressed={isSelected}` on each toggle button.
4. **No Native Browser Dialogs (`window.confirm` / `window.alert`):**
   - Never use `window.confirm(...)` or `window.alert(...)`.
   - Use `requestConfirmation(...)` / `confirmation.confirm(...)` from `frontend/shared/confirmation` for confirmations, and `toast` from `frontend/shared/toaster` for notifications.

---

## 5. Testing & Verification Requirements

1. **Required Pre-PR Commands (from `frontend/`):**
   - `npm run typecheck` — Must pass with 0 TypeScript errors across all workspaces.
   - `npm run test` — Must pass all Vitest unit, accessibility, and architectural tests across all workspaces.
   - `npm run build --workspaces --if-present` — Must succeed across all packages and microfrontends.
2. **What Every New Story Must Test:**
   - Shared utilities, API clients, and data adapters must have deterministic unit tests.
   - New form validation rules and error mappers must test both valid and invalid edge cases.
   - Interactive components and modals must verify accessibility attributes (`role`, `aria-*`, keyboard handlers).

---

## 6. SCSS Styling & Strict Typing Standards

1. **SCSS-Only Styling Policy:**
   - All styling must be written in modular SCSS (`.scss`) files.
   - Inline styles (`style={{ ... }}`) are prohibited in production React components. Extract layouts, spacing, table column widths, and color overrides into shared SCSS classes in `frontend/shared/design-system/styles/` or component SCSS modules.
2. **Zero-Any Strict Typing:**
   - Production code must maintain strong typing. Bypassing TypeScript compiler checks using `any` or unchecked type assertions is strictly disallowed.
   - Use strongly typed response wrappers (such as `ApiResponseEnvelope<T>` and `unwrapResponse<T>`) for API clients.
3. **Centralized Error Helpers:**
   - Error extraction must route through `frontend/shared/api/errors.ts` or `getApiErrorMessage` from `frontend/shared/api-client`.

