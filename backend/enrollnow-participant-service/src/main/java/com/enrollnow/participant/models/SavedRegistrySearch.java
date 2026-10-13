package com.enrollnow.participant.models;

import com.enrollnow.participant.dtos.RegistrySearchRequest;

import java.time.OffsetDateTime;
import java.util.UUID;

public class SavedRegistrySearch {
    private UUID id;
    private UUID tenantId;
    private UUID ownerUserId;
    private String name;
    private RegistrySearchRequest search;
    private OffsetDateTime insertedAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getTenantId() { return tenantId; }
    public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }
    public UUID getOwnerUserId() { return ownerUserId; }
    public void setOwnerUserId(UUID ownerUserId) { this.ownerUserId = ownerUserId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public RegistrySearchRequest getSearch() { return search; }
    public void setSearch(RegistrySearchRequest search) { this.search = search; }
    public OffsetDateTime getInsertedAt() { return insertedAt; }
    public void setInsertedAt(OffsetDateTime insertedAt) { this.insertedAt = insertedAt; }
}
