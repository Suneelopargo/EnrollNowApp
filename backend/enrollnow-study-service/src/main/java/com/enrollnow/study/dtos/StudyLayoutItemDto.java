package com.enrollnow.study.dtos;

@com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
public class StudyLayoutItemDto {

    private String id;
    private String type; // "group" | "variable"
    private String refId;
    private int rank;

    public StudyLayoutItemDto() {
    }

    public StudyLayoutItemDto(String id, String type, String refId, int rank) {
        this.id = id;
        this.type = type;
        this.refId = refId;
        this.rank = rank;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getRefId() {
        return refId;
    }

    public void setRefId(String refId) {
        this.refId = refId;
    }

    public int getRank() {
        return rank;
    }

    public void setRank(int rank) {
        this.rank = rank;
    }
}
