# EnrollNow — API & DTO Standards

## 1. Response & Error Envelopes
1. **Standard Envelope (`ApiResponse<T>`):**
   - Domain controllers (`StudyController`, `DashboardController`, etc.) return `ApiResponse<T>` containing `success`, `message`, `data`, `correlationId`, and `timestamp`.
   - Error responses populate both root-level fields (`status`, `code`, `message`, `reason`) and nested `error` (`code`, `message`, `details`).
2. **Frontend Unwrapping (`studyApi.ts`, `api-client`):**
   - Frontend clients type responses with `ApiResponseEnvelope<T>` and unwrap via `unwrapResponse<T>` / `unwrapArrayResponse<T>` without `any` casts.

## 2. Nullable Business Metrics & Optional Fields
1. **Nullable Enrollment & Sample Size:**
   - `StudySummaryResponse` exposes nullable `Integer sampleSize`, `Integer targetEnrollment`, and `Integer enrolled`.
   - Neither backend services nor frontend adapters may coerce `null` sample sizes to `100` or `null` enrollment counts to synthetic percentages.
2. **Truthful User Attribution:**
   - `StudyMemberInput` in `StudySummaryResponse` populates `name`, `email`, and `role` strictly from tenant-scoped `User`, `UserEmail`, and `StudyMember` records, leaving missing fields `null`.

## 3. Request DTO Validation & Alias Compatibility
1. **Study Short-Name Rules:**
   - `@NotBlank`, `@Size(max = 15)`, and `@Pattern(regexp = "^[a-zA-Z0-9 _-]+$")` are enforced consistently across `CreateStudyRequest`, `UpdateStudyRequest`, `UpdateStudyDetailsRequest`, `CopyStudyRequest`, and `ImportStudyRequest`.
2. **Study Import Alias Support:**
   - `ImportStudyRequest.studyData` is annotated with `@JsonAlias({"studyData", "data", "payload", "configuration", "study"})` so JSON import requests using any of those keys deserialize into `studyData`.
