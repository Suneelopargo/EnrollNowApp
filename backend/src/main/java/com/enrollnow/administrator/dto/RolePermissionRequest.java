package com.enrollnow.administrator.dto;

public class RolePermissionRequest {

    private Integer linkId;
    private String linkCode;
    private boolean canView;
    private boolean canCreate;
    private boolean canEdit;
    private boolean canDelete;
    private boolean canExport;

    public RolePermissionRequest() {}

    public Integer getLinkId() { return linkId; }
    public void setLinkId(Integer linkId) { this.linkId = linkId; }
    public String getLinkCode() { return linkCode; }
    public void setLinkCode(String linkCode) { this.linkCode = linkCode; }
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
