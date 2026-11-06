package com.enrollnow.identity.dtos;

import java.time.OffsetDateTime;

public class RecentLoginDto {

    private OffsetDateTime loginAt;
    private String ipAddress;
    private String userAgent;

    public RecentLoginDto() {
    }

    public RecentLoginDto(OffsetDateTime loginAt, String ipAddress, String userAgent) {
        this.loginAt = loginAt;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
    }

    public OffsetDateTime getLoginAt() {
        return loginAt;
    }

    public void setLoginAt(OffsetDateTime loginAt) {
        this.loginAt = loginAt;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }
}
