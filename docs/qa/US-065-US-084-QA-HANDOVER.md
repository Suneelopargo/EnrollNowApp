# QA Handover & Verification Report: Sprint 1 Stories US-065 & US-084

**Target Application:** EnrollNow  
**Branch:** `rolesimplementation`  
**Stories In Scope:**
1. **US-065 — Configure Site Security Policy** (Client References: REG-024, NFR-003)
2. **US-084 — Maintain General Site Settings** (Client Reference: FUNC-069)
**Legacy Reference:** Ripple application (`client/components/authenticated/admin/security-setting-page.jsx`, `client/components/authenticated/admin/general-settings.jsx`)

---

## 1. Executive Summary

This release delivers the complete, authoritative implementation of **US-065 (Configure Site Security Policy)** and **US-084 (Maintain General Site Settings)** in EnrollNow. All implementation gaps identified during the comparison between legacy Ripple and EnrollNow have been closed across the database, backend services/controllers, security enforcement filters, and frontend administration microfrontend.

100% of automated backend and frontend tests pass cleanly, with zero regressions.

---

## 2. Legacy Ripple vs. EnrollNow Architecture & Parity

| Feature | Legacy Ripple Implementation | EnrollNow Target Implementation | Status / Resolution |
| :--- | :--- | :--- | :--- |
| **Security Policy Storage** | MongoDB `SecuritySettings` collection (single document per deployment) | PostgreSQL `enrollnow.security_settings` table (isolated per `tenant_id`) | **Achieved**: Multi-tenant isolation enforced via `uk_security_settings_tenant` and Flyway migration `V19`. |
| **General Settings Storage** | MongoDB `TextMessageSettings` collection | PostgreSQL `enrollnow.general_settings` table (isolated per `tenant_id`) | **Achieved**: Created in `V19__general_site_settings.sql` with default automated text reply template. |
| **Failed Login Lockout** | `lockAfterNAttempts` (schema default 5) | `max_failed_login_attempts` (default 10) | **Achieved**: Enforced in `LoginService.authenticate()`; locks account on threshold breach with audit record. |
| **Concurrent Sessions** | `preventConcurrentSessions` toggle | `prevent_concurrent_sessions` toggle | **Achieved**: Enforced in `UserSessionService.createSession()`; terminates older sessions when active. |
| **Inactivity Logout** | `logoutAfterNMinutes` (default 30 min) | `inactivity_logout_minutes` (default 30 min) | **Achieved**: Enforced in `SessionValidationService.validateSession()`. |
| **Inactivity Lockout** | `lockAfterInactivity` (value + unit: 3 months / 90 days) | `inactivity_lock_days` (default 90 days) | **Achieved**: Enforced during `LoginService.authenticate()`; locks account and records `INACTIVITY_LOCK`. |
| **Password Expiration** | `passwordsExpireAfter` (value + unit: 6/10 months) | `password_expiry_days` (default 300 days) | **Achieved**: Enforced during `LoginService.authenticate()`; locks account and records `PASSWORD_EXPIRED`. |
| **Password History Reuse** | `preventLastNPasswords` (default 4) | `password_history_count` (default 4) | **Achieved**: Enforced via `PasswordPolicyValidator` querying `user_password_history`. |
| **Password Complexity** | Min chars (10), Min strength, Digit, Symbol, Mixed case | `minimum_password_length` (10), `minimum_password_strength`, `require_digit`, `require_symbol`, `require_mixed_case` | **Achieved**: Enforced on account activation (`UserInvitationService`) and password reset (`PasswordRecoveryService`). |
| **Reset to Defaults** | Meteor method `setDefaultSecuritySettings` | REST endpoint `POST /api/v1/security-settings/reset-defaults` | **Achieved**: Accessible modal confirmation dialog resets policy to system defaults. |
| **Default Text Reply (US-084)**| `TextMessageSettings.defaultMessageResponse` (max 160 chars) | `general_settings.default_text_reply` (max 160 chars) | **Achieved**: Full CRUD view with live character counter, blank validation, save/discard. |
| **Access Control & RBAC** | Role checks (`admin`) | Granular permissions: `SITE_SECURITY_MANAGE`, `SITE_SETTINGS_VIEW`, `SITE_SETTINGS_MANAGE` | **Achieved**: Enforced in `SiteAuthorizationService` for both tenant-scoped and caller-scoped requests. |

---

## 3. Database Migrations

### Flyway Migration: `V19__general_site_settings.sql`
- **Location:** `backend/enrollnow-app/src/main/resources/db/migration/V19__general_site_settings.sql`
- **Schema Changes:**
  ```sql
  CREATE TABLE IF NOT EXISTS general_settings (
      id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id            UUID NOT NULL,
      default_text_reply   VARCHAR(160) NOT NULL DEFAULT 'This is an automated message. We can not receive replies to this number.',
      created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
      created_by           UUID,
      updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_by           UUID,
      CONSTRAINT fk_general_settings_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      CONSTRAINT uk_general_settings_tenant UNIQUE (tenant_id)
  );
  ```
- **Seed Data:**
  - Seeds default general settings for all existing tenants.
  - Seeds baseline default security settings for existing tenants if not already present.

---

## 4. Backend Implementation & API Contracts

### Endpoints
All endpoints support both `/api/v1/...` (resolving tenant from JWT caller context) and `/api/v1/tenants/{tenantId}/...`:

| Method | Endpoint | Required Permission | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/security-settings` | `SITE_ADMIN` / `SITE_ADMIN_ACCESS` | Retrieves current tenant security settings |
| `PUT` | `/api/v1/security-settings` | `SITE_ADMIN` / `SITE_SECURITY_MANAGE` | Updates security settings with boundary validation |
| `POST` | `/api/v1/security-settings/reset-defaults` | `SITE_ADMIN` / `SITE_SECURITY_MANAGE` | Resets security settings to system defaults |
| `GET` | `/api/v1/general-settings` | `SITE_SETTINGS_VIEW` / `SITE_MANAGER` / `SITE_ADMIN` | Retrieves general site settings |
| `PUT` | `/api/v1/general-settings` | `SITE_ADMIN` / `SITE_SETTINGS_MANAGE` | Updates general site settings (Default Text Reply) |

### Key Backend Components
- `com.enrollnow.identity.models.GeneralSettings` & `GeneralSettingsRepository`
- `com.enrollnow.identity.services.SecuritySettingsService`: Manages retrieval, updates with validation, and defaults reset.
- `com.enrollnow.identity.services.GeneralSettingsService`: Manages general site settings with non-blank and 160-char length validation.
- `com.enrollnow.identity.services.PasswordPolicyValidator`: Validates passwords against tenant security settings and prevents reuse against `user_password_history`.
- `com.enrollnow.identity.services.LoginService`: Enforces inactivity lockout (`inactivityLockDays`) and password expiration (`passwordExpiryDays`) during user login.
- `com.enrollnow.identity.controllers.SecuritySettingsController` & `GeneralSettingsController`

---

## 5. Frontend MFE Implementation

### Views & Navigation
- **Module:** `frontend/microfrontends/administration`
- **Navigation:**
  - Tab **Security** (active for `SITE_ADMIN` users) -> Renders `SecurityView.tsx`
  - Tab **General Settings** -> Renders `GeneralSettingsView.tsx`
- **Components:**
  - `frontend/microfrontends/administration/src/components/SecurityView.tsx`:
    - Responsive 2-column layout: **Sessions & Inactivity** (Left) and **Passwords & Complexity** (Right).
    - Supports days/weeks/months/years time-unit select dropdowns with automatic mathematical conversion to days.
    - Dirty tracking with "Unsaved Changes" pill.
    - "Save Settings", "Discard Changes", and "Reset to Default Settings" buttons.
    - Confirmation dialog for resetting to defaults.
  - `frontend/microfrontends/administration/src/components/GeneralSettingsView.tsx`:
    - Editable **Default Text Reply** expandable textarea with 160-character limit.
    - Live remaining character counter (`X / 160 characters remaining`).
    - Validation prevents saving blank or whitespace-only messages.
    - Informational facility and system overview tiles.
- **Client & Mock Layer:**
  - `frontend/shared/api/securitySettingsApi.ts`
  - `frontend/shared/api/generalSettingsApi.ts`
  - Updated `frontend/shared/mock-api/mockStore.ts` & `mockAdapter.ts` to support offline development and mock API mode.

---

## 6. QA Test Scenarios

### Scenario 1: Configure & Persist Site Security Policy (US-065)
1. **Prerequisites:** Log in as a user with `SITE_ADMIN` role (e.g. `sriram.chavali@solventek.com`).
2. **Steps:**
   - Navigate to **Site Admin > Security**.
   - Verify the current persisted values load properly.
   - Modify fields:
     - Change failed login attempts to `7`.
     - Toggle "Prevent concurrent sessions" to `ON`.
     - Change inactivity logout to `20` minutes.
     - Change inactivity lockout to `4` months.
     - Change minimum password length to `12`.
   - Verify the "Unsaved Changes" badge appears and the "Save Settings" button becomes active.
   - Click "Save Settings".
3. **Expected Result:**
   - Toast alert: `"Site security policy saved successfully."`
   - Refresh the page and verify all modified values remain persisted.

### Scenario 2: Inactivity Lockout Enforcement (US-065)
1. **Prerequisites:** In Security Settings, set "Lock accounts after inactivity" to `90` days.
2. **Steps:**
   - Identify or set a user whose `lastActivityAt` or `lastLoginAt` is older than 90 days.
   - Attempt to log in with that user's valid credentials.
3. **Expected Result:**
   - Login fails with HTTP 403 / AccountLockedException.
   - User security state in database is marked `status = 'LOCKED'` and `lock_reason = 'INACTIVITY_LOCK'`.

### Scenario 3: Password Complexity & History Prevention (US-065)
1. **Prerequisites:** Security settings configured with `minimumPasswordLength = 10`, `requireDigit = true`, `requireSymbol = true`, `passwordHistoryCount = 4`.
2. **Steps:**
   - Attempt to set/reset a user password with:
     - `"short1!"` (< 10 chars) -> Verify error: `"Password must be at least 10 characters long"`.
     - `"PasswordOnly!"` (no digit) -> Verify error: `"Password must contain at least one digit"`.
     - `"Password1234"` (no symbol) -> Verify error: `"Password must contain at least one symbol"`.
     - `"password123!"` (no uppercase) -> Verify error: `"Password must contain mixed upper and lower case characters"`.
     - Re-use the immediate prior password -> Verify error: `"Cannot reuse any of your last 4 passwords"`.

### Scenario 4: Reset Security Settings to Default (US-065)
1. **Steps:**
   - In **Site Admin > Security**, click "Reset to Default Settings".
   - A modal dialog appears: `"Reset to Default Settings? This action will reset all security and session policies to the system recommended minimum values."`
   - Click "Yes, Reset to Defaults".
2. **Expected Result:**
   - All values reset to defaults (10 failed attempts, 30 min logout, 90 days inactivity lock, 10 months expiry, 4 password history, min length 10, digit/symbol/mixed case enabled).
   - Toast alert: `"Security settings reset to recommended defaults."`

### Scenario 5: Maintain General Site Settings (US-084)
1. **Prerequisites:** Log in as `SITE_ADMIN` or `SITE_MANAGER`.
2. **Steps:**
   - Navigate to **Site Admin > General Settings**.
   - Verify the "Default Text Reply" template loads.
   - Verify live character counter shows remaining characters out of 160.
   - Attempt to enter whitespace only and click Save -> Verify inline warning `"Default text reply cannot be blank"`.
   - Enter: `"EnrollNow clinical center reply: Please call our research coordinator office directly at 555-0199 for protocol assistance."`
   - Click "Save Settings".
3. **Expected Result:**
   - Toast alert: `"General site settings saved successfully."`
   - Reload page; verify saved reply text persists accurately.

### Scenario 6: Role-Based Authorization
1. **Steps:**
   - Log in as a user with only `SITE_REGISTRY` access (no site admin permission).
   - Verify neither Security nor General Settings tabs are accessible.
   - Log in as `SITE_MANAGER` (non-admin).
   - Verify Security tab is hidden / restricted to Site Admin only.
   - Verify General Settings tab is visible.

---

## 7. Automated Test Verification Summary

- **Backend Modules Tested:**
  - `enrollnow-common`: 5 tests passed
  - `enrollnow-identity-service`: 54 tests passed (including `SecuritySettingsServiceTest`, `GeneralSettingsServiceTest`, `PasswordPolicyValidatorTest`, `LoginServiceTest`, `SecurityAndGeneralSettingsControllerTest`)
  - `enrollnow-app`: 3 Flyway migration & controller integration tests passed
  - **Total Backend Tests:** 62 tests, 0 failures, 0 errors.
- **Frontend Workspaces Tested:**
  - `shared`: 12 test files, 102 tests passed
  - `microfrontends/administration`: 2 test files, 18 tests passed (`siteSettingsViews.test.ts`, `administratorApi.test.ts`)
  - All other microfrontends (`identity`, `study`, `participant`, `recruitment`, `survey`, `task`, `communication`, `document`, `dashboard`): 100% passed.
  - **TypeScript Typecheck:** 0 errors across all workspaces in monorepo.
