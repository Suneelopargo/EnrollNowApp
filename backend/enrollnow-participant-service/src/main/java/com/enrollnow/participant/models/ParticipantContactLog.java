package com.enrollnow.participant.models;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "participant_contact_logs",
    schema = "enrollnow",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_participant_contact_logs_tenant_id", columnNames = {"tenant_id", "id"})
    }
)
public class ParticipantContactLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "participant_id", nullable = false)
    private UUID participantId;

    @Column(name = "study_id")
    private UUID studyId;

    @Column(name = "date_time_of_contact", nullable = false)
    private OffsetDateTime dateTimeOfContact = OffsetDateTime.now();

    @Column(name = "contact_type", nullable = false, length = 100)
    private String contactType;

    @Column(name = "contact_method", length = 255)
    private String contactMethod;

    @Column(name = "contacted_by_user_id", nullable = false)
    private UUID contactedByUserId;

    @Column(name = "spoke_to", length = 255)
    private String spokeTo;

    @Column(name = "regarding", columnDefinition = "TEXT")
    private String regarding;

    @Column(name = "outcome", nullable = false, length = 255)
    private String outcome;

    @Column(name = "comments", columnDefinition = "TEXT")
    private String comments;

    @Column(name = "sticky", nullable = false)
    private boolean sticky = false;

    @Column(name = "notify", nullable = false)
    private boolean notify = false;

    @Column(name = "global", nullable = false)
    private boolean global = true;

    @Column(name = "last_contact", nullable = false)
    private boolean lastContact = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @Column(name = "updated_by", nullable = false)
    private UUID updatedBy;

    public ParticipantContactLog() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getTenantId() {
        return tenantId;
    }

    public void setTenantId(UUID tenantId) {
        this.tenantId = tenantId;
    }

    public UUID getParticipantId() {
        return participantId;
    }

    public void setParticipantId(UUID participantId) {
        this.participantId = participantId;
    }

    public UUID getStudyId() {
        return studyId;
    }

    public void setStudyId(UUID studyId) {
        this.studyId = studyId;
    }

    public OffsetDateTime getDateTimeOfContact() {
        return dateTimeOfContact;
    }

    public void setDateTimeOfContact(OffsetDateTime dateTimeOfContact) {
        this.dateTimeOfContact = dateTimeOfContact;
    }

    public String getContactType() {
        return contactType;
    }

    public void setContactType(String contactType) {
        this.contactType = contactType;
    }

    public String getContactMethod() {
        return contactMethod;
    }

    public void setContactMethod(String contactMethod) {
        this.contactMethod = contactMethod;
    }

    public UUID getContactedByUserId() {
        return contactedByUserId;
    }

    public void setContactedByUserId(UUID contactedByUserId) {
        this.contactedByUserId = contactedByUserId;
    }

    public String getSpokeTo() {
        return spokeTo;
    }

    public void setSpokeTo(String spokeTo) {
        this.spokeTo = spokeTo;
    }

    public String getRegarding() {
        return regarding;
    }

    public void setRegarding(String regarding) {
        this.regarding = regarding;
    }

    public String getOutcome() {
        return outcome;
    }

    public void setOutcome(String outcome) {
        this.outcome = outcome;
    }

    public String getComments() {
        return comments;
    }

    public void setComments(String comments) {
        this.comments = comments;
    }

    public boolean isSticky() {
        return sticky;
    }

    public void setSticky(boolean sticky) {
        this.sticky = sticky;
    }

    public boolean isNotify() {
        return notify;
    }

    public void setNotify(boolean notify) {
        this.notify = notify;
    }

    public boolean isGlobal() {
        return global;
    }

    public void setGlobal(boolean global) {
        this.global = global;
    }

    public boolean isLastContact() {
        return lastContact;
    }

    public void setLastContact(boolean lastContact) {
        this.lastContact = lastContact;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public UUID getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(UUID createdBy) {
        this.createdBy = createdBy;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public UUID getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(UUID updatedBy) {
        this.updatedBy = updatedBy;
    }
}
