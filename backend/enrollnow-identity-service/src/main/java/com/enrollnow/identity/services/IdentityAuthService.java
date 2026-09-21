package com.enrollnow.identity.services;

import com.enrollnow.common.security.JwtTokenProvider;
import com.enrollnow.common.security.UserPrincipal;
import com.enrollnow.identity.dto.AuthUserResponse;
import com.enrollnow.identity.dto.LoginRequest;
import com.enrollnow.identity.dto.LoginResponse;
import com.enrollnow.identity.models.User;
import com.enrollnow.identity.repositories.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class IdentityAuthService {

    private static final Logger log = LoggerFactory.getLogger(IdentityAuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final long jwtExpirationMs;

    public IdentityAuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider tokenProvider,
            @Value("${app.jwt.expiration-ms:3600000}") long jwtExpirationMs) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.jwtExpirationMs = jwtExpirationMs;
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request, String ipAddress) {
        String identifier = request.getUsernameOrEmail().trim();

        User user = userRepository.findByUsernameOrEmailIgnoreCase(identifier)
                .orElseThrow(() -> {
                    log.warn("Login attempt for non-existent user identifier: {}", identifier);
                    return new BadCredentialsException("Invalid credentials");
                });

        if (!user.isActive()) {
            log.warn("Login rejected for inactive user: {}", user.getUsername());
            throw new LockedException("User account is locked or inactive");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            log.warn("Password mismatch for user: {}", user.getUsername());
            throw new BadCredentialsException("Invalid credentials");
        }

        List<String> roles = userRepository.findRoleCodesByUserId(user.getId());
        List<String> siteCodes = userRepository.findSiteCodesByUserId(user.getId());
        String orgName = user.getOrganizationId() != null
                ? userRepository.findOrganizationNameById(user.getOrganizationId()).orElse(null)
                : null;

        String token = tokenProvider.generateToken(user.getId(), user.getUsername(), roles, user.getOrganizationId());

        AuthUserResponse authUser = new AuthUserResponse();
        authUser.setId(user.getId());
        authUser.setUsername(user.getUsername());
        authUser.setEmail(user.getEmail());
        authUser.setFirstName(user.getFirstName());
        authUser.setLastName(user.getLastName());
        authUser.setOrganizationId(user.getOrganizationId());
        authUser.setOrganizationName(orgName);
        authUser.setRoles(roles);
        authUser.setSiteCodes(siteCodes);

        log.info("Successful authentication for user: {} from IP: {}", user.getUsername(), ipAddress);
        return new LoginResponse(token, jwtExpirationMs, authUser);
    }

    @Transactional(readOnly = true)
    public AuthUserResponse getCurrentUser(UserPrincipal principal) {
        if (principal == null) {
            throw new BadCredentialsException("Unauthenticated request");
        }

        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new BadCredentialsException("User not found"));

        List<String> roles = userRepository.findRoleCodesByUserId(user.getId());
        List<String> siteCodes = userRepository.findSiteCodesByUserId(user.getId());
        String orgName = user.getOrganizationId() != null
                ? userRepository.findOrganizationNameById(user.getOrganizationId()).orElse(null)
                : null;

        AuthUserResponse authUser = new AuthUserResponse();
        authUser.setId(user.getId());
        authUser.setUsername(user.getUsername());
        authUser.setEmail(user.getEmail());
        authUser.setFirstName(user.getFirstName());
        authUser.setLastName(user.getLastName());
        authUser.setOrganizationId(user.getOrganizationId());
        authUser.setOrganizationName(orgName);
        authUser.setRoles(roles);
        authUser.setSiteCodes(siteCodes);

        return authUser;
    }
}
