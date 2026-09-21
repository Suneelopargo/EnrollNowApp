package com.enrollnow.identity.controllers;

import com.enrollnow.common.core.ApiResponse;
import com.enrollnow.common.security.UserPrincipal;
import com.enrollnow.identity.dto.AuthUserResponse;
import com.enrollnow.identity.dto.LoginRequest;
import com.enrollnow.identity.dto.LoginResponse;
import com.enrollnow.identity.services.IdentityAuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/v1/auth", "/api/auth"})
@Tag(name = "Authentication & Identity", description = "Endpoints for user authentication, token issuance, and profile retrieval")
public class AuthController {

    private final IdentityAuthService authService;

    public AuthController(IdentityAuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    @Operation(summary = "User Login", description = "Authenticates user credentials using Argon2id verification and returns a signed HS256 Bearer JWT token.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Authentication successful",
                    content = @Content(schema = @Schema(implementation = LoginResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Invalid credentials"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Account disabled or locked"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "422", description = "Validation error on credentials payload")
    })
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {

        String ipAddress = getClientIp(httpRequest);
        LoginResponse response = authService.login(request, ipAddress);
        return ResponseEntity.ok(ApiResponse.success("Authentication successful", response));
    }

    @GetMapping("/me")
    @Operation(summary = "Get Current User Profile", description = "Retrieves the authenticated user's profile, assigned RBAC roles, and clinical site scopes.",
            security = @SecurityRequirement(name = "BearerAuth"))
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Profile retrieved successfully",
                    content = @Content(schema = @Schema(implementation = AuthUserResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthenticated - Missing or invalid JWT")
    })
    public ResponseEntity<ApiResponse<AuthUserResponse>> getCurrentUser(
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal userPrincipal) {

        AuthUserResponse response = authService.getCurrentUser(userPrincipal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/logout")
    @Operation(summary = "User Logout", description = "Stateless logout; client clears local JWT token.",
            security = @SecurityRequirement(name = "BearerAuth"))
    public ResponseEntity<ApiResponse<Void>> logout(
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal userPrincipal) {

        return ResponseEntity.ok(ApiResponse.success("Logged out successfully", null));
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty() || "unknown".equalsIgnoreCase(xfHeader)) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }
}
