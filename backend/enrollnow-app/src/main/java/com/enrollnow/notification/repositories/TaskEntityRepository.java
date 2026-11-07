package com.enrollnow.notification.repositories;

import com.enrollnow.notification.models.TaskEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface TaskEntityRepository extends JpaRepository<TaskEntity, UUID> {

    @Query("SELECT t FROM TaskEntity t WHERE t.tenantId = :tenantId AND t.studyId = :studyId AND t.active = true " +
           "AND t.dueAt <= :dueLimit AND (t.status IS NULL OR t.status IN ('OPEN', 'IN_PROGRESS', 'Unassigned', 'Assigned')) " +
           "ORDER BY t.dueAt ASC")
    List<TaskEntity> findOverdueTasks(
            @Param("tenantId") UUID tenantId,
            @Param("studyId") UUID studyId,
            @Param("dueLimit") Instant dueLimit
    );

    @Query("SELECT t FROM TaskEntity t WHERE t.tenantId = :tenantId AND t.studyId = :studyId AND t.active = true " +
           "AND t.dueAt >= :start AND t.dueAt <= :end " +
           "ORDER BY t.dueAt ASC")
    List<TaskEntity> findTasksDueBetween(
            @Param("tenantId") UUID tenantId,
            @Param("studyId") UUID studyId,
            @Param("start") Instant start,
            @Param("end") Instant end
    );

    List<TaskEntity> findByTenantIdAndStudyIdAndActiveTrue(UUID tenantId, UUID studyId);
}
