package com.enrollnow.study.dtos;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonAnySetter;
import jakarta.validation.constraints.NotNull;

import java.util.HashMap;
import java.util.Map;

public class ImportStudyComponentsRequest {

    @JsonAlias({"components", "studyData", "data", "payload", "configuration"})
    private Map<String, Object> components;

    public ImportStudyComponentsRequest() {
        this.components = new HashMap<>();
    }

    public ImportStudyComponentsRequest(Map<String, Object> components) {
        this.components = components != null ? components : new HashMap<>();
    }

    public Map<String, Object> getComponents() {
        return components != null ? components : new HashMap<>();
    }

    public void setComponents(Map<String, Object> components) {
        this.components = components;
    }

    @JsonAnySetter
    public void setAdditionalProperty(String key, Object value) {
        if (this.components == null) {
            this.components = new HashMap<>();
        }
        this.components.put(key, value);
    }
}
