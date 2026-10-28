# EnrollNow — Backend Code Review Checklist

Use this checklist to verify every backend pull request before approval.

## 1. Authentication, Authorization & Tenant Isolation
- [ ] **Fail-Closed Caller Resolution:** Controllers and services resolve the caller via `siteAuthorizationService.requireCaller()` or `resolveTenantId(pathTenantId)` and throw `InsufficientAuthenticationException` (`401`) when unauthenticated or when `caller.tenantId()` is missing.
- [ ] **No Request-Tenant Fallback:** `requireTenantMatch(targetTenantId)` and controller `resolveTenantId(...)` never accept a path/query/body `tenantId` when the authenticated caller lacks a tenant claim.
- [ ] **Study Access Service Enforcement:** `StudyAccessService` requires non-null `SiteAuthorizationService` and `SitePermissionService` dependencies and enforces `requireStudyManageAccess(tenantId, studyId)` before granting or revoking study memberships, preventing self-escalation and cross-tenant mutations.
- [ ] **Tenant-Scoped Repository Queries:** Every single-entity and batch lookup (`findByTenantIdAndId`, `findByTenantIdAndIdStudyIdIn`, `findByTenantIdAndIdIn`, `findByTenantIdAndUserIdInAndPrimaryEmailTrue`) filters by `tenantId`. Unscoped `findById` or `findAllById` is never used on multi-tenant tables.

## 2. Data Integrity, DTOs & Validation
- [ ] **Zero Synthetic Data:** Services never fabricate user emails (`@enrollnow.local`), display names, roles, enrollment counts, or default `sampleSize` values (`100`). Missing optional values remain `null`.
- [ ] **Strongly-Typed `@Valid` DTOs:** Controllers accept typed DTOs with Jakarta Bean Validation (`@NotBlank`, `@Size`, `@Pattern`) rather than `Map<String, Object>`.
- [ ] **Aligned Study Short-Name Validation:** `CreateStudyRequest`, `UpdateStudyRequest`, `UpdateStudyDetailsRequest`, `CopyStudyRequest`, and `ImportStudyRequest` enforce trimmed nonblank short names, maximum 15 characters, pattern `^[a-zA-Z0-9 _-]+$`, and case-insensitive uniqueness within the tenant.
- [ ] **Import Payload Alias Compatibility:** `ImportStudyRequest` supports `@JsonAlias({"studyData", "data", "payload", "configuration", "study"})`.

## 3. Automated Testing
- [ ] `mvn test -f backend/pom.xml` passes across all modules with 0 failures and 0 errors.
- [ ] Security regression tests verify unauthenticated (`401`), missing-tenant (`401`), cross-tenant (`403`), unauthorized role (`403`), and authorized (`2xx`) paths.
