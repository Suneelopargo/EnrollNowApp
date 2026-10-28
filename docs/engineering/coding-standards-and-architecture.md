# EnrollNow — Coding Standards & Architecture Guide

## 1. Architectural Principles

1. **Fail-Closed Security & Authorization:**
   - Every backend endpoint must require an authenticated caller and fail closed (`401 Unauthorized` via `InsufficientAuthenticationException` or `403 Forbidden` via `AccessDeniedException`) when authentication, caller identity, tenant context, or required permissions are missing.
   - `SiteAuthorizationService.requireTenantMatch(UUID targetTenantId)` rejects null target tenants, missing caller tenants (`caller.tenantId() == null`), and cross-tenant requests unless the caller holds explicit platform-level cross-tenant administrative authority.
   - Request-supplied `tenantId` parameters or body fields must never be used as a fallback when the authenticated caller lacks a tenant claim.
2. **Strict Multi-Tenant Isolation:**
   - All repository queries for tenant-owned entities (`Study`, `StudyMember`, `TeamStudy`, `User`, `UserEmail`, `Participant`, `Site`, etc.) must include `tenantId` in the query predicate (`findByTenantIdAnd...`).
   - Batch repository lookups (`findByTenantIdAndIdStudyIdIn`, `findByTenantIdAndIdIn`, `findByTenantIdAndUserIdInAndPrimaryEmailTrue`) must always scope by `tenantId` rather than using unscoped `findAllById`.
3. **Authoritative Backend Business Data (Zero Fabrication Policy):**
   - Production frontend and backend flows must never fabricate, invent, or substitute fake business data when API responses or optional fields are empty, null, or unavailable.
   - Prohibited patterns include:
     - Synthetic user emails (`uid + "@enrollnow.local"`), names (`"User " + uid.substring(0, 4)`), or roles (`"Admin"`).
     - Default target sample sizes (`sampleSize: 100` or `targetEnrollment ?? 100`) when a study has not configured a sample size.
     - Fallback to dashboard overview studies when `/api/v1/studies` returns an empty list (`[]`).
     - Fallback to demo/mock datasets in production when an API call fails or returns empty data.
4. **Centralized API Integration:**
   - All frontend HTTP calls must use the centralized Axios client (`frontend/shared/api-client`) and domain API modules under `frontend/shared/api/`.
   - Never instantiate standalone Axios clients or hardcode backend hosts (`http://localhost:8080`) in microfrontends.
5. **Strict TypeScript & SCSS-Only Styling:**
   - Production TypeScript code must pass `npm --prefix frontend run typecheck` with zero `any`, `as any`, or `@ts-ignore` suppressions.
   - Component styling must use SCSS classes (`frontend/shared/design-system/styles/`); inline styles (`style={{ ... }}`) and native browser dialogs (`window.confirm`, `window.alert`) are prohibited in production components.
