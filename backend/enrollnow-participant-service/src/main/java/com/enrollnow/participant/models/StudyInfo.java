package com.enrollnow.participant.models;

import java.util.UUID;

public class StudyInfo {
    private UUID studyId;
    private String studyName;
    private UUID statusId;
    private String statusName;
    private boolean statusIndicatesInactive;
    private boolean studyArchived;
    private boolean allowParticipationInOtherStudies = true;

    public StudyInfo() {}

    public StudyInfo(UUID studyId, String studyName, UUID statusId, String statusName) {
        this(studyId, studyName, statusId, statusName, "inactive".equalsIgnoreCase(statusName), false, true);
    }

    public StudyInfo(UUID studyId, String studyName, UUID statusId, String statusName,
                     boolean statusIndicatesInactive, boolean studyArchived, boolean allowParticipationInOtherStudies) {
        this.studyId = studyId;
        this.studyName = studyName;
        this.statusId = statusId;
        this.statusName = statusName;
        this.statusIndicatesInactive = statusIndicatesInactive;
        this.studyArchived = studyArchived;
        this.allowParticipationInOtherStudies = allowParticipationInOtherStudies;
    }

    public UUID getStudyId() { return studyId; }
    public void setStudyId(UUID studyId) { this.studyId = studyId; }
    public String getStudyName() { return studyName; }
    public void setStudyName(String studyName) { this.studyName = studyName; }
    public UUID getStatusId() { return statusId; }
    public void setStatusId(UUID statusId) { this.statusId = statusId; }
    public String getStatusName() { return statusName; }
    public void setStatusName(String statusName) { this.statusName = statusName; }
    public boolean isStatusIndicatesInactive() { return statusIndicatesInactive; }
    public void setStatusIndicatesInactive(boolean value) { statusIndicatesInactive = value; }
    public boolean isStudyArchived() { return studyArchived; }
    public void setStudyArchived(boolean value) { studyArchived = value; }
    public boolean isAllowParticipationInOtherStudies() { return allowParticipationInOtherStudies; }
    public void setAllowParticipationInOtherStudies(boolean value) { allowParticipationInOtherStudies = value; }
}
