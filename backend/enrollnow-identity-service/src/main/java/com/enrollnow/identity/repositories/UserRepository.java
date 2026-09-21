package com.enrollnow.identity.repositories;

import com.enrollnow.identity.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    @Query("SELECT u FROM User u WHERE LOWER(u.username) = LOWER(:identifier) OR LOWER(u.email) = LOWER(:identifier)")
    Optional<User> findByUsernameOrEmailIgnoreCase(@Param("identifier") String identifier);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    @Query(value = "SELECT r.role_code FROM roles r INNER JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = :userId AND ur.status = 'ACTIVE'", nativeQuery = true)
    List<String> findRoleCodesByUserId(@Param("userId") Long userId);

    @Query(value = "SELECT s.site_code FROM sites s INNER JOIN user_site_assignments usa ON s.id = usa.site_id WHERE usa.user_id = :userId AND usa.status = 'ACTIVE'", nativeQuery = true)
    List<String> findSiteCodesByUserId(@Param("userId") Long userId);

    @Query(value = "SELECT o.name FROM organizations o WHERE o.id = :orgId", nativeQuery = true)
    Optional<String> findOrganizationNameById(@Param("orgId") Long orgId);
}
