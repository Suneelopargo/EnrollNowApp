package com.enrollnow.administrator.dto;

import java.util.List;

public class AdminAuditPageDto {

    private List<AdminAuditLogDto> content;
    private long totalElements;
    private int totalPages;

    public AdminAuditPageDto() {}

    public AdminAuditPageDto(List<AdminAuditLogDto> content, long totalElements, int totalPages) {
        this.content = content;
        this.totalElements = totalElements;
        this.totalPages = totalPages;
    }

    public List<AdminAuditLogDto> getContent() { return content; }
    public void setContent(List<AdminAuditLogDto> content) { this.content = content; }
    public long getTotalElements() { return totalElements; }
    public void setTotalElements(long totalElements) { this.totalElements = totalElements; }
    public int getTotalPages() { return totalPages; }
    public void setTotalPages(int totalPages) { this.totalPages = totalPages; }
}
