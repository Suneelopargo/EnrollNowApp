package com.enrollnow.identity.dtos;

public class PasswordPolicyDto {

    private Integer minimumPasswordLength = 10;
    private String minimumPasswordStrength = "MODERATE";
    private Boolean requireDigit = true;
    private Boolean requireSymbol = true;
    private Boolean requireMixedCase = true;

    public PasswordPolicyDto() {
    }

    public PasswordPolicyDto(
            Integer minimumPasswordLength,
            String minimumPasswordStrength,
            Boolean requireDigit,
            Boolean requireSymbol,
            Boolean requireMixedCase) {
        this.minimumPasswordLength = minimumPasswordLength;
        this.minimumPasswordStrength = minimumPasswordStrength;
        this.requireDigit = requireDigit;
        this.requireSymbol = requireSymbol;
        this.requireMixedCase = requireMixedCase;
    }

    public Integer getMinimumPasswordLength() {
        return minimumPasswordLength;
    }

    public void setMinimumPasswordLength(Integer minimumPasswordLength) {
        this.minimumPasswordLength = minimumPasswordLength;
    }

    public String getMinimumPasswordStrength() {
        return minimumPasswordStrength;
    }

    public void setMinimumPasswordStrength(String minimumPasswordStrength) {
        this.minimumPasswordStrength = minimumPasswordStrength;
    }

    public Boolean getRequireDigit() {
        return requireDigit;
    }

    public void setRequireDigit(Boolean requireDigit) {
        this.requireDigit = requireDigit;
    }

    public Boolean getRequireSymbol() {
        return requireSymbol;
    }

    public void setRequireSymbol(Boolean requireSymbol) {
        this.requireSymbol = requireSymbol;
    }

    public Boolean getRequireMixedCase() {
        return requireMixedCase;
    }

    public void setRequireMixedCase(Boolean requireMixedCase) {
        this.requireMixedCase = requireMixedCase;
    }
}
