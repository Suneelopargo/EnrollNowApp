package com.enrollnow.audit.repositories;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.enrollnow.audit.models.EntityChangeHistory;

@Repository
public interface EntityChangeHistoryRepository
        extends JpaRepository<EntityChangeHistory, UUID> {
}