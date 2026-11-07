package com.enrollnow.notification.repositories;

import com.enrollnow.notification.models.TaskAssignmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TaskAssignmentEntityRepository extends JpaRepository<TaskAssignmentEntity, UUID> {

    List<TaskAssignmentEntity> findByTenantIdAndTaskIdAndActiveTrue(UUID tenantId, UUID taskId);

    @Query("SELECT a.taskId FROM TaskAssignmentEntity a WHERE a.tenantId = :tenantId AND a.userId = :userId AND a.active = true")
    List<UUID> findTaskIdsAssignedToUser(@Param("tenantId") UUID tenantId, @Param("userId") UUID userId);

    @Query("SELECT a.userId FROM TaskAssignmentEntity a WHERE a.tenantId = :tenantId AND a.taskId = :taskId AND a.active = true")
    List<UUID> findUserIdsAssignedToTask(@Param("tenantId") UUID tenantId, @Param("taskId") UUID taskId);
}
