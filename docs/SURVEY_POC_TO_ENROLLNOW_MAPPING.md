# Survey POC to EnrollNow Feature Mapping

This document provides the authoritative feature-by-feature mapping between the **Survey POC** (`D:\ProjectsWorkSpace\POCSCode\ai-survey-builder`) and the target **EnrollNow Enterprise Application** (`D:\ProjectsWorkSpace\EnrollNowProject\WorkSpace\EnrollNowApp`).

## Summary Table

| Survey POC Feature | POC Location | Existing EnrollNow Support | Target Location | Action |
|---|---|---|---|:---:|
| **Survey Studio (Multi-Step Builder)** | `frontend/src/features/builder/` | Initial placeholder MFE in `microfrontends/survey` | `frontend/microfrontends/survey/src/builder/` | **MIGRATE** |
| **Question Type Library (16 Types)** | `frontend/src/constants/questionTypes.js` | None | `frontend/microfrontends/survey/src/constants/questionTypes.ts` | **MIGRATE** |
| **Survey Section / Multi-Page Management** | `backend/app/models/survey.py` (`SurveySection`) | None | `backend/enrollnow-survey-service/src/main/java/com/enrollnow/survey/models/SurveySection.java` | **MIGRATE** |
| **Visual Conditional Logic & Branching** | `frontend/src/features/builder/Step4Logic.jsx` | None | `frontend/microfrontends/survey/src/builder/LogicRulesEditor.tsx` | **MIGRATE** |
| **Survey Versioning & Lifecycle Governance** | `backend/app/models/survey.py` (`SurveyVersion`) | None | `backend/enrollnow-survey-service/src/main/java/com/enrollnow/survey/models/SurveyVersion.java` | **MIGRATE** |
| **Survey Publishing & Unpublishing** | `backend/app/modules/surveys/service.py` | None | `backend/enrollnow-survey-service/src/main/java/com/enrollnow/survey/services/SurveyService.java` | **MIGRATE** |
| **Interactive Live Preview** | `frontend/src/features/builder/SurveyPreview.jsx` | None | `frontend/microfrontends/survey/src/builder/SurveyPreviewModal.tsx` | **MIGRATE** |
| **Survey Assignments Engine** | `backend/app/modules/assignments/` | None | `backend/enrollnow-survey-service/src/main/java/com/enrollnow/survey/services/SurveyAssignmentService.java` | **MIGRATE** |
| **Assigned Surveys Queue** | `frontend/src/features/respondent/UserHome.jsx` | None | `frontend/microfrontends/survey/src/views/MySurveysView.tsx` | **MIGRATE** |
| **Public & Authenticated Survey Runner** | `frontend/src/features/public/PublicSurvey.jsx` | None | `frontend/microfrontends/survey/src/runner/SurveyRunner.tsx` | **MIGRATE** |
| **Question Rendering Engine** | `frontend/src/features/public/PublicQuestionControl.jsx` | None | `frontend/microfrontends/survey/src/runner/QuestionRenderer.tsx` | **MIGRATE** |
| **Response Validation & Skip Logic Engine** | `backend/app/modules/responses/service.py` | None | `backend/enrollnow-survey-service/src/main/java/com/enrollnow/survey/services/SurveyResponseService.java` | **MIGRATE** |
| **Response Answer Storage (JSON & Typed)** | `backend/app/models/response.py` | None | `backend/enrollnow-survey-service/src/main/java/com/enrollnow/survey/models/SurveyResponse.java` | **MIGRATE** |
| **Executive Survey Dashboard KPIs** | `backend/app/modules/analytics/` | Static placeholder in MFE | `backend/enrollnow-survey-service/src/main/java/com/enrollnow/survey/services/SurveyAnalyticsService.java` | **MIGRATE** |
| **Per-Survey Analytics & Metrics** | `frontend/src/features/management/AnalyticsView.jsx` | None | `frontend/microfrontends/survey/src/views/SurveyAnalyticsView.tsx` | **MIGRATE** |
| **Streaming CSV Response Export** | `backend/app/modules/analytics/service.py` | None | `backend/enrollnow-survey-service/src/main/java/com/enrollnow/survey/services/SurveyExportService.java` | **MIGRATE** |
| **AI Prompt-to-Survey Generator** | `backend/app/modules/ai/` | None | `backend/enrollnow-survey-service/src/main/java/com/enrollnow/survey/services/SurveyAiService.java` | **MIGRATE** |
| **AI Logic Rule Suggester** | `backend/app/modules/ai/` | None | `backend/enrollnow-survey-service/src/main/java/com/enrollnow/survey/services/SurveyAiService.java` | **MIGRATE** |
| **AI Response Clinical Assessment** | `backend/app/modules/ai/` | None | `backend/enrollnow-survey-service/src/main/java/com/enrollnow/survey/services/SurveyAiService.java` | **MIGRATE** |
| **Clinical Survey Templates Library** | `frontend/src/constants/templates.js` | None | `frontend/microfrontends/survey/src/constants/templates.ts` | **MIGRATE** |
| **Survey Audit Logging** | `backend/app/models/audit.py` | Core `admin_audit_logs` | `backend/enrollnow-survey-service/src/main/java/com/enrollnow/survey/models/SurveyAuditLog.java` | **MIGRATE** |
| **Authentication & Session Tokens** | `backend/app/core/security.py` | Enterprise JWT Auth (`enrollnow-identity-service`) | `backend/enrollnow-common/src/main/java/com/enrollnow/common/security/` | **REPLACE** |
| **RBAC Route Guards & Entitlements** | `frontend/src/features/auth/` | Dynamic RBAC Matrix (`V3__navigation_access.sql`) | Shell Context + Server-Side `@PreAuthorize` | **REPLACE** |
| **External Non-Survey Tables in POC DB** | `surveydb.sql` (studies, participants, etc.) | Existing microservices (`enrollnow-study-service`, `participant-service`) | External Microservice Boundaries | **NOT REQUIRED** |

---

## Detailed Disposition Rationale

1. **Survey Studio & Question Types (`MIGRATE`)**:
   The full 16 question types, multi-step builder (Start $\rightarrow$ AI/Templates $\rightarrow$ Design $\rightarrow$ Logic $\rightarrow$ Publish), and visual editor are migrated directly into the React/TypeScript microfrontend (`microfrontends/survey`) using EnrollNow design tokens and shared components.

2. **Backend Engine (`MIGRATE`)**:
   All survey lifecycle operations, versioning, conditional skip-logic resolution, assignment verification, response persistence, CSV streaming, and AI co-pilot logic are translated into idiomatic Spring Boot 3.3.4 patterns inside `enrollnow-survey-service`.

3. **Authentication & Authorization (`REPLACE`)**:
   The POC's custom FastAPI JWT login is replaced entirely with EnrollNow's central JWT validation (`CommonJwtAuthenticationFilter`, `UserPrincipal`), `@PreAuthorize("hasAnyRole(...)")`, and RBAC permissions loaded from the identity service.

4. **Multi-Service Isolation (`NOT REQUIRED`)**:
   Studies, Participants, Tasks, and Audit tables present in the POC monolithic dump are NOT duplicated into the Survey service database. Logical identifiers (`study_id`, `user_id`, `participant_id`) are maintained cleanly across bounded contexts.
