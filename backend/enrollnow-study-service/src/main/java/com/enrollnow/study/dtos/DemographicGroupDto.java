package com.enrollnow.study.dtos;

import java.util.ArrayList;
import java.util.List;

@com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
public class DemographicGroupDto {

    private String id;
    private String defaultCategoryName; // "age", "sex", "ethnicity", "race"
    private String label;
    private String sampleSize;
    private AgeRangeDto ageRange;
    private List<GenderGroupDto> genderGroups = new ArrayList<>();

    public DemographicGroupDto() {
    }

    public DemographicGroupDto(String id, String defaultCategoryName, String label, String sampleSize, AgeRangeDto ageRange) {
        this.id = id;
        this.defaultCategoryName = defaultCategoryName;
        this.label = label;
        this.sampleSize = sampleSize;
        this.ageRange = ageRange;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getDefaultCategoryName() {
        return defaultCategoryName;
    }

    public void setDefaultCategoryName(String defaultCategoryName) {
        this.defaultCategoryName = defaultCategoryName;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getSampleSize() {
        return sampleSize;
    }

    public void setSampleSize(String sampleSize) {
        this.sampleSize = sampleSize;
    }

    public AgeRangeDto getAgeRange() {
        return ageRange;
    }

    public void setAgeRange(AgeRangeDto ageRange) {
        this.ageRange = ageRange;
    }

    public List<GenderGroupDto> getGenderGroups() {
        return genderGroups;
    }

    public void setGenderGroups(List<GenderGroupDto> genderGroups) {
        this.genderGroups = genderGroups != null ? genderGroups : new ArrayList<>();
    }

    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
    public static class AgeRangeDto {
        private Integer min;
        private Integer max;

        public AgeRangeDto() {
        }

        public AgeRangeDto(Integer min, Integer max) {
            this.min = min;
            this.max = max;
        }

        public Integer getMin() {
            return min;
        }

        public void setMin(Integer min) {
            this.min = min;
        }

        public Integer getMax() {
            return max;
        }

        public void setMax(Integer max) {
            this.max = max;
        }
    }

    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
    public static class GenderGroupDto {
        private String id;
        private String gender; // "Male", "Female", "Other"
        private Integer participants;

        public GenderGroupDto() {
        }

        public GenderGroupDto(String id, String gender, Integer participants) {
            this.id = id;
            this.gender = gender;
            this.participants = participants;
        }

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getGender() {
            return gender;
        }

        public void setGender(String gender) {
            this.gender = gender;
        }

        public Integer getParticipants() {
            return participants;
        }

        public void setParticipants(Integer participants) {
            this.participants = participants;
        }
    }
}
