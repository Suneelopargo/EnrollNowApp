# EnrollNow Backend Code Duplication Register

This register documents code duplication, overlapping implementations, and intentional domain separations across the EnrollNow backend codebase identified during the Sprint 1 remediation initiative and audited during independent verification.

---

## 1. Summary of Audit Findings

| Category | Count | Status |
| :--- | :--- | :--- |
| **Confirmed Duplications Consolidated** | 4 | **Remediated & Verified** (Shared implementations established & verified) |
| **Architectural / Domain Separations** | 3 | **Retained Intentionally** (Documented with rationale) |
| **Deprecated Legacy Implementations** | 1 | **Marked `@Deprecated` & Unwired from Component Scan** (JJWT legacy vs Nimbus OAuth2 platform) |

---

## 2. Confirmed Duplications & Remediation Log

### Finding DUP-001: Secure Token Generation and SHA-256 Hashing Across 5 Identity Services

- **Severity:** High
- **Source File & Class:** Multiple in `enrollnow-identity-service`
  - `com.enrollnow.identity.services.PasswordRecoveryService`
  - `com.enrollnow.identity.services.UserInvitationService`
  - `com.enrollnow.identity.services.UserSessionService`
  - `com.enrollnow.identity.services.SessionValidationService`
  - `com.enrollnow.identity.services.SecuritySettingsService`
- **Method Signatures (Prior to Remediation):**
  - `private String generateSecureToken()` / `private String generateToken()`
  - `private String hashToken(String rawToken)` / `public String hashToken(String rawToken)`
- **Evidence of Duplicated Behavior:**
  - Every service independently instantiated `new SecureRandom()`, allocated a 32-byte array, called `random.nextBytes(bytes)`, and encoded it using `Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)`.
  - Every service independently instantiated `MessageDigest.getInstance("SHA-256")`, digested UTF-8 bytes, and converted the resulting hash to a lowercase hex string using `HexFormat.of().formatHex(hash)` or manual hex loops.
  - This violated DRY and scattered cryptographic token logic across 5 separate service classes.
- **Existing Callers:**
  - `PasswordRecoveryService`: Forgot password and reset token flows.
  - `UserInvitationService`: Member invitation and activation token flows.
  - `UserSessionService`: Session token hash storage on login.
  - `SessionValidationService`: Inbound session token hash lookup in PostgreSQL.
  - `SecuritySettingsService`: Public password policy token lookup and force-reset token generation.
- **Authoritative Owner:**
  - `com.enrollnow.common.security.SecurityTokenHelper` in `enrollnow-common` (final static utility class).
- **Changes Implemented:**
  1. Created `SecurityTokenHelper` in `enrollnow-common` as a final utility class with a shared thread-safe `SecureRandom` instance, `SecurityTokenHelper.generateSecureToken()` (32 bytes / 256 bits URL-safe Base64 without padding), and `SecurityTokenHelper.hashToken(String)` (SHA-256 lowercase hex via `HexFormat.of().formatHex`).
  2. Refactored all 5 identity services to delegate token generation and hashing to `SecurityTokenHelper.generateSecureToken()` and `SecurityTokenHelper.hashToken(...)`.
  3. Removed duplicated private `generateToken()` and `hashToken()` methods from all 5 services (including dead leftover methods removed from `SecuritySettingsService` during independent verification).
- **Tests Performed:**
  - `SecurityTokenHelperTest` in `enrollnow-common` (3 tests verifying token length, URL-safety, uniqueness, SHA-256 deterministic 64-character hex format, and null/blank input rejection).
  - Service unit tests in `enrollnow-identity-service` (`PasswordRecoveryServiceTest`, `UserInvitationServiceTest`, `SessionValidationServiceTest`, `SecuritySettingsServiceTest`, `LoginServiceTest`).
- **Remaining Risks:** Token hash lookup occurs via database index equality (`findByTokenHash(tokenHash)`) rather than in-memory byte comparison; hashes are one-way SHA-256 digests of 256-bit random tokens.

---

### Finding DUP-002: Inconsistent API Response Wrappers and Exception Handler Formats

- **Severity:** Critical
- **Source Files & Classes:**
  - `com.enrollnow.common.core.ApiResponse` (`enrollnow-common`)
  - `com.enrollnow.common.web.GlobalExceptionHandler` (`enrollnow-common`)
  - `com.enrollnow.identity.exceptions.IdentityExceptionHandler` (`enrollnow-identity-service`)
  - `com.enrollnow.study.controllers.StudyExceptionHandler` (`enrollnow-study-service`)
  - `com.enrollnow.config.SessionValidationFilter` (`enrollnow-app`)
- **Evidence of Duplicated & Inconsistent Behavior:**
  - `GlobalExceptionHandler` was returning `ApiResponse<Void>` with `{ "success": false, "error": { "code": "...", "message": "..." } }` without root-level `status` or `code`.
  - `IdentityExceptionHandler` was returning raw `Map<String, Object>` with `{ "status": 400, "code": "...", "message": "...", "reason": "...", "timestamp": "..." }`.
  - `StudyExceptionHandler` was returning raw `Map<String, Object>` with `{ "error": "Study not found", "timestamp": "..." }`.
  - `SessionValidationFilter` wrote raw JSON strings with `"error": "Unauthorized"` (a string instead of an `ApiError` object) and omitted `correlationId`.
- **Authoritative Owner:**
  - `ApiResponse<T>`, `ApiError`, and `GlobalExceptionHandler` in `enrollnow-common`.
- **Changes Implemented:**
  1. Enhanced `ApiResponse<T>` with root-level convenience fields (`status`, `code`, `reason`) alongside the nested `error` object (`code`, `message`, `details`), `correlationId` (from SLF4J MDC), and `timestamp`. Added overloaded `ApiResponse.error(status, code, message)` and `ApiResponse.error(status, code, message, reason)` factory methods.
  2. Refactored `GlobalExceptionHandler` to produce uniform `ResponseEntity<ApiResponse<Void>>` across validation (`400`), bad request (`400`), access denied (`403`), not found (`404`), and unhandled server errors (`500`).
  3. Refactored `IdentityExceptionHandler` to return `ResponseEntity<ApiResponse<Void>>` using `ApiResponse.error(...)` while preserving root-level `code` and `reason` required by `frontend/shared/api-client` and `authErrorMapper.ts`.
  4. Refactored `StudyExceptionHandler` to return `ResponseEntity<ApiResponse<Void>>` for `StudyNotFoundException`.
  5. Refactored `SessionValidationFilter` in `enrollnow-app` (completed during independent verification) to serialize `ApiResponse.error(401, code, message, reason)` via Jackson `ObjectMapper` so `"error"` is a structured `ApiError` object and `correlationId` is included.
- **Tests Performed:**
  - `GlobalExceptionHandlerTest` in `enrollnow-common` (4 tests).
  - `IdentityExceptionHandlerTest` in `enrollnow-identity-service` (4 tests).
  - `SessionValidationFilterTest` in `enrollnow-app` (4 tests verifying `SESSION_REVOKED`, `INVALID_SESSION`, passive check header, and valid session pass-through).
- **Remaining Risks:** Root-level `code`/`message` and nested `error.code`/`error.message` are kept synchronized by `ApiResponse` constructors and factory methods, though mutable setters exist on `ApiResponse` and should not be used to set conflicting values.

---

### Finding DUP-003: N+1 Database Query Pattern in User Management

- **Severity:** High (Performance & Scalability Defect)
- **Source File & Class:**
  - `com.enrollnow.usermanagement.services.UserManagementQueryService` in `enrollnow-app`
- **Method Name & Signature:**
  - `public List<UserListItemResponse> getUsers(UUID tenantId, UUID requestedSiteId)` (and overload `getUsers(UUID tenantId)`)
- **Evidence of Duplicated Inefficient Queries:**
  - Prior to remediation, for a tenant with $N$ users, `getUsers` executed $1 + 4N$ queries inside a per-user loop (`userEmailRepository`, `studyMemberRepository`, `studyRepository`, `userRoleAssignmentRepository`, `roleRepository`).
- **Authoritative Owner:**
  - `UserManagementQueryService` utilizing tenant-scoped batch repository queries.
- **Changes Implemented:**
  1. Added tenant-level batch repository methods:
      - `UserEmailRepository.findByTenantIdAndPrimaryEmailTrue(UUID tenantId)`
      - `StudyMemberRepository.findByTenantIdAndActiveTrue(UUID tenantId)`
      - `UserRoleAssignmentRepository.findByTenantIdAndActiveTrue(UUID tenantId)`
  2. Refactored `UserManagementQueryService.getUsers(UUID tenantId, UUID requestedSiteId)` to execute $O(1)$ queries with respect to user count $N$:
      - Query 1: `userRepository.findByTenantIdOrderByCreatedAtDesc(tenantId)` (if empty, returns immediately after 1 query).
      - Query 2 (only when `requestedSiteId == null`): `siteRepository.findFirstByTenantIdAndActiveTrueOrderByNameAsc(tenantId)` (plus fallback `siteRepository.findFirstByTenantId(tenantId)` only if no active site exists).
      - Query 3: `userEmailRepository.findByTenantIdAndPrimaryEmailTrue(tenantId)`
      - Query 4: `roleRepository.findAll()`
      - Query 5: `userRoleAssignmentRepository.findByTenantIdAndActiveTrue(tenantId)`
      - Query 6: `studyMemberRepository.findByTenantIdAndActiveTrue(tenantId)`
      - Query 7: `studyRepository.findByTenantId(tenantId)`
  3. Total queries per call: **6 queries** when `requestedSiteId != null`, **7 queries** when `requestedSiteId == null` and an active site exists, or **8 queries** when `requestedSiteId == null` and no active site exists.
- **Tests Performed:**
  - `UserManagementQueryServiceTest` in `enrollnow-app` (3 tests verifying empty-tenant short-circuiting, 6-query path with `requestedSiteId`, and 7/8-query path without `requestedSiteId`).
- **Remaining Risks:** `getUsers` currently loads all users and associations for the tenant as an unpaginated `List<UserListItemResponse>` to preserve compatibility with `administrationApi.ts`. Server-side pagination (`Pageable`) should be coordinated with the frontend when tenant user counts grow large.

---

### Finding DUP-004: Direct Entity Mutation & Business Logic in StudyController

- **Severity:** Medium
- **Source File & Class:**
  - `com.enrollnow.study.controllers.StudyController` and `com.enrollnow.study.services.StudyService` in `enrollnow-study-service`
- **Evidence of Violation:**
  - `StudyController` previously interacted directly with `StudyRepository`, mutated JPA entities inline, and mixed HTTP routing with study domain logic.
- **Authoritative Owner:**
  - `com.enrollnow.study.services.StudyService` (extracted domain service).
- **Changes Implemented:**
  1. Created `StudyService` domain service implementing study listing, assigned-study filtering for non-admin users, lookup by ID or study code, study creation, and study updates.
  2. Created request DTOs `CreateStudyRequest` and `UpdateStudyRequest`.
  3. Refactored `StudyController` to delegate persistence and business operations to `StudyService`.
  4. Fixed a cross-tenant fallback bug in `StudyService.findStudyByIdOrCode` and non-admin study filtering in `StudyController.getStudies` during independent verification.
- **Tests Performed:**
  - `StudyServiceTest` (6 unit tests including cross-tenant isolation regression tests).
  - `StudyControllerTest` (7 unit tests covering path-tenant and token-tenant resolution, non-admin study filtering, and CRUD responses).
- **Remaining Risks:** `StudyController` still accepts `@RequestBody(required = false) Map<String, Object> payload` and maps it to `CreateStudyRequest`/`UpdateStudyRequest` to preserve legacy callers that send empty bodies or alias fields (`title`, `protocolNumber`, `targetEnrollment`).

---

## 3. Deprecated Legacy Implementations

### Finding DEP-001: Legacy JJWT Provider vs Active Nimbus OAuth2 Resource Server

- **Severity:** High (Security & Architectural Ambiguity — Remediated in Verification)
- **Source Files:**
  - `com.enrollnow.common.security.JwtTokenProvider` (`enrollnow-common`)
  - `com.enrollnow.common.security.JwtVerifier` (`enrollnow-common`)
  - `com.enrollnow.common.security.CommonJwtAuthenticationFilter` (`enrollnow-common`)
  - `com.enrollnow.common.security.UserPrincipal` (`enrollnow-common`)
- **Active Platform Architecture:**
  - `enrollnow-app` and `enrollnow-identity-service` use Spring Security 6 OAuth2 Resource Server (`JwtDecoderConfig`, `JwtTokenService`, `SecurityConfig`, `SessionValidationFilter`).
- **Resolution (Completed in Independent Verification):**
  - Removed `@Component` from `CommonJwtAuthenticationFilter` and `JwtTokenProvider` so Spring Boot component scanning (`@SpringBootApplication(scanBasePackages = "com.enrollnow")`) never auto-registers the legacy filter or provider bean at runtime.
  - Annotated all four legacy classes (`CommonJwtAuthenticationFilter`, `JwtTokenProvider`, `JwtVerifier`, `UserPrincipal`) with `@Deprecated(since = "1.0.0", forRemoval = true)`.
  - Retained `JwtTokenProviderTest` for standalone unit test coverage until the classes are removed in a future release.

---

## 4. Architectural & Domain Separations Retained Intentionally

### Item SEP-001: Separate User and Identity Repositories
- `com.enrollnow.identity.repositories.UserRepository` (`enrollnow-identity-service`) manages core identity principals, while `com.enrollnow.usermanagement.services.UserManagementQueryService` (`enrollnow-app`) aggregates cross-module read models (users, primary emails, site roles, and study memberships).

### Item SEP-002: Domain-Specific Exception Handlers with Central Fallback
- `GlobalExceptionHandler` (`enrollnow-common`), `IdentityExceptionHandler` (`enrollnow-identity-service`), and `StudyExceptionHandler` (`enrollnow-study-service`) remain modular by domain while all returning `ResponseEntity<ApiResponse<Void>>`.

### Item SEP-003: Tenant Isolation Checks in Controllers and Service Layer
- `GeneralSettingsController`, `SecuritySettingsController`, and `StudyController` enforce `siteAuthorizationService.requireTenantMatch(...)` at the HTTP boundary in addition to service-level checks, providing defense-in-depth.
