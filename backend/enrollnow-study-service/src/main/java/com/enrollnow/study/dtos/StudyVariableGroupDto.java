package com.enrollnow.study.dtos;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;

public class StudyVariableGroupDto {

    private String id;
    private String name;

    @JsonProperty("members")
    @JsonAlias({"variableIds"})
    private List<String> members = new ArrayList<>();

    private boolean isCollapsed;

    public StudyVariableGroupDto() {
    }

    public StudyVariableGroupDto(String id, String name, List<String> members, boolean isCollapsed) {
        this.id = id;
        this.name = name;
        this.members = members != null ? members : new ArrayList<>();
        this.isCollapsed = isCollapsed;
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

    public List<String> getMembers() {
        return members;
    }

    public void setMembers(List<String> members) {
        this.members = members != null ? members : new ArrayList<>();
    }

    @JsonProperty("variableIds")
    public List<String> getVariableIds() {
        return members;
    }

    @JsonProperty("variableIds")
    public void setVariableIds(List<String> variableIds) {
        if (variableIds != null) {
            this.members = variableIds;
        }
    }

    public boolean isCollapsed() {
        return isCollapsed;
    }

    public void setCollapsed(boolean collapsed) {
        isCollapsed = collapsed;
    }
}
