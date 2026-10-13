package com.enrollnow.participant.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import java.util.ArrayList;
import java.util.List;

public class RegistryExportRequest {
    @Valid
    private RegistrySearchRequest search;
    private List<String> fields = new ArrayList<>();
    @NotBlank(message = "Export format is required")
    private String format = "CSV";

    public RegistrySearchRequest getSearch() { return search; }
    public void setSearch(RegistrySearchRequest v) { search = v; }
    public List<String> getFields() { return fields; }
    public void setFields(List<String> v) { fields = v == null ? new ArrayList<>() : v; }
    public String getFormat() { return format; }
    public void setFormat(String v) { format = v; }
}
