# QA Handover & Verification Report: Sprint 1 Stories US-065 & US-084

**Target Application:** EnrollNow  
**Branch:** `rolesimplementation`  
**Stories In Scope:**
1. **US-065 — Configure Site Security Policy** (Client References: REG-024, NFR-003)
2. **US-084 — Maintain General Site Settings** (Client Reference: FUNC-069)
**Legacy Reference:** Ripple application (`client/components/authenticated/admin/security-setting-page.jsx`, `client/components/authenticated/admin/general-settings.jsx`)

---

## 1. Executive Summary

This release delivers the complete, authoritative implementation and final corrections for **US-065 (Configure Site Security Policy)** and **US-084 (Maintain General Site Settings)** in EnrollNow:

1. **End-to-End Inactivity Auto-Logout (US-065):**
   - Authoritative backend enforcement via `SessionValidationService` and `SessionValidationFilter` evaluating `inactivityLogoutMinutes` on every authenticated API request.
   - Dynamic frontend inactivity management (`InactivityManager` and `useInactivityLogout`) embedded into `AuthContext.tsx`.
   - Qualifying user activity tracking (`mousemove`, `mousedown`, `keydown`, `touchstart`, `scroll`) throttled to 1000ms.
   - Multi-tab synchronization using browser `storage` events and `BroadcastChannel` ensuring synchronized session timeout and logout across all open tabs.
   - Auto-logout triggers session clearing, server-side session revocation, navigation to `/login`, and a clear user notification (`Session expired due to inactivity. Please log in again.`).
2. **Authoritative General Site Settings (US-084):**
   - Removed all fabricated business information (fake facility name, "SITE-001", hardcoded timezone, Sunday maintenance window).
   - Preserved authoritative **Default Text Reply** management (up to 160 characters) backed by PostgreSQL `general_settings` table and Flyway migration `V19`.
   - Operational directory and facility profile accurately represented with the standardized `<ComingSoon />` component.
   - Robust error handling: API failures display an actionable error banner with a Retry option; never substitutes fake defaults.
3. **Automated Testing:**
   - 100% of automated backend Maven tests (all 15 modules) and frontend Vitest suites (all 13 workspaces) pass with 0 errors and 0 regressions.

---

## 2. Legacy Ripple vs. EnrollNow Architecture & Parity

| Feature | Legacy Ripple Implementation | EnrollNow Target Implementation | Status / Resolution |
| :--- | :--- | :--- | :--- |
| **Security Policy Storage** | MongoDB `SecuritySettings` collection (single document per deployment) | PostgreSQL `enrollnow.security_settings` table (isolated per `tenant_id`) | **Achieved**: Multi-tenant isolation enforced via `uk_security_settings_tenant` and Flyway migration `V19`. |
| **General Settings Storage** | MongoDB `TextMessageSettings` collection | PostgreSQL `enrollnow.general_settings` table (isolated per `tenant_id`) | **Achieved**: Created in `V19__general_site_settings.sql` with default automated text reply template. |
| **Failed Login Lockout** | `lockAfterNAttempts` (schema default 5) | `max_failed_login_attempts` (default 10) | **Achieved**: Enforced in `LoginService.authenticate()`; locks account on threshold breach with audit record. |
| **Concurrent Sessions** | `preventConcurrentSessions` toggle | `prevent_concurrent_sessions` toggle | **Achieved**: Enforced in `UserSessionService.createSession()`; terminates older sessions when active. |
| **Inactivity Logout** | `logoutAfterNMinutes` (default 30 min) | `inactivity_logout_minutes` (default 30 min, configurable) | **Achieved**: Full end-to-end enforcement in backend (`SessionValidationService`) and frontend (`useInactivityLogout`, `InactivityManager`). |
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
- `com.enrollnow.identity.services.SessionValidationService` & `SessionValidationFilter`: Enforces token validity, hard expiration, and inactivity timeout on all API calls.
- `com.enrollnow.identity.services.PasswordPolicyValidator`: Validates passwords against tenant security settings and prevents reuse against `user_password_history`.
- `com.enrollnow.identity.services.LoginService`: Enforces inactivity lockout (`inactivityLockDays`) and password expiration (`passwordExpiryDays`) during user login.
- `com.enrollnow.identity.controllers.SecuritySettingsController` & `GeneralSettingsController`

---

## 5. Frontend Architecture & Inactivity Auto-Logout

### Inactivity Management Architecture
- **InactivityManager (`frontend/shell/src/auth/inactivityManager.ts`):**
  - Manages session inactivity countdown, timer checks, and multi-tab synchronization.
  - Dynamically loads `inactivityLogoutMinutes` from `securitySettingsApi.getSecuritySettings()`.
  - Attaches throttled (1000ms) event listeners for user input (`mousemove`, `mousedown`, `keydown`, `touchstart`, `scroll`).
  - Broadcasts activity events across tabs via `localStorage['enrollnow_last_active']` and `BroadcastChannel('enrollnow_session_channel')`.
  - When idle time exceeds the configured timeout: writes `STORAGE_KEY_SESSION_LOGOUT`, sends BroadcastChannel `LOGOUT` event, and invokes the logout callback.
  - Reacts to `visibilitychange` to immediately catch timeout when waking or focusing a background tab.
- **Hook Integration (`frontend/shell/src/auth/useInactivityLogout.ts` & `AuthContext.tsx`):**
  - Hooks directly into host application authentication lifecycle.
  - Automatically runs when user is authenticated; stops when logged out.
  - Clears `enrollnow_token`, `enrollnow_user`, calls `authApi.logout()`, navigates to `/login`, and displays a toast notification: `"Session expired due to inactivity. Please log in again."`.

### Views & Navigation
- **Module:** `frontend/microfrontends/administration`
- **Navigation:**
  - Tab **Security** (active for `SITE_ADMIN` users) -> Renders `SecurityView.tsx`
  - Tab **General Settings** -> Renders `GeneralSettingsView.tsx`
- **Components:**
  - `SecurityView.tsx`:
    - Responsive 2-column layout: **Sessions & Inactivity** (Left) and **Passwords & Complexity** (Right).
    - Supports days/weeks/months/years time-unit select dropdowns with automatic mathematical conversion to days.
    - Dirty tracking with "Unsaved Changes" pill.
    - Dispatches `enrollnow_security_policy_updated` and updates `localStorage` upon save/reset so active sessions update their timeout dynamically.
  - `GeneralSettingsView.tsx`:
    - Editable **Default Text Reply** expandable textarea with 160-character limit.
    - Live remaining character counter (`X / 160 characters remaining`).
    - Validation prevents saving blank or whitespace-only messages.
    - Renders `<ComingSoon />` for unimplemented facility profile.
    - Displays clean error banner with Retry button on API failure.

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

### Scenario 2: End-to-End Inactivity Auto-Logout (US-065)
1. **Prerequisites:** Log in with valid credentials.
2. **Steps:**
   - Set "Automatic logout after inactivity" to `1` minute in Security settings (or test via automated fake timer suite).
   - Cease all mouse and keyboard interaction.
   - Open a secondary tab to the same application origin.
   - Wait for the 1-minute timeout to expire.
3. **Expected Result:**
   - Both tabs immediately transition to `/login`.
   - Local and session storage tokens are wiped.
   - Toast notification is displayed: `"Session expired due to inactivity. Please log in again."`.
   - Attempting to make any backend API call with the expired session token returns HTTP 401 with `"Session timed out due to inactivity"`.

### Scenario 3: Multi-Tab Inactivity Reset (US-065)
1. **Prerequisites:** Log in and open Tab A and Tab B.
2. **Steps:**
   - Leave Tab A untouched.
   - Move mouse or press keys in Tab B before the timeout expires.
3. **Expected Result:**
   - Tab B records activity and updates `localStorage['enrollnow_last_active']`.
   - Tab A detects the remote activity and resets its local timer.
   - Tab A does not prematurely log out.

### Scenario 4: Password Complexity & History Prevention (US-065)
1. **Prerequisites:** Security settings configured with `minimumPasswordLength = 10`, `requireDigit = true`, `requireSymbol = true`, `passwordHistoryCount = 4`.
2. **Steps:**
   - Attempt to set/reset a user password with:
     - `"short1!"` (< 10 chars) -> Verify error: `"Password must be at least 10 characters long"`.
     - `"PasswordOnly!"` (no digit) -> Verify error: `"Password must contain at least one digit"`.
     - `"Password1234"` (no symbol) -> Verify error: `"Password must contain at least one symbol"`.
     - `"password123!"` (no uppercase) -> Verify error: `"Password must contain mixed upper and lower case characters"`.
     - Re-use the immediate prior password -> Verify error: `"Cannot reuse any of your last 4 passwords"`.

### Scenario 5: Reset Security Settings to Default (US-065)
1. **Steps:**
   - In **Site Admin > Security**, click "Reset to Default Settings".
   - A modal dialog appears: `"Reset to Default Settings? This action will reset all security and session policies to the system recommended minimum values."`
   - Click "Yes, Reset to Defaults".
2. **Expected Result:**
   - All values reset to defaults (10 failed attempts, 30 min logout, 90 days inactivity lock, 10 months expiry, 4 password history, min length 10, digit/symbol/mixed case enabled).
   - Toast alert: `"Security settings reset to recommended defaults."`

### Scenario 6: Maintain General Site Settings (US-084)
1. **Prerequisites:** Log in as `SITE_ADMIN` or `SITE_MANAGER`.
2. **Steps:**
   - Navigate to **Site Admin > General Settings**.
   - Verify the "Default Text Reply" template loads without fake facility or maintenance data.
   - Verify live character counter shows remaining characters out of 160.
   - Attempt to enter whitespace only and click Save -> Verify inline warning `"Default text reply cannot be blank"`.
   - Enter: `"EnrollNow clinical center reply: Please call our research coordinator office directly at 555-0199 for protocol assistance."`
   - Click "Save Settings".
3. **Expected Result:**
   - Toast alert: `"General site settings saved successfully."`
   - Reload page; verify saved reply text persists accurately.

---

## 7. Automated Test Verification Summary

- **Backend Modules Tested (15/15 Passed):**
  - `enrollnow-common`: 5 tests passed
  - `enrollnow-identity-service`: 54 tests passed (including `SecuritySettingsServiceTest`, `GeneralSettingsServiceTest`, `PasswordPolicyValidatorTest`, `LoginServiceTest`, `SecurityAndGeneralSettingsControllerTest`)
  - `enrollnow-dashboard-service`: 4 tests passed (including `DashboardAggregationServiceTest.shouldPropagateDatabaseExceptionWhenQueryFails`)
  - `enrollnow-study-service`: 2 tests passed
  - `enrollnow-app`: 3 tests passed (`RegistryParticipantControllerTest`)
  - **Total Backend Tests:** 68 tests, 0 failures, 0 errors.
- **Frontend Workspaces Tested (13/13 Passed):**
  - `shared`: 12 test files, 102 tests passed
  - `shell`: 3 test files, 26 tests passed (`InactivityLogout.test.ts`, `AuthContext.test.ts`, `RoleBasedNavigationAndAccess.test.ts`)
  - `microfrontends/administration`: 2 test files, 20 tests passed (`siteSettingsViews.test.ts`, `administratorApi.test.ts`)
  - `microfrontends/dashboard`: 2 test files, 9 tests passed (`dashboardDataAdapter.test.ts`, `dashboard.test.ts`)
  - All other microfrontends (`identity`, `study`, `participant`, `recruitment`, `survey`, `task`, `communication`, `document`): 100% passed.
  - **TypeScript Typecheck:** 0 errors across all 13 workspaces in monorepo.
