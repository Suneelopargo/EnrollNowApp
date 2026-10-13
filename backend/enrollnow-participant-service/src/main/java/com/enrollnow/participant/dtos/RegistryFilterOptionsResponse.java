package com.enrollnow.participant.dtos;

import java.util.ArrayList;
import java.util.List;

public class RegistryFilterOptionsResponse {
    private List<String> tags = new ArrayList<>();
    private List<String> states = new ArrayList<>();
    private List<String> cities = new ArrayList<>();
    private List<String> zipcodes = new ArrayList<>();
    private List<String> genders = new ArrayList<>();
    private List<String> races = new ArrayList<>();
    private List<String> ethnicities = new ArrayList<>();
    private List<StudyOption> studies = new ArrayList<>();
    private List<StatusOption> statuses = new ArrayList<>();
    private List<CustomVariableOption> customVariables = new ArrayList<>();

    public List<String> getTags() { return tags; }
    public void setTags(List<String> v) { tags = v; }
    public List<String> getStates() { return states; }
    public void setStates(List<String> v) { states = v; }
    public List<String> getCities() { return cities; }
    public void setCities(List<String> v) { cities = v; }
    public List<String> getZipcodes() { return zipcodes; }
    public void setZipcodes(List<String> v) { zipcodes = v; }
    public List<String> getGenders() { return genders; }
    public void setGenders(List<String> v) { genders = v; }
    public List<String> getRaces() { return races; }
    public void setRaces(List<String> v) { races = v; }
    public List<String> getEthnicities() { return ethnicities; }
    public void setEthnicities(List<String> v) { ethnicities = v; }
    public List<StudyOption> getStudies() { return studies; }
    public void setStudies(List<StudyOption> v) { studies = v; }
    public List<StatusOption> getStatuses() { return statuses; }
    public void setStatuses(List<StatusOption> v) { statuses = v; }
    public List<CustomVariableOption> getCustomVariables() { return customVariables; }
    public void setCustomVariables(List<CustomVariableOption> v) { customVariables = v; }

    public static class StudyOption {
        private String id;
        private String name;
        public StudyOption() {}
        public StudyOption(String id, String name) { this.id = id; this.name = name; }
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
    }

    public static class StatusOption {
        private String id;
        private String name;
        private String studyId;
        public StatusOption() {}
        public StatusOption(String id, String name, String studyId) { this.id = id; this.name = name; this.studyId = studyId; }
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getStudyId() { return studyId; }
        public void setStudyId(String studyId) { this.studyId = studyId; }
    }

    public static class CustomVariableOption {
        private String id;
        private String name;
        private String type;
        private List<String> options = new ArrayList<>();
        public CustomVariableOption() {}
        public CustomVariableOption(String id, String name, String type, List<String> options) {
            this.id = id; this.name = name; this.type = type; this.options = options == null ? new ArrayList<>() : options;
        }
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public List<String> getOptions() { return options; }
        public void setOptions(List<String> options) { this.options = options; }
    }
}
