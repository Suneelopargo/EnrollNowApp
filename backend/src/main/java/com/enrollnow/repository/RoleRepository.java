package com.enrollnow.repository;

import com.enrollnow.models.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(String name);
    Optional<Role> findByRoleCode(String roleCode);
    boolean existsByName(String name);
    boolean existsByRoleCode(String roleCode);
}
