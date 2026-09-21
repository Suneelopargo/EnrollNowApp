package com.enrollnow.admin.dto;

public class PermissionLinkDto {
    private Integer linkId;
    private String linkCode;
    private String title;
    private String path;
    private String icon;
    private boolean canView;
    private boolean canCreate;
    private boolean canEdit;
    private boolean canDelete;
    private boolean canExport;

    public PermissionLinkDto() {}

    public Integer getLinkId() { return linkId; }
    public void setLinkId(Integer linkId) { this.linkId = linkId; }
    public String getLinkCode() { return linkCode; }
    public void setLinkCode(String linkCode) { this.linkCode = linkCode; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }
    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
    public boolean isCanView() { return canView; }
    public void setCanView(boolean canView) { this.canView = canView; }
    public boolean isCanCreate() { return canCreate; }
    public void setCanCreate(boolean canCreate) { this.canCreate = canCreate; }
    public boolean isCanEdit() { return canEdit; }
    public void setCanEdit(boolean canEdit) { this.canEdit = canEdit; }
    public boolean isCanDelete() { return canDelete; }
    public void setCanDelete(boolean canDelete) { this.canDelete = canDelete; }
    public boolean isCanExport() { return canExport; }
    public void setCanExport(boolean canExport) { this.canExport = canExport; }
}
