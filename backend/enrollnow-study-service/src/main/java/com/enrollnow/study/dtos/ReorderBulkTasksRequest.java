package com.enrollnow.study.dtos;

import java.util.List;

public class ReorderBulkTasksRequest {

    private List<String> taskIds;

    public ReorderBulkTasksRequest() {
    }

    public ReorderBulkTasksRequest(List<String> taskIds) {
        this.taskIds = taskIds;
    }

    public List<String> getTaskIds() {
        return taskIds;
    }

    public void setTaskIds(List<String> taskIds) {
        this.taskIds = taskIds;
    }
}
