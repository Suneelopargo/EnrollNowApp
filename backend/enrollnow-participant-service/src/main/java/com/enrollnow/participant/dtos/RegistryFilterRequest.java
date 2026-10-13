package com.enrollnow.participant.dtos;

import jakarta.validation.constraints.NotBlank;

import java.util.ArrayList;
import java.util.List;

public class RegistryFilterRequest {
    @NotBlank(message = "Filter field is required")
    private String field;
    private String operator = "equal";
    private List<String> values = new ArrayList<>();
    private String value;
    private String minValue;
    private String maxValue;

    public String getField() { return field; }
    public void setField(String field) { this.field = field; }
    public String getOperator() { return operator; }
    public void setOperator(String operator) { this.operator = operator; }
    public List<String> getValues() { return values; }
    public void setValues(List<String> values) { this.values = values == null ? new ArrayList<>() : values; }
    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }
    public String getMinValue() { return minValue; }
    public void setMinValue(String minValue) { this.minValue = minValue; }
    public String getMaxValue() { return maxValue; }
    public void setMaxValue(String maxValue) { this.maxValue = maxValue; }

    public List<String> effectiveValues() {
        if (values != null && !values.isEmpty()) return values;
        if (value == null || value.isBlank()) return List.of();
        return List.of(value);
    }
}
