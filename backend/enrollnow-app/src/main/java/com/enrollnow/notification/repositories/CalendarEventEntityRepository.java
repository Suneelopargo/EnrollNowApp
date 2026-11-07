package com.enrollnow.notification.repositories;

import com.enrollnow.notification.models.CalendarEventEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface CalendarEventEntityRepository extends JpaRepository<CalendarEventEntity, UUID> {

    @Query("SELECT e FROM CalendarEventEntity e WHERE e.tenantId = :tenantId AND e.studyId = :studyId AND e.active = true " +
           "AND e.status = 'SCHEDULED' AND e.startAt <= :overdueLimit " +
           "ORDER BY e.startAt ASC")
    List<CalendarEventEntity> findOverdueEvents(
            @Param("tenantId") UUID tenantId,
            @Param("studyId") UUID studyId,
            @Param("overdueLimit") Instant overdueLimit
    );

    @Query("SELECT e FROM CalendarEventEntity e WHERE e.tenantId = :tenantId AND e.studyId = :studyId AND e.active = true " +
           "AND e.status = 'SCHEDULED' AND e.startAt >= :start AND e.startAt <= :end " +
           "ORDER BY e.startAt ASC")
    List<CalendarEventEntity> findEventsBetween(
            @Param("tenantId") UUID tenantId,
            @Param("studyId") UUID studyId,
            @Param("start") Instant start,
            @Param("end") Instant end
    );

    @Query("SELECT e FROM CalendarEventEntity e WHERE e.tenantId = :tenantId AND e.studyId = :studyId AND e.active = true " +
           "AND e.status = 'SCHEDULED' AND e.startAt <= :horizon " +
           "ORDER BY e.startAt ASC")
    List<CalendarEventEntity> findExpectedEvents(
            @Param("tenantId") UUID tenantId,
            @Param("studyId") UUID studyId,
            @Param("horizon") Instant horizon
    );
}
