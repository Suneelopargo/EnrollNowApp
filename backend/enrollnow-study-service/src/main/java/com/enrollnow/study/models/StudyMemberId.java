package com.enrollnow.study.models;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Embeddable
public class StudyMemberId implements Serializable {

    @Column(name = "study_id", nullable = false)
    private UUID studyId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    public StudyMemberId() {
    }

    public StudyMemberId(UUID studyId, UUID userId) {
        this.studyId = studyId;
        this.userId = userId;
    }

    public UUID getStudyId() {
        return studyId;
    }

    public void setStudyId(UUID studyId) {
        this.studyId = studyId;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof StudyMemberId that)) return false;

        return Objects.equals(studyId, that.studyId)
                && Objects.equals(userId, that.userId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(studyId, userId);
    }
}