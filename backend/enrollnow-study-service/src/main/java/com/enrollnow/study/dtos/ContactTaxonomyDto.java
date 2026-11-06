package com.enrollnow.study.dtos;

@com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
public class ContactTaxonomyDto {

    private String id;
    private String value;

    public ContactTaxonomyDto() {
    }

    public ContactTaxonomyDto(String id, String value) {
        this.id = id;
        this.value = value;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }
}
