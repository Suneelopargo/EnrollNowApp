package com.enrollnow.study.dtos;

import java.util.List;

public class ReorderTemplatesRequest {

    private List<String> sortedIds;

    public ReorderTemplatesRequest() {
    }

    public ReorderTemplatesRequest(List<String> sortedIds) {
        this.sortedIds = sortedIds;
    }

    public List<String> getSortedIds() {
        return sortedIds;
    }

    public void setSortedIds(List<String> sortedIds) {
        this.sortedIds = sortedIds;
    }
}
