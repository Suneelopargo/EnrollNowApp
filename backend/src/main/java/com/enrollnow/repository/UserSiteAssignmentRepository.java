package com.enrollnow.repository;

import com.enrollnow.models.UserSiteAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserSiteAssignmentRepository extends JpaRepository<UserSiteAssignment, Long> {
    List<UserSiteAssignment> findByUserId(Long userId);
    List<UserSiteAssignment> findBySiteId(Long siteId);
    Optional<UserSiteAssignment> findByUserIdAndSiteId(Long userId, Long siteId);
    void deleteByUserId(Long userId);
    long countBySiteIdAndStatus(Long siteId, String status);
}
