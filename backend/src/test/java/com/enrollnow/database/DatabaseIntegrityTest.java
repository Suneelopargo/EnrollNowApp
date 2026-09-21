package com.enrollnow.database;

import com.enrollnow.models.*;
import com.enrollnow.repository.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class DatabaseIntegrityTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private SiteRepository siteRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Test
    void testUserUniqueConstraints() {
        User user1 = new User("unique_user_a", "unique_a@enrollnow.local", "hash", "Alice", "Smith");
        userRepository.saveAndFlush(user1);

        // Duplicate username
        User userDuplicateUsername = new User("unique_user_a", "different_email@enrollnow.local", "hash", "Alice2", "Smith2");
        assertThrows(DataIntegrityViolationException.class, () -> {
            userRepository.saveAndFlush(userDuplicateUsername);
        });
    }

    @Test
    void testRoleUniqueConstraints() {
        Role role1 = new Role("Clinical Data Reviewer", "ROLE_CDR", "Description");
        roleRepository.saveAndFlush(role1);

        Role duplicateRole = new Role("Clinical Data Reviewer 2", "ROLE_CDR", "Another Description");
        assertThrows(DataIntegrityViolationException.class, () -> {
            roleRepository.saveAndFlush(duplicateRole);
        });
    }

    @Test
    void testUserRoleRelationshipAndIntegrity() {
        User user = userRepository.saveAndFlush(new User("rel_user", "rel_user@enrollnow.local", "hash", "Bob", "Jones"));
        Role role = roleRepository.saveAndFlush(new Role("Test Role", "ROLE_TEST_REL", "Test Role"));

        UserRole userRole = new UserRole(user, role);
        UserRole saved = userRoleRepository.saveAndFlush(userRole);
        assertNotNull(saved.getId());

        // Duplicate assignment should violate unique constraint
        UserRole duplicate = new UserRole(user, role);
        assertThrows(DataIntegrityViolationException.class, () -> {
            userRoleRepository.saveAndFlush(duplicate);
        });
    }

    @Test
    void testOrganizationAndSiteHierarchy() {
        Organization org = organizationRepository.saveAndFlush(
                new Organization("Test Trial Network", "ORG-TEST", "Trial Network")
        );

        Site site = new Site("SITE-TEST-99", "Test Research Center", "New York", "NY");
        site.setOrganization(org);
        Site savedSite = siteRepository.saveAndFlush(site);

        assertNotNull(savedSite.getId());
        assertEquals("ORG-TEST", savedSite.getOrganization().getOrgCode());
    }
}
