package com.enrollnow.repository;

import com.enrollnow.models.RoleLinkAccess;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoleLinkAccessRepository extends JpaRepository<RoleLinkAccess, Long> {
    List<RoleLinkAccess> findByRoleId(Long roleId);
    List<RoleLinkAccess> findByRoleIdInAndStatus(List<Long> roleIds, String status);
    Optional<RoleLinkAccess> findByRoleIdAndLinkId(Long roleId, Integer linkId);
    void deleteByRoleId(Long roleId);
}
