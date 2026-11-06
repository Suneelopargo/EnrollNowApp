package com.enrollnow.participant.dtos;

import java.util.ArrayList;
import java.util.List;

public class FamilyInfoDto {
    private String familyRole;
    private Integer membersCount;
    private String pedigreeTreeId;
    private String guardianName;
    private List<FamilyMemberDto> members = new ArrayList<>();

    public static class FamilyMemberDto {
        private String id;
        private String name;
        private String sex;
        private String age;
        private List<String> studies = new ArrayList<>();

        public FamilyMemberDto() {
        }

        public FamilyMemberDto(String id, String name, String sex, String age, List<String> studies) {
            this.id = id;
            this.name = name;
            this.sex = sex;
            this.age = age;
            if (studies != null) {
                this.studies = studies;
            }
        }

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getSex() {
            return sex;
        }

        public void setSex(String sex) {
            this.sex = sex;
        }

        public String getAge() {
            return age;
        }

        public void setAge(String age) {
            this.age = age;
        }

        public List<String> getStudies() {
            return studies;
        }

        public void setStudies(List<String> studies) {
            this.studies = studies;
        }
    }

    public FamilyInfoDto() {
    }

    public FamilyInfoDto(String familyRole, Integer membersCount, String pedigreeTreeId, String guardianName) {
        this.familyRole = familyRole;
        this.membersCount = membersCount;
        this.pedigreeTreeId = pedigreeTreeId;
        this.guardianName = guardianName;
    }

    public FamilyInfoDto(String familyRole, Integer membersCount, String pedigreeTreeId, String guardianName, List<FamilyMemberDto> members) {
        this.familyRole = familyRole;
        this.membersCount = membersCount;
        this.pedigreeTreeId = pedigreeTreeId;
        this.guardianName = guardianName;
        if (members != null) {
            this.members = members;
        }
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

    public List<FamilyMemberDto> getMembers() {
        return members;
    }

    public void setMembers(List<FamilyMemberDto> members) {
        this.members = members;
    }
}
