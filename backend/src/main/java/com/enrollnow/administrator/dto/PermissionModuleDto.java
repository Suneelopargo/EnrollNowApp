package com.enrollnow.administrator.dto;

import java.util.ArrayList;
import java.util.List;

public class PermissionModuleDto {

    private Integer moduleId;
    private String moduleCode;
    private String title;
    private String shortTitle;
    private String icon;
    private Integer displayOrder;
    private List<PermissionLinkDto> links = new ArrayList<>();

    public PermissionModuleDto() {}

    public Integer getModuleId() { return moduleId; }
    public void setModuleId(Integer moduleId) { this.moduleId = moduleId; }
    public String getModuleCode() { return moduleCode; }
    public void setModuleCode(String moduleCode) { this.moduleCode = moduleCode; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getShortTitle() { return shortTitle; }
    public void setShortTitle(String shortTitle) { this.shortTitle = shortTitle; }
    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }
    public List<PermissionLinkDto> getLinks() { return links; }
    public void setLinks(List<PermissionLinkDto> links) { this.links = links; }
}
