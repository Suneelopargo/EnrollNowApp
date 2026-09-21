package com.enrollnow.bootstrap;

import com.enrollnow.audit.AuditService;
import com.enrollnow.models.*;
import com.enrollnow.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Component
public class AdminBootstrapRunner implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(AdminBootstrapRunner.class);

    @Value("${app.bootstrap.admin.enabled:true}")
    private boolean bootstrapEnabled;

    @Value("${app.bootstrap.admin.email:admin@enrollnow.local}")
    private String adminEmail;

    @Value("${app.bootstrap.admin.username:admin}")
    private String adminUsername;

    @Value("${app.bootstrap.admin.password:EnrollNowAdmin2026!}")
    private String adminPassword;

    @Value("${app.bootstrap.admin.first-name:System}")
    private String firstName;

    @Value("${app.bootstrap.admin.last-name:Administrator}")
    private String lastName;

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final SiteRepository siteRepository;
    private final UserSiteAssignmentRepository userSiteAssignmentRepository;
    private final OrganizationRepository organizationRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public AdminBootstrapRunner(
            UserRepository userRepository,
            RoleRepository roleRepository,
            UserRoleRepository userRoleRepository,
            SiteRepository siteRepository,
            UserSiteAssignmentRepository userSiteAssignmentRepository,
            OrganizationRepository organizationRepository,
            PasswordEncoder passwordEncoder,
            AuditService auditService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.userRoleRepository = userRoleRepository;
        this.siteRepository = siteRepository;
        this.userSiteAssignmentRepository = userSiteAssignmentRepository;
        this.organizationRepository = organizationRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!bootstrapEnabled) {
            logger.info("Admin bootstrap is disabled via configuration.");
            return;
        }

        if (userRepository.existsByUsername(adminUsername) || userRepository.existsByEmail(adminEmail)) {
            logger.info("Bootstrap admin account already exists. Skipping initialization.");
            return;
        }

        logger.info("Initializing controlled bootstrap administrator: username=[{}] email=[{}]", adminUsername, adminEmail);

        // Fetch Default Organization
        Organization defaultOrg = organizationRepository.findByOrgCode("EN-RESEARCH").orElse(null);

        // Create User with Argon2 Hashed Password
        User adminUser = new User();
        adminUser.setUsername(adminUsername);
        adminUser.setEmail(adminEmail);
        adminUser.setPasswordHash(passwordEncoder.encode(adminPassword));
        adminUser.setFirstName(firstName);
        adminUser.setLastName(lastName);
        adminUser.setActive(true);
        adminUser.setOrganization(defaultOrg);

        User savedAdmin = userRepository.save(adminUser);

        // Assign ROLE_SUPER_ADMIN
        Optional<Role> superAdminRoleOpt = roleRepository.findByRoleCode("ROLE_SUPER_ADMIN");
        if (superAdminRoleOpt.isPresent()) {
            UserRole userRole = new UserRole(savedAdmin, superAdminRoleOpt.get());
            userRoleRepository.save(userRole);
        } else {
            logger.warn("ROLE_SUPER_ADMIN not found during admin bootstrap.");
        }

        // Assign default site
        siteRepository.findBySiteCode("SITE-001").ifPresent(site -> {
            UserSiteAssignment usa = new UserSiteAssignment(savedAdmin, site);
            userSiteAssignmentRepository.save(usa);
        });

        // Record Audit Event
        auditService.logEvent(
                "SYSTEM_BOOTSTRAP_ADMIN",
                savedAdmin.getId(),
                savedAdmin.getUsername(),
                savedAdmin.getId(),
                savedAdmin.getUsername(),
                "Initial controlled administrator account bootstrap executed successfully",
                "127.0.0.1",
                null
        );

        logger.info("Controlled bootstrap administrator successfully established: ID=[{}]", savedAdmin.getId());
    }
}
