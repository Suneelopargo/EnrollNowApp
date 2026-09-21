package com.enrollnow.document.controllers;

import com.enrollnow.common.core.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/documents")
@Tag(name = "Documents & Protocols", description = "Endpoints for trial protocols, participant consent PDFs, and study documentation")
@SecurityRequirement(name = "BearerAuth")
public class DocumentController {

    @GetMapping
    @Operation(summary = "List Trial Documents")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getDocuments() {
        List<Map<String, Object>> docs = List.of(
                Map.of(
                        "id", "DOC-501",
                        "title", "Cardiovascular Phase III Protocol Specification (v3.0)",
                        "studyId", "ST-101",
                        "contentType", "application/pdf",
                        "fileSize", "4.2 MB",
                        "uploadedAt", "2026-09-01T10:00:00Z"
                ),
                Map.of(
                        "id", "DOC-502",
                        "title", "Institutional Review Board (IRB) Approval Letter",
                        "studyId", "ST-101",
                        "contentType", "application/pdf",
                        "fileSize", "1.1 MB",
                        "uploadedAt", "2026-09-05T14:30:00Z"
                )
        );
        return ResponseEntity.ok(ApiResponse.success(docs));
    }

    @GetMapping("/status")
    @Operation(summary = "Get Document Service Status")
    public ResponseEntity<ApiResponse<Map<String, String>>> getStatus() {
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "service", "enrollnow-document-service",
                "status", "OPERATIONAL",
                "capabilities", "Protocols, PDF Consents, Version Control, Secure Storage"
        )));
    }
}
