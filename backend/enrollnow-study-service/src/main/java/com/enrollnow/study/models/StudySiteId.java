package com.enrollnow.study.models;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Embeddable
public class StudySiteId implements Serializable {

    @Column(name = "study_id", nullable = false)
    private UUID studyId;

    @Column(name = "site_id", nullable = false)
    private UUID siteId;

    public StudySiteId() {
    }

    public StudySiteId(UUID studyId, UUID siteId) {
        this.studyId = studyId;
        this.siteId = siteId;
    }

    public UUID getStudyId() {
        return studyId;
    }

    public void setStudyId(UUID studyId) {
        this.studyId = studyId;
    }

    public UUID getSiteId() {
        return siteId;
    }

    public void setSiteId(UUID siteId) {
        this.siteId = siteId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof StudySiteId that)) return false;

        return Objects.equals(studyId, that.studyId)
                && Objects.equals(siteId, that.siteId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(studyId, siteId);
    }
}