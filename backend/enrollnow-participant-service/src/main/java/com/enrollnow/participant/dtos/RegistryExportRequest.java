package com.enrollnow.participant.dtos;

import java.util.List;
import java.util.UUID;

public class RegistryExportRequest {
    private UUID tenantId;
    private UUID siteId;
    private String search;
    private String searchTerm;
    private String contactFilter = "all";
    private String availableFilter = "all";
    private List<String> studies;
    private String customFiltersJson;
    private boolean duplicatesOnly;
    private List<String> exportFields;
    private String timezone;

    public UUID getTenantId() { return tenantId; }
    public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }
    public UUID getSiteId() { return siteId; }
    public void setSiteId(UUID siteId) { this.siteId = siteId; }
    public String getSearch() { return search; }
    public void setSearch(String search) { this.search = search; }
    public String getSearchTerm() { return searchTerm; }
    public void setSearchTerm(String searchTerm) { this.searchTerm = searchTerm; }
    public String getContactFilter() { return contactFilter; }
    public void setContactFilter(String contactFilter) { this.contactFilter = contactFilter; }
    public String getAvailableFilter() { return availableFilter; }
    public void setAvailableFilter(String availableFilter) { this.availableFilter = availableFilter; }
    public List<String> getStudies() { return studies; }
    public void setStudies(List<String> studies) { this.studies = studies; }
    public String getCustomFiltersJson() { return customFiltersJson; }
    public void setCustomFiltersJson(String customFiltersJson) { this.customFiltersJson = customFiltersJson; }
    public boolean isDuplicatesOnly() { return duplicatesOnly; }
    public void setDuplicatesOnly(boolean duplicatesOnly) { this.duplicatesOnly = duplicatesOnly; }
    public List<String> getExportFields() { return exportFields; }
    public void setExportFields(List<String> exportFields) { this.exportFields = exportFields; }
    public String getTimezone() { return timezone; }
    public void setTimezone(String timezone) { this.timezone = timezone; }
}
