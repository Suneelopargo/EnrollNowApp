package com.enrollnow.admin.dto;

public class AdminSiteAccessDto {
    private Long siteId;
    private String siteCode;
    private String siteName;
    private boolean assigned;

    public AdminSiteAccessDto() {}

    public AdminSiteAccessDto(Long siteId, String siteCode, String siteName, boolean assigned) {
        this.siteId = siteId;
        this.siteCode = siteCode;
        this.siteName = siteName;
        this.assigned = assigned;
    }

    public Long getSiteId() { return siteId; }
    public void setSiteId(Long siteId) { this.siteId = siteId; }
    public String getSiteCode() { return siteCode; }
    public void setSiteCode(String siteCode) { this.siteCode = siteCode; }
    public String getSiteName() { return siteName; }
    public void setSiteName(String siteName) { this.siteName = siteName; }
    public boolean isAssigned() { return assigned; }
    public void setAssigned(boolean assigned) { this.assigned = assigned; }
}
