package com.enrollnow.organization.controllers;

import com.enrollnow.common.core.ApiResponse;
import com.enrollnow.organization.models.Organization;
import com.enrollnow.organization.models.Site;
import com.enrollnow.organization.repositories.OrganizationRepository;
import com.enrollnow.organization.repositories.SiteRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/organizations")
@Tag(name = "Organizations & Sites", description = "Endpoints for multi-tenant organizations and clinical trial sites")
@SecurityRequirement(name = "BearerAuth")
public class OrganizationController {

    private final OrganizationRepository organizationRepository;
    private final SiteRepository siteRepository;

    public OrganizationController(OrganizationRepository organizationRepository, SiteRepository siteRepository) {
        this.organizationRepository = organizationRepository;
        this.siteRepository = siteRepository;
    }

    @GetMapping
    @Operation(summary = "List Organizations", description = "Retrieves all registered clinical research network organizations.")
    public ResponseEntity<ApiResponse<List<Organization>>> getOrganizations() {
        List<Organization> orgs = organizationRepository.findAll();
        return ResponseEntity.ok(ApiResponse.success(orgs));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Organization Details")
    public ResponseEntity<ApiResponse<Organization>> getOrganization(@PathVariable Long id) {
        Organization org = organizationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Organization not found with id: " + id));
        return ResponseEntity.ok(ApiResponse.success(org));
    }

    @GetMapping("/{id}/sites")
    @Operation(summary = "Get Sites for Organization")
    public ResponseEntity<ApiResponse<List<Site>>> getSitesForOrganization(@PathVariable Long id) {
        List<Site> sites = siteRepository.findByOrganizationId(id);
        return ResponseEntity.ok(ApiResponse.success(sites));
    }
}
