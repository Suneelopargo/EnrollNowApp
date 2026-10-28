# EnrollNow — Frontend Code Review Checklist

Use this checklist to verify every frontend pull request before approval.

## 1. Zero Hardcoded or Fabricated Business Data
- [ ] **Authoritative Backend Data Only:** All studies, participants, users, sites, dashboard metrics, provider mappings, and configurations originate from backend APIs.
- [ ] **No Fabrication on Empty or Missing Data:**
  - Empty `/api/v1/studies` responses render an empty state rather than falling back to dashboard overview records.
  - Missing `enrolled` or `targetEnrollment` / `sampleSize` values remain `null` and render `"Target not set"` or `"—"` rather than `0` or `100`.
  - No `@enrollnow.local` fallback user profiles exist in production authentication or shell code.
  - Production error handlers surface explicit error states (`mode: 'error'`) rather than substituting demo or mock records.

## 2. TypeScript Strictness & Shared Packages
- [ ] **Zero `any` in Production Code:** No `: any`, `as any`, or `@ts-ignore` in production `.ts`/`.tsx` files.
- [ ] **Source-Driven Workspace Packages:** `@aiventrahealth/administrator-ui` builds from `src/` via `npm run build` producing `dist/administrator-ui.js`, `dist/administrator-ui.umd.cjs`, and `dist/index.d.ts` before dependent microfrontends build.

## 3. Styling, Accessibility & Validation Alignment
- [ ] **SCSS-Only Styling:** Zero inline `style={{ ... }}` attributes in Study module components; all styling uses semantic SCSS classes in `frontend/shared/design-system/styles/_study.scss`.
- [ ] **Shared Confirmation Modal:** Destructive actions use `requestConfirmation(...)` from `frontend/shared/confirmation` instead of `window.confirm`.
- [ ] **Aligned Validation:** Frontend `STUDY_NAME_RULES` and `StudySettingsDetails` validate trimmed nonblank short names up to 15 characters matching `/^[a-zA-Z0-9 _-]+$/` (accepting `GEN-01` and rejecting special characters).
- [ ] **Verification Gates Pass:** `npm --prefix frontend run typecheck`, `npm --prefix frontend run test:all`, and `npm --prefix frontend run build` pass with exit code 0.
