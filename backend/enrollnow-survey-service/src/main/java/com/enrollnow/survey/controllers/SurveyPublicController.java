package com.enrollnow.survey.controllers;

import com.enrollnow.common.core.ApiResponse;
import com.enrollnow.common.security.UserPrincipal;
import com.enrollnow.survey.dto.SurveyDtos.SubmitResponseRequest;
import com.enrollnow.survey.dto.SurveyDtos.SurveyDto;
import com.enrollnow.survey.dto.SurveyDtos.SurveyResponseDto;
import com.enrollnow.survey.services.SurveyResponseService;
import com.enrollnow.survey.services.SurveyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/v1/surveys/public", "/api/public/surveys"})
@Tag(name = "Public Survey Runner", description = "Public endpoints for participants and respondents to retrieve surveys and submit responses")
public class SurveyPublicController {

    private final SurveyService surveyService;
    private final SurveyResponseService responseService;

    public SurveyPublicController(SurveyService surveyService, SurveyResponseService responseService) {
        this.surveyService = surveyService;
        this.responseService = responseService;
    }

    @GetMapping("/{publicToken}")
    @Operation(summary = "Get Published Survey by Public Token", description = "Allows external respondents to fetch active published survey definition")
    public ResponseEntity<ApiResponse<SurveyDto>> getPublicSurvey(@PathVariable String publicToken) {
        SurveyDto dto = surveyService.getSurveyByPublicToken(publicToken);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @PostMapping("/{publicToken}/responses")
    @Operation(summary = "Submit Survey Response", description = "Submits participant answers with validation, conditional skip-logic resolution, and duplicate session prevention")
    public ResponseEntity<ApiResponse<SurveyResponseDto>> submitResponse(
            @PathVariable String publicToken,
            @RequestBody SubmitResponseRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String clientIp = httpRequest.getRemoteAddr();
        String forwarded = httpRequest.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            clientIp = forwarded.split(",")[0].trim();
        }

        SurveyResponseDto response = responseService.submitResponse(publicToken, request, currentUser, clientIp);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
