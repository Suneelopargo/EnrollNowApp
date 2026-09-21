package com.enrollnow.dashboard.dto;

public class PipelineStageDto {
    private String stage;
    private int count;

    public PipelineStageDto() {}

    public PipelineStageDto(String stage, int count) {
        this.stage = stage;
        this.count = count;
    }

    public String getStage() { return stage; }
    public void setStage(String stage) { this.stage = stage; }

    public int getCount() { return count; }
    public void setCount(int count) { this.count = count; }
}
