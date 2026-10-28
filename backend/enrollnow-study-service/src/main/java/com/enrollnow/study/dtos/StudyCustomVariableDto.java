package com.enrollnow.study.dtos;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;

public class StudyCustomVariableDto {

    private String id;
    private String name;
    private String variableType; // "single", "multi", "short", "long", "number", "date", "dateTime"
    private List<VariableOptionDto> options = new ArrayList<>();

    @JsonProperty("isGlobal")
    private boolean isGlobal;

    @JsonProperty("isBlind")
    private boolean isBlind;

    private int rank;

    public StudyCustomVariableDto() {
    }

    public StudyCustomVariableDto(String id, String name, String variableType, List<VariableOptionDto> options, boolean isGlobal, boolean isBlind, int rank) {
        this.id = id;
        this.name = name;
        this.variableType = variableType;
        this.options = options != null ? options : new ArrayList<>();
        this.isGlobal = isGlobal;
        this.isBlind = isBlind;
        this.rank = rank;
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

    public String getVariableType() {
        return variableType;
    }

    public void setVariableType(String variableType) {
        this.variableType = variableType;
    }

    public List<VariableOptionDto> getOptions() {
        return options;
    }

    public void setOptions(List<VariableOptionDto> options) {
        this.options = options != null ? options : new ArrayList<>();
    }

    @JsonProperty("isGlobal")
    public boolean isGlobal() {
        return isGlobal;
    }

    @JsonProperty("isGlobal")
    public void setGlobal(boolean global) {
        isGlobal = global;
    }

    @JsonProperty("isBlind")
    public boolean isBlind() {
        return isBlind;
    }

    @JsonProperty("isBlind")
    public void setBlind(boolean blind) {
        isBlind = blind;
    }

    public int getRank() {
        return rank;
    }

    public void setRank(int rank) {
        this.rank = rank;
    }

    public static class VariableOptionDto {
        @JsonProperty("optionId")
        @JsonAlias({"value", "id"})
        private String optionId;

        @JsonProperty("name")
        @JsonAlias({"label"})
        private String name;

        public VariableOptionDto() {
        }

        public VariableOptionDto(String optionId, String name) {
            this.optionId = optionId;
            this.name = name;
        }

        public String getOptionId() {
            return optionId;
        }

        public void setOptionId(String optionId) {
            this.optionId = optionId;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        @JsonProperty("value")
        public String getValue() {
            return optionId;
        }

        @JsonProperty("value")
        public void setValue(String value) {
            if (this.optionId == null || this.optionId.isBlank()) {
                this.optionId = value;
            }
        }

        @JsonProperty("label")
        public String getLabel() {
            return name;
        }

        @JsonProperty("label")
        public void setLabel(String label) {
            if (this.name == null || this.name.isBlank()) {
                this.name = label;
            }
        }
    }
}
