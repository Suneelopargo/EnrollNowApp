package com.enrollnow.participant.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

public class SavedRegistrySearchRequest {
    @NotBlank(message = "Saved search name is required")
    private String name;
    @Valid
    private RegistrySearchRequest search;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public RegistrySearchRequest getSearch() { return search; }
    public void setSearch(RegistrySearchRequest search) { this.search = search; }
}
