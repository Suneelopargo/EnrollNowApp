package com.enrollnow.study.dtos;

public class StudyTextTemplateDto {

    private String _id;
    private String studyId;
    private String name;
    private String description;
    private String message;
    private boolean archived;
    private int rank;
    private StudyScheduledActionDto scheduledAction;

    public StudyTextTemplateDto() {
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

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isArchived() {
        return archived;
    }

    public void setArchived(boolean archived) {
        this.archived = archived;
    }

    public int getRank() {
        return rank;
    }

    public void setRank(int rank) {
        this.rank = rank;
    }

    public StudyScheduledActionDto getScheduledAction() {
        return scheduledAction;
    }

    public void setScheduledAction(StudyScheduledActionDto scheduledAction) {
        this.scheduledAction = scheduledAction;
    }
}
