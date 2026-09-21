package com.enrollnow.repository;

import com.enrollnow.models.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    @EntityGraph(attributePaths = {"userRoles", "userRoles.role", "siteAssignments", "siteAssignments.site"})
    Optional<User> findByUsername(String username);

    @EntityGraph(attributePaths = {"userRoles", "userRoles.role", "siteAssignments", "siteAssignments.site"})
    Optional<User> findByEmail(String email);

    @EntityGraph(attributePaths = {"userRoles", "userRoles.role", "siteAssignments", "siteAssignments.site"})
    @Query("SELECT u FROM User u WHERE u.username = :identifier OR u.email = :identifier")
    Optional<User> findByIdentifier(@Param("identifier") String identifier);

    @Override
    @EntityGraph(attributePaths = {"userRoles", "userRoles.role", "siteAssignments", "siteAssignments.site"})
    Optional<User> findById(Long id);

    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    long countByActive(boolean active);

    @Query("SELECT u FROM User u WHERE " +
           "(CAST(:search AS string) IS NULL OR " +
           " LOWER(u.username) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           " LOWER(u.email) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           " LOWER(u.firstName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           " LOWER(u.lastName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))) AND " +
           "(CAST(:active AS boolean) IS NULL OR u.active = :active)")
    Page<User> searchUsers(@Param("search") String search, @Param("active") Boolean active, Pageable pageable);
}
