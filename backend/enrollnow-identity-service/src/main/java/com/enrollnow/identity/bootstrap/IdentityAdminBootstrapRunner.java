package com.enrollnow.identity.bootstrap;

import com.enrollnow.identity.models.User;
import com.enrollnow.identity.repositories.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class IdentityAdminBootstrapRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(IdentityAdminBootstrapRunner.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.bootstrap.admin.enabled:false}")
    private boolean enabled;

    @Value("${app.bootstrap.admin.username:admin}")
    private String adminUsername;

    @Value("${app.bootstrap.admin.email:admin@enrollnow.local}")
    private String adminEmail;

    @Value("${app.bootstrap.admin.password:}")
    private String adminPassword;

    @Value("${app.bootstrap.admin.first-name:System}")
    private String firstName;

    @Value("${app.bootstrap.admin.last-name:Administrator}")
    private String lastName;

    public IdentityAdminBootstrapRunner(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!enabled) {
            log.info("Bootstrap admin initialization is disabled in current profile/environment.");
            return;
        }

        if (adminPassword == null || adminPassword.trim().isEmpty()) {
            log.warn("Bootstrap admin password is not provided. Skipping bootstrap initialization.");
            return;
        }

        if (userRepository.existsByUsername(adminUsername) || userRepository.existsByEmail(adminEmail)) {
            log.info("Bootstrap admin account ({}) already exists. Skipping initialization.", adminUsername);
            return;
        }

        User adminUser = new User(
                adminUsername,
                adminEmail,
                passwordEncoder.encode(adminPassword),
                firstName,
                lastName
        );
        adminUser.setActive(true);
        userRepository.save(adminUser);

        log.info("Successfully seeded bootstrap administrator account: {}", adminUsername);
    }
}
