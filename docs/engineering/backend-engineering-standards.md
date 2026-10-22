# EnrollNow Backend Engineering Standards & Architecture Rules

This document establishes the mandatory engineering standards, architectural rules, and implementation patterns for all backend modules in the EnrollNow platform. These rules must be followed for all future stories, code reviews, and refactoring efforts starting from Sprint 2.

---

## 1. Architecture & Module Boundaries

### 1.1 Multi-Module Reactor Structure
The EnrollNow backend is structured as a 15-module Maven reactor running **Java 21** and **Spring Boot 3.3.4**:

- **Active Modules (5):**
  - `enrollnow-common`: Core infrastructure, shared exceptions, standard API response wrappers (`ApiResponse`, `ApiError`), cryptographic utilities (`SecurityTokenHelper`), and `GlobalExceptionHandler`. **Must never depend on domain modules.**
  - `enrollnow-identity-service`: User authentication, credential management (Argon2id), password policy validation, password recovery, session management, general settings, and security settings.
  - `enrollnow-study-service`: Clinical study lifecycle, study access validation, and study member assignments.
  - `enrollnow-dashboard-service`: Aggregated dashboard metrics and study workspace summaries.
  - `enrollnow-app`: Application bootstrapper (`EnrollNowApplication`), Spring Security OAuth2 Resource Server configuration (`SecurityConfig`, `JwtDecoderConfig`, `SessionValidationFilter`), Flyway migrations (`V1`–`V20`), registry participant endpoints, and cross-domain query orchestration (`UserManagementQueryService`).
- **Placeholder / Skeleton Modules (9):**
  - `enrollnow-administration-service`, `enrollnow-organization-service`, `enrollnow-participant-service`, `enrollnow-recruitment-service`, `enrollnow-survey-service`, `enrollnow-task-service`, `enrollnow-communication-service`, `enrollnow-document-service`, `enrollnow-audit-service`.

### 1.2 Dependency Rules
1. **Unidirectional Dependencies:** Dependencies must flow strictly from application/domain services down toward `enrollnow-common`. Domain modules must never introduce circular dependencies.
2. **No Domain Leaks to Common:** Domain business rules, study-specific entities, or user credential models must never be placed into `enrollnow-common`.
3. **Cross-Domain Aggregation:** Cross-module read-model aggregation (combining `identity` and `study` data) is orchestrated in `enrollnow-app` (e.g., `UserManagementQueryService`) or through explicit service boundaries.

---

## 2. SOLID Design & Separation of Concerns

### 2.1 Layered Responsibilities
Every backend feature must honor the 4-layer architecture:

```
[ HTTP Controller ]       -> Validates requests, resolves tenant/caller context, routes to service
         │
[ Domain Service ]        -> Enforces business rules, authorization, transactions, orchestration
         │
[ Persistence Repository] -> Executes Spring Data JPA queries, projections, batching
         │
[ Relational Database ]   -> PostgreSQL with Flyway-managed schema
```

### 2.2 Layering Rules
1. **Controllers Must Be Thin:**
   - Controllers must contain **zero** direct repository calls or entity mutations.
   - All new Sprint 2+ controllers must accept strongly-typed request DTOs annotated with `@Valid` (do not introduce new `@RequestBody Map<String, Object>` endpoints).
2. **Services Own Business Logic and Transactions:**
   - All domain operations, validations, cryptographic operations, and mutations belong in `@Service` classes.
   - Mutating service methods must be annotated with `@Transactional`. Read-only methods should use `@Transactional(readOnly = true)`.
3. **Repositories Focus Purely on Persistence:**
   - Repositories must extend `JpaRepository` or `JpaSpecificationExecutor`.
   - Every query on multi-tenant tables must scope by `tenantId`.
4. **DTOs Must Not Expose JPA Entities:**
   - Never return raw JPA entities from REST endpoints. Use dedicated Request and Response DTOs.

---

## 3. Standard API Contracts & Response Harmonization

### 3.1 Standard Response Envelope (`ApiResponse<T>`)
All new REST endpoints (and refactored endpoints such as `StudyController` and `DashboardController`) return `ApiResponse<T>` defined in `enrollnow-common`:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "id": "c1f7a0b3-6e42-4f1a-b33a-9e1234567890",
    "name": "Cardiology Phase II Trial"
  },
  "correlationId": "b1a2c3d4-e5f6-7890-abcd-1234567890ab",
  "timestamp": "2026-10-22T21:00:00Z"
}
```

> **Compatibility Note for Existing Frontend Endpoints:** Several Sprint 1 endpoints (`AuthController`, `UserController`, `RoleController`, `GeneralSettingsController`, `SecuritySettingsController`, `MyStudiesController`, `UserManagementQueryController`, `RegistryParticipantController`) intentionally return direct DTOs or lists on HTTP 2xx success to preserve compatibility with existing frontend API clients (`authApi.ts`, `administrationApi.ts`, `generalSettingsApi.ts`, `securitySettingsApi.ts`). Do not wrap their 2xx responses without a coordinated update to the corresponding frontend client.

### 3.2 Standard Error Envelope
All error responses generated by `GlobalExceptionHandler`, `IdentityExceptionHandler`, `StudyExceptionHandler`, or `SessionValidationFilter` produce the unified `ApiResponse<Void>` error schema containing both root-level convenience fields (`status`, `code`, `message`, `reason`) and the nested `error` object (`code`, `message`, `details`):

```json
{
  "success": false,
  "status": 400,
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "title": "Study name/title is required"
    }
  },
  "correlationId": "b1a2c3d4-e5f6-7890-abcd-1234567890ab",
  "timestamp": "2026-10-22T21:00:00Z"
}
```

### 3.3 HTTP Status Code Rules
- `200 OK`: Successful read or update.
- `201 Created`: Resource successfully created.
- `204 No Content`: Successful deletion or state change with no response body.
- `400 Bad Request`: Validation failure or malformed payload.
- `401 Unauthorized`: Missing, invalid, or revoked authentication/session token.
- `403 Forbidden`: Authenticated user lacks permission or cross-tenant access is rejected.
- `404 Not Found`: Target entity or resource does not exist within the caller's tenant.
- `409 Conflict`: Resource conflict (e.g., duplicate email).
- `429 Too Many Requests`: Rate limit or brute-force throttling triggered.
- `500 Internal Server Error`: Unhandled server exception (never expose internal stack traces).

---

## 4. Security, Authentication & Multi-Tenancy

### 4.1 Authoritative Security Architecture
The EnrollNow platform security architecture is built on **Spring Security 6 OAuth2 Resource Server** backed by Nimbus (`JwtDecoderConfig`, `SecurityConfig`) and server-side session validation (`SessionValidationFilter`):

1. **Token Format:** JWT tokens issued by `JwtTokenService` are signed with HMAC-SHA256 (`HS256`) and contain `sub` (`userId` UUID), `tenantId` (UUID), `email`, and `roles`.
2. **Server-Side Session Validation:** Every authenticated request passes through `SessionValidationFilter`, which verifies that the raw Bearer token's SHA-256 hash matches an active, non-expired session in PostgreSQL (`user_sessions`) and that the user is not locked (`user_security_state`). If revoked or invalid, the filter terminates the request immediately with HTTP 401 and a standard `ApiResponse` JSON body.
3. **Deprecation of Legacy JJWT Classes:** The legacy `io.jsonwebtoken` classes in `enrollnow-common` (`JwtTokenProvider`, `JwtVerifier`, `CommonJwtAuthenticationFilter`, `UserPrincipal`) are annotated with `@Deprecated(since = "1.0.0", forRemoval = true)` and are **not** registered as Spring beans. New code must never use these classes.

### 4.2 Multi-Tenant Isolation
EnrollNow is a strict multi-tenant clinical application. Cross-tenant data access is forbidden.

1. **Path vs Token Validation:** When a controller accepts a `{tenantId}` path variable, it must verify that the caller's JWT token `tenantId` matches the path `tenantId` via `siteAuthorizationService.requireTenantMatch(pathTenantId)`.
2. **No Global Fallback When Tenant Is Known:** Repository lookups for tenant-owned resources (such as `StudyService.findStudyByIdOrCode`) must **never** fall back to un-scoped `findById(id)` when `tenantId != null`.

### 4.3 Cryptographic Standards
1. **Password Hashing:** Passwords must be hashed using Argon2id (`Argon2PasswordEncoder` in `enrollnow-common` with 64 MB memory, 3 iterations, parallelism 1, 16-byte salt, 32-byte hash).
2. **Token Generation & Hashing:** All high-entropy action tokens and session token hashes must use the static utility methods in `SecurityTokenHelper`:
   ```java
   String rawToken = SecurityTokenHelper.generateSecureToken(); // 32-byte SecureRandom URL-safe Base64 (43 chars)
   String tokenHash = SecurityTokenHelper.hashToken(rawToken);  // SHA-256 lowercase hex (64 chars)
   ```
   **Never re-implement `SecureRandom` or `MessageDigest.getInstance("SHA-256")` in domain services.**

---

## 5. Database Access & Persistence Standards

### 5.1 Prevention of N+1 Queries
1. **Batch Fetching:** Never execute repository queries inside a loop over entities. Pre-fetch related records in batch queries scoped by `tenantId` (or `IN (:ids)`) and group in memory with `Collectors.groupingBy(...)`.
2. **Pagination:** New list/search endpoints in Sprint 2+ should accept `Pageable` and return bounded pages rather than unbounded lists.

### 5.2 Database Migrations (Flyway)
1. Schema changes must only be made via Flyway SQL migration scripts located in `backend/enrollnow-app/src/main/resources/db/migration/`.
2. Existing migrations (`V1` through `V20`) must never be modified or deleted.

---

## 6. Automated Quality Gates vs Manual Review Guidance

To avoid ambiguity, quality controls are divided into **Automated Build Checks** (enforced by Maven) and **Manual Code Review Checks** (enforced via PR review):

### 6.1 Automated Build Checks (Configured in `backend/pom.xml`)
- **Java 21 Compiler Enforcement (`maven-compiler-plugin:3.13.0`):** Enforces `<release>21</release>` and `<parameters>true</parameters>` across all 15 modules.
- **Mandatory Unit Test Execution (`maven-surefire-plugin:3.2.5`):** Enforces `<testFailureIgnore>false</testFailureIgnore>`. Any failing unit test fails the build (`mvn test -f backend/pom.xml`).

### 6.2 Manual Code Review Checks (Not Automated via Static Analysis Plugins)
The repository does **not** currently configure Checkstyle, SpotBugs, PMD, ArchUnit, or JaCoCo coverage thresholds in `backend/pom.xml`. Therefore, reviewers must manually verify during Pull Request review (using `docs/engineering/backend-story-review-checklist.md`):
- Layering discipline (no repository injection into controllers).
- Multi-tenant isolation (`requireTenantMatch` and tenant-scoped repository queries).
- Absence of N+1 query loops.
- Usage of `SecurityTokenHelper` and `ApiResponse`.
- Meaningful unit and controller test coverage for new code.
