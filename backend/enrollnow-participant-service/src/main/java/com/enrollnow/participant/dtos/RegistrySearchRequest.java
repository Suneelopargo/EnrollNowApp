package com.enrollnow.participant.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import java.util.ArrayList;
import java.util.List;

public class RegistrySearchRequest {
    private String searchText;

    @Valid
    private List<RegistryFilterRequest> filters = new ArrayList<>();

    private String contactForFutureStudies = "ALL";
    private String participantAvailability = "ALL";
    private boolean duplicatesOnly;

    @Min(value = 0, message = "Page must be zero or greater")
    private int page = 0;

    @Min(value = 1, message = "Size must be at least 1")
    @Max(value = 500, message = "Size cannot exceed 500")
    private int size = 100;

    private String sortField = "name";
    private String sortDirection = "ASC";

    public String getSearchText() { return searchText; }
    public void setSearchText(String searchText) { this.searchText = searchText; }
    public List<RegistryFilterRequest> getFilters() { return filters; }
    public void setFilters(List<RegistryFilterRequest> filters) { this.filters = filters == null ? new ArrayList<>() : filters; }
    public String getContactForFutureStudies() { return contactForFutureStudies; }
    public void setContactForFutureStudies(String value) { this.contactForFutureStudies = value; }
    public String getParticipantAvailability() { return participantAvailability; }
    public void setParticipantAvailability(String value) { this.participantAvailability = value; }
    public boolean isDuplicatesOnly() { return duplicatesOnly; }
    public void setDuplicatesOnly(boolean duplicatesOnly) { this.duplicatesOnly = duplicatesOnly; }
    public int getPage() { return page; }
    public void setPage(int page) { this.page = page; }
    public int getSize() { return size; }
    public void setSize(int size) { this.size = size; }
    public String getSortField() { return sortField; }
    public void setSortField(String sortField) { this.sortField = sortField; }
    public String getSortDirection() { return sortDirection; }
    public void setSortDirection(String sortDirection) { this.sortDirection = sortDirection; }
}
