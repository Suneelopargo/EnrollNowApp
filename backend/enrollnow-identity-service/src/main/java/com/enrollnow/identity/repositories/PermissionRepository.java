package com.enrollnow.identity.repositories;

import com.enrollnow.identity.models.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, UUID> {

    Optional<Permission> findByCode(String code);

    List<Permission> findByResource(String resource);
    
    List<Permission> findByCodeIn(Collection<String> codes);

    boolean existsByCode(String code);
}