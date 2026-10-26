package com.enrollnow.study.dtos;

import java.util.ArrayList;
import java.util.List;

public class StudyCustomVariableDto {

    private String id;
    private String name;
    private String variableType; // "single", "multi", "short", "long", "number", "date", "dateTime"
    private List<VariableOptionDto> options = new ArrayList<>();
    private boolean isGlobal;
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

    public boolean isGlobal() {
        return isGlobal;
    }

    public void setGlobal(boolean global) {
        isGlobal = global;
    }

    public boolean isBlind() {
        return isBlind;
    }

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
        private String optionId;
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
    }
}
