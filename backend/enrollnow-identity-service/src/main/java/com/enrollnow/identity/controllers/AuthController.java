package com.enrollnow.identity.controllers;

import com.enrollnow.identity.dtos.ForgotPasswordRequest;
import com.enrollnow.identity.dtos.ActivateAccountRequest;
import com.enrollnow.identity.dtos.LoginRequest;
import com.enrollnow.identity.dtos.LoginResponse;
import com.enrollnow.identity.services.LoginService;
import com.enrollnow.identity.services.PasswordRecoveryService;
import com.enrollnow.identity.services.UserInvitationService;
import com.enrollnow.identity.dtos.ResetPasswordRequest;
import com.enrollnow.identity.exceptions.AlreadyEnrolledException;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tenants/{tenantId}/auth")
public class AuthController {

    private final LoginService loginService;
    private final PasswordRecoveryService passwordRecoveryService;
    private final UserInvitationService userInvitationService;

    public AuthController(
            LoginService loginService,
            PasswordRecoveryService passwordRecoveryService,
            UserInvitationService userInvitationService) {

        this.loginService = loginService;
        this.passwordRecoveryService = passwordRecoveryService;
        this.userInvitationService = userInvitationService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @PathVariable UUID tenantId,
            @Valid @RequestBody LoginRequest request) {

        return ResponseEntity.ok(
                loginService.authenticate(tenantId, request)
        );
    }

    @GetMapping("/session-status")
    public ResponseEntity<?> getSessionStatus(@PathVariable UUID tenantId) {
        return ResponseEntity.ok(
                java.util.Map.of(
                        "active", true,
                        "tenantId", tenantId
                )
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
                            "If the e-mail you provided is in our system, you will receive a reset link shortly"
                    )
            );
        }

        return ResponseEntity.ok(
                java.util.Map.of(
                        "message",
                        "If the e-mail you provided is in our system, you will receive a reset link shortly",
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

        } catch (AlreadyEnrolledException ex) {

            return ResponseEntity.status(org.springframework.http.HttpStatus.CONFLICT).body(
                    java.util.Map.of(
                            "error",
                            ex.getErrorCode(),
                            "message",
                            ex.getMessage()
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

    @PostMapping("/activate")
    public ResponseEntity<?> activateAccount(
            @PathVariable UUID tenantId,
            @Valid @RequestBody ActivateAccountRequest request) {

        try {

            userInvitationService.activateAccount(
                    tenantId,
                    request
            );

            return ResponseEntity.ok(
                    java.util.Map.of(
                            "message",
                            "Account activated successfully."
                    )
            );

        } catch (AlreadyEnrolledException ex) {

            return ResponseEntity.status(org.springframework.http.HttpStatus.CONFLICT).body(
                    java.util.Map.of(
                            "error",
                            ex.getErrorCode(),
                            "message",
                            ex.getMessage()
                    )
            );

        } catch (IllegalArgumentException ex) {

            return ResponseEntity.badRequest().body(
                    java.util.Map.of(
                            "error",
                            "Invalid Account Activation",
                            "message",
                            ex.getMessage()
                    )
            );
        }
    }

    @GetMapping("/activate/validate")
    public ResponseEntity<?> validateActivationToken(
            @PathVariable UUID tenantId,
            @RequestParam String token) {

        try {

            userInvitationService.validateActivationToken(
                    tenantId,
                    token
            );

            return ResponseEntity.ok(
                    java.util.Map.of(
                            "valid",
                            true
                    )
            );

        } catch (AlreadyEnrolledException ex) {

            return ResponseEntity.status(org.springframework.http.HttpStatus.CONFLICT).body(
                    java.util.Map.of(
                            "error",
                            ex.getErrorCode(),
                            "message",
                            ex.getMessage()
                    )
            );

        } catch (IllegalArgumentException ex) {

            return ResponseEntity.badRequest().body(
                    java.util.Map.of(
                            "error",
                            "INVALID_TOKEN",
                            "message",
                            ex.getMessage()
                    )
            );
        }
    }
}
