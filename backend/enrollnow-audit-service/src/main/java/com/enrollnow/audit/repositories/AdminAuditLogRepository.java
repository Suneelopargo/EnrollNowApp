package com.enrollnow.audit.repositories;

import com.enrollnow.audit.models.AdminAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdminAuditLogRepository extends JpaRepository<AdminAuditLog, Long>, JpaSpecificationExecutor<AdminAuditLog> {

    List<AdminAuditLog> findTop10ByOrderByCreatedAtDesc();
}
