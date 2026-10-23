package com.enrollnow.study.controllers;

import com.enrollnow.common.core.ApiResponse;
import com.enrollnow.identity.services.SiteAuthorizationService;
import com.enrollnow.study.dtos.CopyStudyRequest;
import com.enrollnow.study.dtos.CreateStudyRequest;
import com.enrollnow.study.dtos.ImportStudyResponse;
import com.enrollnow.study.dtos.StudySummaryResponse;
import com.enrollnow.study.exceptions.DuplicateStudyNameException;
import com.enrollnow.study.exceptions.InvalidStudyException;
import com.enrollnow.study.exceptions.StudyNotFoundException;
import com.enrollnow.study.services.StudyService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;

import java.nio.charset.StandardCharsets;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudyCopyAndImportControllerTest {

    @Mock
    private StudyService studyService;

    @Mock
    private SiteAuthorizationService siteAuthorizationService;

    private StudyController studyController;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final UUID tenantId = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private final UUID userId = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private final UUID studyId = UUID.fromString("44444444-4444-4444-4444-444444444444");

    @BeforeEach
    void setUp() {
        studyController = new StudyController(studyService, siteAuthorizationService, objectMapper);
    }

    @Test
    @DisplayName("POST /studies/copy succeeds and returns 201 Created")
    void copyStudy_endpoint_succeeds() {
        SiteAuthorizationService.CallerIdentity caller = new SiteAuthorizationService.CallerIdentity(userId, tenantId);
        when(siteAuthorizationService.getAuthenticatedCaller()).thenReturn(Optional.of(caller));

        StudySummaryResponse expected = new StudySummaryResponse(studyId, "CLONE_01", "ClonedStudy", "", false);
        when(studyService.copyStudy(eq(tenantId), any(CopyStudyRequest.class), eq(userId))).thenReturn(expected);

        Map<String, Object> body = Map.of("shortName", "ClonedStudy", "templateId", "source-study-id");

        ResponseEntity<ApiResponse<StudySummaryResponse>> response =
                studyController.copyStudy(tenantId, body);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals("ClonedStudy", response.getBody().getData().getName());
        verify(siteAuthorizationService).requireStudyCreateAccess(tenantId);
    }

    @Test
    @DisplayName("POST /studies/copy checks caller study create permission and fails if unauthorized")
    void copyStudy_unauthorized_throwsAccessDeniedException() {
        doThrow(new AccessDeniedException("Access denied: creating or copying a study requires SITE_STUDIES_CREATE permission"))
                .when(siteAuthorizationService).requireStudyCreateAccess(tenantId);

        Map<String, Object> body = Map.of("shortName", "ClonedStudy", "templateId", "source-study-id");

        assertThrows(AccessDeniedException.class, () ->
                studyController.copyStudy(tenantId, body));

        verify(studyService, never()).copyStudy(any(), any(), any());
    }

    @Test
    @DisplayName("POST /studies/import with JSON payload succeeds and returns 201 Created")
    void importStudyJson_endpoint_succeeds() {
        SiteAuthorizationService.CallerIdentity caller = new SiteAuthorizationService.CallerIdentity(userId, tenantId);
        when(siteAuthorizationService.getAuthenticatedCaller()).thenReturn(Optional.of(caller));

        ImportStudyResponse expected = new ImportStudyResponse(
                studyId, "IMP_01", "ImportedStudy", "Success",
                Map.of("statuses", 2), List.of()
        );

        when(studyService.importStudy(eq(tenantId), eq("ImportedStudy"), any(), eq(userId))).thenReturn(expected);

        Map<String, Object> body = Map.of(
                "studyName", "ImportedStudy",
                "studyData", Map.of("statuses", List.of(Map.of("name", "Enrolled")))
        );

        ResponseEntity<ApiResponse<ImportStudyResponse>> response =
                studyController.importStudyJson(tenantId, body);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals("ImportedStudy", response.getBody().getData().getName());
        verify(siteAuthorizationService).requireStudyCreateAccess(tenantId);
    }

    @Test
    @DisplayName("POST /studies/import with multipart file upload succeeds and parses JSON")
    void importStudyMultipart_endpoint_succeeds() {
        SiteAuthorizationService.CallerIdentity caller = new SiteAuthorizationService.CallerIdentity(userId, tenantId);
        when(siteAuthorizationService.getAuthenticatedCaller()).thenReturn(Optional.of(caller));

        ImportStudyResponse expected = new ImportStudyResponse(
                studyId, "FILE_01", "UploadedStudy", "Success",
                Map.of("statuses", 2), List.of()
        );

        when(studyService.importStudy(eq(tenantId), eq("UploadedStudy"), any(), eq(userId))).thenReturn(expected);

        String jsonContent = "{\"studyName\":\"UploadedStudy\",\"statuses\":[{\"name\":\"Enrolled\"}]}";
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "export.json",
                "application/json",
                jsonContent.getBytes(StandardCharsets.UTF_8)
        );

        ResponseEntity<ApiResponse<ImportStudyResponse>> response =
                studyController.importStudyMultipart(tenantId, file, "UploadedStudy", null);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("UploadedStudy", response.getBody().getData().getName());
    }

    @Test
    @DisplayName("POST /studies/import rejects non-JSON file upload")
    void importStudyMultipart_nonJsonFile_throwsInvalidStudyException() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "export.csv",
                "text/csv",
                "id,name\n1,test".getBytes(StandardCharsets.UTF_8)
        );

        InvalidStudyException ex = assertThrows(InvalidStudyException.class, () ->
                studyController.importStudyMultipart(tenantId, file, "UploadedStudy", null));

        assertTrue(ex.getMessage().contains("Must select a .json file"));
        verify(studyService, never()).importStudy(any(), any(), any(), any());
    }

    @Test
    @DisplayName("POST /studies/import rejects malformed JSON")
    void importStudyMultipart_malformedJson_throwsInvalidStudyException() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "export.json",
                "application/json",
                "{malformed json content: not valid}".getBytes(StandardCharsets.UTF_8)
        );

        InvalidStudyException ex = assertThrows(InvalidStudyException.class, () ->
                studyController.importStudyMultipart(tenantId, file, "UploadedStudy", null));

        assertTrue(ex.getMessage().contains("File contents lack the proper JSON format"));
        verify(studyService, never()).importStudy(any(), any(), any(), any());
    }

    @Test
    @DisplayName("StudyExceptionHandler properly formats and serializes domain exceptions")
    void exceptionHandler_handlesDomainExceptions() {
        StudyExceptionHandler handler = new StudyExceptionHandler();

        ResponseEntity<ApiResponse<Void>> notFound = handler.handleStudyNotFound(new StudyNotFoundException("Not found"));
        assertEquals(HttpStatus.NOT_FOUND, notFound.getStatusCode());
        assertEquals("STUDY_NOT_FOUND", notFound.getBody().getError().getCode());

        ResponseEntity<ApiResponse<Void>> duplicate = handler.handleDuplicateStudyName(new DuplicateStudyNameException("Study name already exists. Please choose another"));
        assertEquals(HttpStatus.BAD_REQUEST, duplicate.getStatusCode());
        assertEquals("DUPLICATE_STUDY_NAME", duplicate.getBody().getError().getCode());

        ResponseEntity<ApiResponse<Void>> invalid = handler.handleInvalidStudy(new InvalidStudyException("Short study name is required"));
        assertEquals(HttpStatus.BAD_REQUEST, invalid.getStatusCode());
        assertEquals("INVALID_STUDY", invalid.getBody().getError().getCode());

        ResponseEntity<ApiResponse<Void>> forbidden = handler.handleAccessDenied(new AccessDeniedException("Access denied"));
        assertEquals(HttpStatus.FORBIDDEN, forbidden.getStatusCode());
        assertEquals("FORBIDDEN", forbidden.getBody().getError().getCode());
    }
}
