# EnrollNow — Frontend Story Review Checklist (Sprint 2+)

Use this checklist before opening or approving any frontend pull request. Every item is mandatory unless explicitly marked N/A for the story.

---

## 1. Duplication & Shared Reuse Gate
- [ ] **No Duplicate API Clients or Services:** Checked `frontend/shared/api/` before adding any endpoint method. New endpoints are added to the canonical domain API module in `frontend/shared/api/`.
- [ ] **No Direct HTTP Bypasses:** No component or microfrontend calls `fetch(`, `axios.create(`, or hardcodes `http://localhost:8080` (verified by `frontend/shared/api-architecture.test.ts`).
- [ ] **No Duplicate Components or Modals:** Checked `frontend/shared/design-system/components/` (`Modal`, `Card`, `DataGrid`, `DataTable`, `Tabs`, `Footer`, `StatusBadge`, `LoadingSpinner`) and `frontend/shared/accessibility/` (`AccessibleField`, `useFocusTrap`) before creating custom UI primitives.
- [ ] **No Duplicate Validation or Formatting Logic:** Reused `validators` / `validateForm` from `frontend/shared/design-system/validation`, `validateStudyName` from `frontend/shared/design-system/validation.ts`, and `normalizePasswordPolicy` from `frontend/shared/api/authApi`.
- [ ] **Canonical Domain Modals & State:** Shared domain creation/import modals (`AddStudyModal`, `AddUserModal`) are canonical; host microfrontends do not maintain obsolete dialog refs, dead state, or duplicated event handlers.
- [ ] **No Native Browser Dialogs:** Used `requestConfirmation` / `confirmation` instead of `window.confirm` and `toast` instead of `window.alert`.

---

## 2. API Contract & Error Handling Gate
- [ ] **Consistent Error Extraction:** Used `getApiErrorMessage(err, fallback)` from `frontend/shared/api-client` instead of manual `err?.response?.data?.message` chains.
- [ ] **Async State Completeness:** Every data-fetching view handles `loading`, `error` (with retry where appropriate), `empty`, and `success` states explicitly.
- [ ] **Duplicate-Submit Protection:** Form submit buttons and destructive confirmation actions disable while `isSubmitting` / `isLoading` is true.
- [ ] **Toast Deduplication:** Background or inline-handled requests pass `{ skipToast: true }` so users do not see duplicate error toasts.

---

## 3. Authentication, Session & Security Gate
- [ ] **Centralized Session Access:** Token and user lookups use `useAuth()`, `MfeContext`, `getAccessToken()`, or `getStoredAuthUser()` — never raw `localStorage.getItem('enrollnow_token' | 'enrollnow_user')`.
- [ ] **No Sensitive Data Leakage:** No tokens, passwords, secrets, or participant PII are written to `console.log`.
- [ ] **Safe Rendering:** No unvalidated `dangerouslySetInnerHTML` or unvalidated external redirect URLs.

---

## 4. Accessibility (WCAG 2.2 AA) & Keyboard Navigation Gate
- [ ] **Programmatic Labels:** Every `<input>`, `<select>`, and `<textarea>` has an associated `<label htmlFor="...">` or `aria-label`.
- [ ] **Accessible Field Validation:** Required and validated fields use `<AccessibleField>` or provide `aria-required="true"`, `aria-invalid`, `aria-describedby`, and `role="alert"` error announcements.
- [ ] **Modal Focus & Escape Handling:** Every modal/dialog uses `<Modal>` or `useFocusTrap` with `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `Escape` dismissal, background `inert`, and focus restoration.
- [ ] **Keyboard Operability:** All interactive elements are reachable via `Tab` and operable via `Enter`/`Space`. Icon-only buttons include descriptive `aria-label` attributes; toggle buttons include `aria-pressed`.

---

## 5. Automated Verification Gate
- [ ] `cd frontend && npm run typecheck` passes with zero errors across all workspaces.
- [ ] `cd frontend && npm run test` passes with zero failures across all workspaces, and new unit/regression tests cover the story's changes.
- [ ] `cd frontend && npm run build --workspaces --if-present` completes cleanly.
