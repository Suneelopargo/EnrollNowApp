# EnrollNow Backend Story Review & Pull Request Checklist

This checklist must be completed by the story author before opening a Pull Request and validated by the peer reviewer / Tech Lead prior to approval.

> **Note on Enforcement:** Items marked **[AUTOMATED]** are enforced by the Maven build (`mvn test -f backend/pom.xml`). Items marked **[MANUAL REVIEW]** are not enforced by static analysis plugins and must be explicitly inspected during peer review.

---

## Story Details

- **Story ID & Title:** `________________________________________`
- **Author / Developer:** `________________________________________`
- **Peer Reviewer:** `________________________________________`
- **Date:** `YYYY-MM-DD`

---

## 1. Architecture & Layering [MANUAL REVIEW]

- [ ] **Layer Boundaries Respected:**
  - Controllers contain no business logic, entity mutations, or direct repository access.
  - Domain services own business decisions, validations, and transaction boundaries (`@Transactional`).
  - Repositories handle database persistence only.
- [ ] **No Circular or Forbidden Dependencies:**
  - `enrollnow-common` does not import domain modules (`identity`, `study`, `dashboard`, etc.).
- [ ] **No Code Duplication:**
  - Token generation and SHA-256 hashing use static `SecurityTokenHelper.generateSecureToken()` and `SecurityTokenHelper.hashToken(...)`.
  - Error responses use `ApiResponse.error(...)`.
  - Existing shared services (`SiteAuthorizationService`, `PasswordPolicyValidator`) are reused.

---

## 2. API Contracts & Error Handling [MANUAL REVIEW]

- [ ] **Response Envelope & Frontend Compatibility:**
  - New Sprint 2+ endpoints return `ResponseEntity<ApiResponse<T>>`.
  - Existing Sprint 1 endpoints that return direct DTOs/lists (`AuthController`, `UserController`, `RoleController`, `GeneralSettingsController`, `SecuritySettingsController`, `MyStudiesController`, `UserManagementQueryController`) are not changed in a breaking way without updating the corresponding `frontend/shared` API client.
  - No endpoints return raw JPA entities.
- [ ] **Standard Error Responses:**
  - Custom exceptions are caught and mapped in `@RestControllerAdvice` returning `ResponseEntity<ApiResponse<Void>>`.
  - Error responses include both root-level fields (`success: false`, `status`, `code`, `message`) and nested `error: { code, message, details }`, plus `correlationId` and `timestamp`.
  - Stack traces or internal implementation details are never exposed to clients.
- [ ] **Appropriate HTTP Status Codes:**
  - `200` for successful reads/updates, `201` for creations, `204` for deletions.
  - `400` for bad input / validation errors, `401` for unauthenticated / revoked sessions, `403` for unauthorized permissions / cross-tenant violations, `404` for non-existent resources, `409` for conflicts, `429` for rate-limited requests.

---

## 3. Security & Multi-Tenancy [MANUAL REVIEW]

- [ ] **Multi-Tenant Isolation:**
  - Tenant path variables are verified against JWT claims via `siteAuthorizationService.requireTenantMatch(tenantId)`.
  - All database queries explicitly filter by `tenantId` (never fall back to un-scoped `findById(id)` when `tenantId` is present).
- [ ] **Authentication & Session State:**
  - Endpoints participate in the Spring Security OAuth2 Resource Server filter chain (`SecurityConfig` + `SessionValidationFilter`).
  - Deprecated legacy classes (`CommonJwtAuthenticationFilter`, `JwtTokenProvider`, `JwtVerifier`, `UserPrincipal`) are never used or registered as beans.
- [ ] **Cryptographic Protection:**
  - Passwords hashed using `Argon2PasswordEncoder`.
  - Action/session tokens generated and hashed using `SecurityTokenHelper`.
  - No secret keys, plain-text tokens, or passwords logged or hardcoded.

---

## 4. Persistence & Performance [MANUAL REVIEW]

- [ ] **No N+1 Database Queries:**
  - Aggregations and list views do not execute repository queries inside loops.
  - Batch queries (e.g., `findByTenantId...`, `findAllById`) and in-memory maps used for relational assembly.
- [ ] **Pagination Considered:**
  - New list/search endpoints support `Pageable` / bounded result sets where appropriate.
- [ ] **Database Migrations:**
  - Any schema change is tracked in a new sequential Flyway migration script (`V21__...sql` onward) in `backend/enrollnow-app/src/main/resources/db/migration/`.
  - Existing migrations (`V1`–`V20`) are unmodified.

---

## 5. Input Validation & Data Integrity [MANUAL REVIEW]

- [ ] **Jakarta Bean Validation & Strongly-Typed DTOs:**
  - Controllers use strongly-typed request DTOs with `@Valid` (zero untyped `Map<String, Object>` endpoints).
  - Validation annotations (`@NotBlank`, `@NotNull`, `@Size`, `@Email`) reject invalid payloads with HTTP 400 rather than substituting silent defaults.
- [ ] **Granular Authorization & Truthful Metrics:**
  - Creation vs mutation permissions are distinguished (`requireStudyCreateAccess` vs `requireStudyManageAccess`).
  - Caller identity resolution fails closed when authentication context is missing.
  - Zero synthetic metrics fabricated (e.g. no placeholder enrollment percentages).
- [ ] **Data Sanitization & Injection Prevention:**
  - All queries use parameterized JPQL or Spring Data method names (no concatenated SQL).

---

## 6. Testing & Quality Verification [AUTOMATED + MANUAL REVIEW]

- [ ] **[AUTOMATED] Full Reactor Build & Unit Tests Pass:**
  - `mvn test -f backend/pom.xml` completes with `BUILD SUCCESS`, 0 failures, and 0 errors.
- [ ] **[MANUAL REVIEW] Meaningful Test Coverage Added:**
  - Service logic covered by JUnit 5 and Mockito tests (both positive and negative/isolation cases).
  - Controller endpoints and exception mappings verified.
  - Database queries or Flyway changes verified against PostgreSQL where applicable.

---

## 7. Sign-Off & Approvals

| Role | Name | Signature / Status | Date |
| :--- | :--- | :--- | :--- |
| **Developer** | | [ ] Completed Self-Review | |
| **Peer Reviewer** | | [ ] Approved | |
| **Tech Lead** | | [ ] Approved for Merge | |
