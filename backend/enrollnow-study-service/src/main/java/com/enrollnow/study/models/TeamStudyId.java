package com.enrollnow.study.models;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Embeddable
public class TeamStudyId implements Serializable {

    @Column(name = "team_id", nullable = false)
    private UUID teamId;

    @Column(name = "study_id", nullable = false)
    private UUID studyId;

    public TeamStudyId() {
    }

    public TeamStudyId(UUID teamId, UUID studyId) {
        this.teamId = teamId;
        this.studyId = studyId;
    }

    public UUID getTeamId() {
        return teamId;
    }

    public void setTeamId(UUID teamId) {
        this.teamId = teamId;
    }

    public UUID getStudyId() {
        return studyId;
    }

    public void setStudyId(UUID studyId) {
        this.studyId = studyId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof TeamStudyId that)) return false;

        return Objects.equals(teamId, that.teamId)
                && Objects.equals(studyId, that.studyId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(teamId, studyId);
    }
}