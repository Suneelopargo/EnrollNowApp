package com.enrollnow.study.dtos;

import java.util.List;

public class StudyBulkTasksResponse {

    private String studyId;
    private List<BulkTaskGroupDto> bulkTaskGroups;
    private List<BulkTaskDto> bulkTasks;
    private List<StudyEventOptionDto> events;
    private List<StudyAdminSummary> teamMembers;
    private boolean canManage;

    public StudyBulkTasksResponse() {
    }

    public String getStudyId() {
        return studyId;
    }

    public void setStudyId(String studyId) {
        this.studyId = studyId;
    }

    public List<BulkTaskGroupDto> getBulkTaskGroups() {
        return bulkTaskGroups;
    }

    public void setBulkTaskGroups(List<BulkTaskGroupDto> bulkTaskGroups) {
        this.bulkTaskGroups = bulkTaskGroups;
    }

    public List<BulkTaskDto> getBulkTasks() {
        return bulkTasks;
    }

    public void setBulkTasks(List<BulkTaskDto> bulkTasks) {
        this.bulkTasks = bulkTasks;
    }

    public List<StudyEventOptionDto> getEvents() {
        return events;
    }

    public void setEvents(List<StudyEventOptionDto> events) {
        this.events = events;
    }

    public List<StudyAdminSummary> getTeamMembers() {
        return teamMembers;
    }

    public void setTeamMembers(List<StudyAdminSummary> teamMembers) {
        this.teamMembers = teamMembers;
    }

    public boolean isCanManage() {
        return canManage;
    }

    public void setCanManage(boolean canManage) {
        this.canManage = canManage;
    }

    public static class BulkTaskTriggerDto {
        private String eventId;
        private String action;

        public BulkTaskTriggerDto() {
        }

        public BulkTaskTriggerDto(String eventId, String action) {
            this.eventId = eventId;
            this.action = action;
        }

        public String getEventId() {
            return eventId;
        }

        public void setEventId(String eventId) {
            this.eventId = eventId;
        }

        public String getAction() {
            return action;
        }

        public void setAction(String action) {
            this.action = action;
        }
    }

    public static class BulkTaskDto {
        private String _id;
        private String studyId;
        private String bulkTaskGroupId;
        private String name;
        private String description;
        private int rank;
        private List<String> assignedTo;
        private String assignedToInitials;

        public BulkTaskDto() {
        }

        public String get_id() {
            return _id;
        }

        public void set_id(String _id) {
            this._id = _id;
        }

        public String getStudyId() {
            return studyId;
        }

        public void setStudyId(String studyId) {
            this.studyId = studyId;
        }

        public String getBulkTaskGroupId() {
            return bulkTaskGroupId;
        }

        public void setBulkTaskGroupId(String bulkTaskGroupId) {
            this.bulkTaskGroupId = bulkTaskGroupId;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public int getRank() {
            return rank;
        }

        public void setRank(int rank) {
            this.rank = rank;
        }

        public List<String> getAssignedTo() {
            return assignedTo;
        }

        public void setAssignedTo(List<String> assignedTo) {
            this.assignedTo = assignedTo;
        }

        public String getAssignedToInitials() {
            return assignedToInitials;
        }

        public void setAssignedToInitials(String assignedToInitials) {
            this.assignedToInitials = assignedToInitials;
        }
    }

    public static class BulkTaskGroupDto {
        private String _id;
        private String studyId;
        private String name;
        private String description;
        private boolean triggerActive;
        private BulkTaskTriggerDto trigger;
        private List<BulkTaskDto> tasks;

        public BulkTaskGroupDto() {
        }

        public String get_id() {
            return _id;
        }

        public void set_id(String _id) {
            this._id = _id;
        }

        public String getStudyId() {
            return studyId;
        }

        public void setStudyId(String studyId) {
            this.studyId = studyId;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public boolean isTriggerActive() {
            return triggerActive;
        }

        public void setTriggerActive(boolean triggerActive) {
            this.triggerActive = triggerActive;
        }

        public BulkTaskTriggerDto getTrigger() {
            return trigger;
        }

        public void setTrigger(BulkTaskTriggerDto trigger) {
            this.trigger = trigger;
        }

        public List<BulkTaskDto> getTasks() {
            return tasks;
        }

        public void setTasks(List<BulkTaskDto> tasks) {
            this.tasks = tasks;
        }
    }

    public static class StudyEventOptionDto {
        private String _id;
        private String name;

        public StudyEventOptionDto() {
        }

        public StudyEventOptionDto(String _id, String name) {
            this._id = _id;
            this.name = name;
        }

        public String get_id() {
            return _id;
        }

        public void set_id(String _id) {
            this._id = _id;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }
    }
}
