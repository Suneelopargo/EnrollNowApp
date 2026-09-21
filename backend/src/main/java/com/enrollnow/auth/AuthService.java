package com.enrollnow.auth;

import com.enrollnow.audit.AuditService;
import com.enrollnow.auth.dto.AuthUserResponse;
import com.enrollnow.auth.dto.LoginRequest;
import com.enrollnow.auth.dto.LoginResponse;
import com.enrollnow.models.User;
import com.enrollnow.models.UserSiteAssignment;
import com.enrollnow.repository.UserRepository;
import com.enrollnow.security.JwtTokenProvider;
import com.enrollnow.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final long jwtExpirationInMs;

    public AuthService(
            AuthenticationManager authenticationManager,
            JwtTokenProvider tokenProvider,
            UserRepository userRepository,
            AuditService auditService,
            @Value("${app.jwt.expiration-ms:3600000}") long jwtExpirationInMs) {
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.userRepository = userRepository;
        this.auditService = auditService;
        this.jwtExpirationInMs = jwtExpirationInMs;
    }

    @Transactional
    public LoginResponse login(LoginRequest request, String ipAddress) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsernameOrEmail(), request.getPassword())
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

            String token = tokenProvider.generateToken(authentication);

            User user = userRepository.findById(userPrincipal.getId())
                    .orElseThrow(() -> new BadCredentialsException("User not found"));

            if (!user.isActive()) {
                auditService.logAuthFailure(request.getUsernameOrEmail(), "Account disabled", ipAddress);
                throw new DisabledException("User account is disabled");
            }

            auditService.logAuthSuccess(user.getUsername(), user.getId(), ipAddress);

            AuthUserResponse userResponse = buildAuthUserResponse(user);
            return new LoginResponse(token, jwtExpirationInMs / 1000, userResponse);

        } catch (BadCredentialsException ex) {
            auditService.logAuthFailure(request.getUsernameOrEmail(), "Invalid credentials", ipAddress);
            throw ex;
        } catch (DisabledException ex) {
            auditService.logAuthFailure(request.getUsernameOrEmail(), "Account disabled", ipAddress);
            throw ex;
        }
    }

    @Transactional(readOnly = true)
    public AuthUserResponse getCurrentUser(UserPrincipal userPrincipal) {
        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new BadCredentialsException("User not found with id: " + userPrincipal.getId()));

        if (!user.isActive()) {
            throw new DisabledException("User account is disabled");
        }

        return buildAuthUserResponse(user);
    }

    @Transactional
    public void logout(UserPrincipal userPrincipal, String ipAddress) {
        if (userPrincipal != null) {
            auditService.logLogout(userPrincipal.getUsername(), userPrincipal.getId(), ipAddress);
        }
        SecurityContextHolder.clearContext();
    }

    public AuthUserResponse buildAuthUserResponse(User user) {
        List<String> siteCodes = user.getSiteAssignments().stream()
                .filter(sa -> "ACTIVE".equalsIgnoreCase(sa.getStatus()))
                .map(sa -> sa.getSite().getSiteCode())
                .collect(Collectors.toList());

        String orgName = user.getOrganization() != null ? user.getOrganization().getName() : null;

        return new AuthUserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getFullName(),
                user.isActive(),
                user.getActiveRoleCodes(),
                siteCodes,
                orgName
        );
    }
}
