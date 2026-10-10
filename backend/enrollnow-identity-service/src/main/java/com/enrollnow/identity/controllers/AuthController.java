package com.enrollnow.identity.controllers;

import com.enrollnow.identity.dtos.ForgotPasswordRequest;
import com.enrollnow.identity.dtos.LoginRequest;
import com.enrollnow.identity.dtos.LoginResponse;
import com.enrollnow.identity.services.LoginService;
import com.enrollnow.identity.services.PasswordRecoveryService;
import com.enrollnow.identity.dtos.ResetPasswordRequest;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tenants/{tenantId}/auth")
public class AuthController {

    private final LoginService loginService;
    private final PasswordRecoveryService passwordRecoveryService;

    public AuthController(
            LoginService loginService,
            PasswordRecoveryService passwordRecoveryService) {

        this.loginService = loginService;
        this.passwordRecoveryService = passwordRecoveryService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @PathVariable UUID tenantId,
            @Valid @RequestBody LoginRequest request) {

        return ResponseEntity.ok(
                loginService.authenticate(tenantId, request)
        );
    }
    
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(
            @PathVariable UUID tenantId,
            @Valid @RequestBody ForgotPasswordRequest request) {

        String resetToken =
                passwordRecoveryService.requestPasswordReset(
                        tenantId,
                        request
                );

        /*
         * Temporary developer response.
         * Later the token will be emailed and not returned.
         */
        if (resetToken == null) {
            return ResponseEntity.ok(
                    java.util.Map.of(
                            "message",
                            "If the email exists, password reset instructions have been sent."
                    )
            );
        }

        return ResponseEntity.ok(
                java.util.Map.of(
                        "message",
                        "If the email exists, password reset instructions have been sent.",
                        "resetToken",
                        resetToken
                )
        );
    }
    
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(
            @PathVariable UUID tenantId,
            @Valid @RequestBody ResetPasswordRequest request) {

        try {

            passwordRecoveryService.resetPassword(
                    tenantId,
                    request
            );

            return ResponseEntity.ok(
                    java.util.Map.of(
                            "message",
                            "Password reset successfully."
                    )
            );

        } catch (IllegalArgumentException ex) {

            return ResponseEntity.badRequest().body(
                    java.util.Map.of(
                            "error",
                            "Invalid Password Reset",
                            "message",
                            ex.getMessage()
                    )
            );
        }
    }
}