# EnrollNow — Study Module Engineering Standards

## 1. Security, Tenant Scope & Authorization
1. **Controller Tenant Resolution (`StudyController`, `MyStudiesController`):**
   - `StudyController.resolveTenantId(UUID pathTenantId)` requires an authenticated caller with a non-null `caller.tenantId()`. If `pathTenantId != null`, it invokes `siteAuthorizationService.requireTenantMatch(pathTenantId)`.
   - Never fall back to a request-supplied `tenantId` or a default UUID when the caller's JWT lacks a tenant claim.
2. **Study Access Management (`StudyAccessService`):**
   - `StudyAccessService` requires non-null `SiteAuthorizationService` and `SitePermissionService` collaborators.
   - `grantStudyAccess` and `removeStudyAccess` validate `requireStudyManageAccess(tenantId, studyId)`, verify target user and study tenant ownership (`findByTenantIdAndId`), and block self-grant / unauthorized cross-tenant membership changes.
3. **Tenant-Scoped Batch Queries (`StudyService`, `MyStudiesService`):**
   - Study member and user email enrichment in `StudyService.toSummaryResponseList` uses tenant-scoped batch methods:
     - `studyMemberRepository.findByTenantIdAndIdStudyIdIn(tenantId, studyIds)`
     - `userRepository.findByTenantIdAndIdIn(tenantId, userIds)`
     - `userEmailRepository.findByTenantIdAndUserIdInAndPrimaryEmailTrue(tenantId, userIds)`
     - `teamStudyRepository.findByTenantIdAndIdStudyIdIn(tenantId, studyIds)`

## 2. Authoritative Data & Zero Fabrication
1. **No Synthetic User Attribution:**
   - `StudyService.toSummaryResponseList` populates `StudyMemberInput` strictly from `User` and `UserEmail` records. It never generates `uid + "@enrollnow.local"`, `"User " + uid.substring(0, 4)`, or `"Admin"` defaults.
2. **No Default `sampleSize: 100` or Overview Study Fallback:**
   - `AddStudyModal` and `StudyService` leave `sampleSize` as `null` when not specified.
   - `StudyModule` (`frontend/microfrontends/study/src/remoteEntry.tsx`) uses `registryStudies` directly from `/api/v1/studies` without falling back to `overviewStudies` when `registryStudies` is empty, and preserves `null` for `targetCount` and `recruitmentProgress` when `targetEnrollment` / `sampleSize` is unset.
   - `StudyDashboardTab` renders `"Target not set"` and `"—"` when `targetCount` is `null`.

## 3. Validation, TypeScript & Styling
1. **Short Study Name Validation:**
   - Both frontend (`STUDY_NAME_RULES`, `StudySettingsDetails.tsx`) and backend (`CreateStudyRequest`, `UpdateStudyRequest`, `UpdateStudyDetailsRequest`, `CopyStudyRequest`, `ImportStudyRequest`, `StudyService.validateAndNormalizeShortStudyName`) enforce trimmed nonblank short names, max 15 chars, `/^[a-zA-Z0-9 _-]+$/` (accepting `GEN-01`), and case-insensitive uniqueness per tenant.
2. **Strict TypeScript & SCSS:**
   - Zero `any` / `as any` and zero inline `style={{ ... }}` in `frontend/microfrontends/study/src/**` and `frontend/shared/api/studyApi.ts`.
   - Destructive confirmations use `requestConfirmation` from `frontend/shared/confirmation`.
