# Survey API Source-to-Target Mapping

This document provides the authoritative API endpoint mapping between the **FastAPI Survey POC** and the **EnrollNow Spring Boot Enterprise Survey Service** (`enrollnow-survey-service`).

## API Contract Conventions in EnrollNow

1. **Base URL**: `/api/v1/surveys`
2. **Standard Response Structure**: All responses return `ResponseEntity<ApiResponse<T>>`:
   ```json
   {
     "success": true,
     "message": "Operation executed successfully",
     "data": { ... },
     "timestamp": "2026-09-24T12:00:00Z"
   }
   ```
3. **Authentication**: Enterprise JWT verification (`CommonJwtAuthenticationFilter`) setting Spring Security `UserPrincipal`.
4. **Authorization**: Declarative method security (`@PreAuthorize`) enforcing RBAC entitlements.
5. **Documentation**: Full OpenAPI / Swagger 3.0 annotations (`@Operation`, `@Tag`, `@SecurityRequirement`).

---

## Complete API Mapping Table

| POC API Endpoint | Method | EnrollNow API Endpoint | Http Method | Target Security / Authorization | Action | Reason & Strategy |
|---|:---:|---|:---:|---|:---:|---|
| `/api/surveys` | `GET` | `/api/v1/surveys` | `GET` | Authenticated (Admin/Staff) | **MIGRATE** | Paginated list of surveys with search and status filtering. |
| `/api/surveys/{survey_id}` | `GET` | `/api/v1/surveys/{id}` | `GET` | Authenticated (Admin/Staff) | **MIGRATE** | Retrieves detailed survey instrument with questions, sections, and logic rules. |
| `/api/surveys` | `POST` | `/api/v1/surveys` | `POST` | `@PreAuthorize("hasAnyRole('SUPER_ADMIN','SITE_ADMIN','ADMIN','INVESTIGATOR','COORDINATOR')")` | **MIGRATE** | Creates survey draft with nested sections and question definitions. |
| `/api/surveys/{survey_id}` | `PUT` | `/api/v1/surveys/{id}` | `PUT` | `@PreAuthorize("hasAnyRole('SUPER_ADMIN','SITE_ADMIN','ADMIN','INVESTIGATOR','COORDINATOR')")` | **MIGRATE** | Updates survey metadata, replaces/syncs questions, sections, and logic rules transactionally. |
| `/api/surveys/{survey_id}` | `DELETE` | `/api/v1/surveys/{id}` | `DELETE` | `@PreAuthorize("hasAnyRole('SUPER_ADMIN','SITE_ADMIN','ADMIN')")` | **MIGRATE** | Deletes survey and cascades to questions/rules. |
| `/api/surveys/{survey_id}/publish` | `POST` | `/api/v1/surveys/{id}/publish` | `POST` | `@PreAuthorize("hasAnyRole('SUPER_ADMIN','SITE_ADMIN','ADMIN','INVESTIGATOR')")` | **MIGRATE** | Validates minimum questions, updates status to `PUBLISHED`, creates snapshot in `survey_versions`. |
| `/api/surveys/{survey_id}/unpublish` | `POST` | `/api/v1/surveys/{id}/unpublish` | `POST` | `@PreAuthorize("hasAnyRole('SUPER_ADMIN','SITE_ADMIN','ADMIN','INVESTIGATOR')")` | **MIGRATE** | Reverts survey status to `DRAFT`. |
| `/api/surveys/{survey_id}/archive` | `POST` | `/api/v1/surveys/{id}/archive` | `POST` | `@PreAuthorize("hasAnyRole('SUPER_ADMIN','SITE_ADMIN','ADMIN')")` | **MIGRATE** | Archives survey, preventing new submissions while preserving historical data. |
| `/api/public/surveys/{public_token}` | `GET` | `/api/v1/surveys/public/{publicToken}` | `GET` | `permitAll()` (Public) | **MIGRATE** | Anonymous/public respondent view of published survey. |
| `/api/public/surveys/{public_token}/responses` | `POST` | `/api/v1/surveys/public/{publicToken}/responses` | `POST` | `permitAll()` (Public) | **MIGRATE** | Submits respondent answers, verifies required fields & logic skip conditions, prevents duplicate submissions. |
| `/api/surveys/{survey_id}/responses` | `GET` | `/api/v1/surveys/{id}/responses` | `GET` | Authenticated (Admin/Staff) | **MIGRATE** | Lists submitted response rows for a given survey. |
| `/api/me/responses` | `GET` | `/api/v1/surveys/me/responses` | `GET` | Authenticated (Current User) | **MIGRATE** | Retrieves history of surveys submitted by caller. |
| `/api/assignments` | `GET` | `/api/v1/surveys/assignments` | `GET` | Authenticated (Admin/Staff) | **MIGRATE** | Lists all survey participant assignments. |
| `/api/assignments` | `POST` | `/api/v1/surveys/assignments` | `POST` | `@PreAuthorize("hasAnyRole('SUPER_ADMIN','SITE_ADMIN','ADMIN','COORDINATOR')")` | **MIGRATE** | Assigns survey to specified participant or user. |
| `/api/assignments/{assignment_id}` | `DELETE` | `/api/v1/surveys/assignments/{id}` | `DELETE` | `@PreAuthorize("hasAnyRole('SUPER_ADMIN','SITE_ADMIN','ADMIN','COORDINATOR')")` | **MIGRATE** | Revokes an assignment. |
| `/api/me/assigned-surveys` | `GET` | `/api/v1/surveys/me/assigned` | `GET` | Authenticated (Current User) | **MIGRATE** | Lists surveys assigned to caller. |
| `/api/dashboard` | `GET` | `/api/v1/surveys/analytics/dashboard` | `GET` | Authenticated (Admin/Staff) | **MIGRATE** | Computes KPI counts, completion rates, and daily response metrics. |
| `/api/surveys/{survey_id}/analytics` | `GET` | `/api/v1/surveys/{id}/analytics` | `GET` | Authenticated (Admin/Staff) | **MIGRATE** | Computes analytics specific to an individual survey instrument. |
| `/api/surveys/{survey_id}/responses/export` | `GET` | `/api/v1/surveys/{id}/responses/export` | `GET` | Authenticated (Admin/Staff) | **MIGRATE** | Streams CSV file containing all tabular response answers. |
| `/api/ai/generate` | `POST` | `/api/v1/surveys/ai/generate` | `POST` | Authenticated (Admin/Staff) | **MIGRATE** | AI question generator with automatic fallback to deterministic clinical generator. |
| `/api/ai/suggest-logic` | `POST` | `/api/v1/surveys/ai/suggest-logic` | `POST` | Authenticated (Admin/Staff) | **MIGRATE** | AI suggestions for conditional branching rules. |
| `/api/responses/{response_id}/assess` | `POST` | `/api/v1/surveys/responses/{id}/assess` | `POST` | Authenticated (Admin/Staff) | **MIGRATE** | AI assessment summarizing participant responses. |
| `/api/auth/register`, `/api/auth/login` | `POST` | `/api/v1/auth/login` | `POST` | `enrollnow-identity-service` | **REPLACE** | Handled centrally by EnrollNow Identity Microservice. |
| `/api/health` | `GET` | `/actuator/health` | `GET` | `permitAll()` | **REPLACE** | Standard Spring Boot Actuator health endpoint. |
