package com.enrollnow.admin.dto;

import java.util.ArrayList;
import java.util.List;

public class PermissionModuleDto {
    private Integer moduleId;
    private String moduleCode;
    private String title;
    private String icon;
    private List<PermissionLinkDto> links = new ArrayList<>();

    public PermissionModuleDto() {}

    public PermissionModuleDto(Integer moduleId, String moduleCode, String title, String icon) {
        this.moduleId = moduleId;
        this.moduleCode = moduleCode;
        this.title = title;
        this.icon = icon;
    }

    public Integer getModuleId() { return moduleId; }
    public void setModuleId(Integer moduleId) { this.moduleId = moduleId; }
    public String getModuleCode() { return moduleCode; }
    public void setModuleCode(String moduleCode) { this.moduleCode = moduleCode; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
    public List<PermissionLinkDto> getLinks() { return links; }
    public void setLinks(List<PermissionLinkDto> links) { this.links = links; }
}
