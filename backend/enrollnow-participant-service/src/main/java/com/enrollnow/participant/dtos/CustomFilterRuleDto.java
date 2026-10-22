package com.enrollnow.participant.dtos;

public class CustomFilterRuleDto {
    private String id;
    private String field;
    private String operator;
    private String value;
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

    public String getPlaceholder() {
        return placeholder;
    }

    public void setPlaceholder(String placeholder) {
        this.placeholder = placeholder;
    }
}
