package com.enrollnow.participant.dtos;

public class FamilyInfoDto {
    private String familyRole;
    private Integer membersCount;
    private String pedigreeTreeId;
    private String guardianName;

    public FamilyInfoDto() {
    }

    public FamilyInfoDto(String familyRole, Integer membersCount, String pedigreeTreeId, String guardianName) {
        this.familyRole = familyRole;
        this.membersCount = membersCount;
        this.pedigreeTreeId = pedigreeTreeId;
        this.guardianName = guardianName;
    }

    public String getFamilyRole() {
        return familyRole;
    }

    public void setFamilyRole(String familyRole) {
        this.familyRole = familyRole;
    }

    public Integer getMembersCount() {
        return membersCount;
    }

    public void setMembersCount(Integer membersCount) {
        this.membersCount = membersCount;
    }

    public String getPedigreeTreeId() {
        return pedigreeTreeId;
    }

    public void setPedigreeTreeId(String pedigreeTreeId) {
        this.pedigreeTreeId = pedigreeTreeId;
    }

    public String getGuardianName() {
        return guardianName;
    }

    public void setGuardianName(String guardianName) {
        this.guardianName = guardianName;
    }
}
