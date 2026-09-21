package com.enrollnow.auth;

import com.enrollnow.auth.dto.AuthUserResponse;
import com.enrollnow.auth.dto.LoginRequest;
import com.enrollnow.auth.dto.LoginResponse;
import com.enrollnow.common.ApiResponse;
import com.enrollnow.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {

        String ipAddress = getClientIp(httpRequest);
        LoginResponse response = authService.login(request, ipAddress);
        return ResponseEntity.ok(ApiResponse.success("Authentication successful", response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthUserResponse>> getCurrentUser(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        AuthUserResponse response = authService.getCurrentUser(userPrincipal);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            HttpServletRequest httpRequest) {

        String ipAddress = getClientIp(httpRequest);
        authService.logout(userPrincipal, ipAddress);
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
