package com.enrollnow.participant.dtos;

import java.util.List;

public class SavedSearchDto {
    private String id;
    private String name;
    private String contactFilter;
    private String availableFilter;
    private String searchTerm;
    private List<String> selectedStudies;
    private List<CustomFilterRuleDto> customFilters;

    public SavedSearchDto() {
    }

    public SavedSearchDto(String id, String name, String contactFilter, String availableFilter, String searchTerm, List<String> selectedStudies, List<CustomFilterRuleDto> customFilters) {
        this.id = id;
        this.name = name;
        this.contactFilter = contactFilter;
        this.availableFilter = availableFilter;
        this.searchTerm = searchTerm;
        this.selectedStudies = selectedStudies;
        this.customFilters = customFilters;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getContactFilter() {
        return contactFilter;
    }

    public void setContactFilter(String contactFilter) {
        this.contactFilter = contactFilter;
    }

    public String getAvailableFilter() {
        return availableFilter;
    }

    public void setAvailableFilter(String availableFilter) {
        this.availableFilter = availableFilter;
    }

    public String getSearchTerm() {
        return searchTerm;
    }

    public void setSearchTerm(String searchTerm) {
        this.searchTerm = searchTerm;
    }

    public List<String> getSelectedStudies() {
        return selectedStudies;
    }

    public void setSelectedStudies(List<String> selectedStudies) {
        this.selectedStudies = selectedStudies;
    }

    public List<CustomFilterRuleDto> getCustomFilters() {
        return customFilters;
    }

    public void setCustomFilters(List<CustomFilterRuleDto> customFilters) {
        this.customFilters = customFilters;
    }
}
