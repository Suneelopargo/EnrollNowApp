package com.enrollnow.participant.dtos;

import java.time.OffsetDateTime;
import java.util.UUID;

public class SavedRegistrySearchResponse {
    private UUID id;
    private String name;
    private RegistrySearchRequest search;
    private OffsetDateTime insertedAt;

    public SavedRegistrySearchResponse() {}
    public SavedRegistrySearchResponse(UUID id, String name, RegistrySearchRequest search, OffsetDateTime insertedAt) {
        this.id = id; this.name = name; this.search = search; this.insertedAt = insertedAt;
    }
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public RegistrySearchRequest getSearch() { return search; }
    public void setSearch(RegistrySearchRequest search) { this.search = search; }
    public OffsetDateTime getInsertedAt() { return insertedAt; }
    public void setInsertedAt(OffsetDateTime insertedAt) { this.insertedAt = insertedAt; }
}
