package com.enrollnow.identity.repositories;

import com.enrollnow.identity.models.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoleRepository extends JpaRepository<Role, UUID> {

    Optional<Role> findByCode(String code);

    List<Role> findByActiveTrue();

    List<Role> findByScopeTypeAndActiveTrue(String scopeType);
    
    boolean existsByCode(String code);
}