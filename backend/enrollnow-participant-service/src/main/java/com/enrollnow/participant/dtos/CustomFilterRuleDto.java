package com.enrollnow.participant.dtos;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@JsonIgnoreProperties(ignoreUnknown = true)
public class CustomFilterRuleDto {
    private String id;
    private String field;
    private String operator;
    private String value;

    @JsonAlias({"min", "minInput", "start", "startDate"})
    private String minValue;

    @JsonAlias({"max", "maxInput", "end", "endDate"})
    private String maxValue;

    @JsonAlias({"options", "selectedOptions"})
    private List<String> values = new ArrayList<>();

    private String placeholder;

    public CustomFilterRuleDto() {
    }

    public CustomFilterRuleDto(String id, String field, String operator, String value, String placeholder) {
        this.id = id;
        this.field = field;
        this.operator = operator;
        this.value = value;
        this.placeholder = placeholder;
    }

    public CustomFilterRuleDto(String id, String field, String operator, String value, String minValue, String maxValue, List<String> values, String placeholder) {
        this.id = id;
        this.field = field;
        this.operator = operator;
        this.value = value;
        this.minValue = minValue;
        this.maxValue = maxValue;
        this.values = values != null ? values : new ArrayList<>();
        this.placeholder = placeholder;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getField() {
        return field;
    }

    public void setField(String field) {
        this.field = field;
    }

    public String getOperator() {
        return operator;
    }

    public void setOperator(String operator) {
        this.operator = operator;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public String getMinValue() {
        return minValue;
    }

    public void setMinValue(String minValue) {
        this.minValue = minValue;
    }

    public String getMaxValue() {
        return maxValue;
    }

    public void setMaxValue(String maxValue) {
        this.maxValue = maxValue;
    }

    public List<String> getValues() {
        return values;
    }

    public void setValues(List<String> values) {
        this.values = values != null ? values : new ArrayList<>();
    }

    public String getPlaceholder() {
        return placeholder;
    }

    public void setPlaceholder(String placeholder) {
        this.placeholder = placeholder;
    }

    public List<String> getEffectiveValues() {
        if (values != null && !values.isEmpty()) {
            return values.stream().filter(v -> v != null && !v.isBlank()).map(String::trim).collect(Collectors.toList());
        }
        if (value != null && !value.isBlank()) {
            return Arrays.stream(value.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList());
        }
        return new ArrayList<>();
    }

    public String getEffectiveMinValue() {
        if (minValue != null && !minValue.isBlank()) {
            return minValue.trim();
        }
        if (value != null && value.contains("-")) {
            String[] parts = value.split("-", 2);
            return parts[0].trim();
        }
        return null;
    }

    public String getEffectiveMaxValue() {
        if (maxValue != null && !maxValue.isBlank()) {
            return maxValue.trim();
        }
        if (value != null && value.contains("-")) {
            String[] parts = value.split("-", 2);
            return parts[1].trim();
        }
        return null;
    }
}
