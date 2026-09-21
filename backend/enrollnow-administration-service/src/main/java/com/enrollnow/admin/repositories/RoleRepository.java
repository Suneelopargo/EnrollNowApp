package com.enrollnow.admin.repositories;

import com.enrollnow.admin.models.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByRoleCode(String roleCode);
    Optional<Role> findByName(String name);
    boolean existsByRoleCode(String roleCode);
    boolean existsByName(String name);
}
