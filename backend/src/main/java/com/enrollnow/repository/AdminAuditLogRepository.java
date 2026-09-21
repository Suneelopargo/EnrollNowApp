package com.enrollnow.repository;

import com.enrollnow.models.AdminAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdminAuditLogRepository extends JpaRepository<AdminAuditLog, Long> {
    List<AdminAuditLog> findTop10ByOrderByCreatedAtDesc();

    @Query("SELECT a FROM AdminAuditLog a WHERE " +
           "(CAST(:action AS string) IS NULL OR LOWER(a.action) LIKE LOWER(CONCAT('%', CAST(:action AS string), '%'))) AND " +
           "(CAST(:performedBy AS string) IS NULL OR LOWER(a.performedByUsername) LIKE LOWER(CONCAT('%', CAST(:performedBy AS string), '%'))) AND " +
           "(CAST(:targetUserId AS long) IS NULL OR a.targetUser.id = :targetUserId) AND " +
           "(CAST(:search AS string) IS NULL OR LOWER(a.details) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR LOWER(a.action) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))")
    Page<AdminAuditLog> searchAuditLogs(
            @Param("action") String action,
            @Param("performedBy") String performedBy,
            @Param("targetUserId") Long targetUserId,
            @Param("search") String search,
            Pageable pageable
    );
}
