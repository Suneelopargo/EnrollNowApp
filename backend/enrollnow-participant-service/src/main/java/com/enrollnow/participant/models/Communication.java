package com.enrollnow.participant.models;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(
    name = "communications",
    schema = "enrollnow",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_communications_tenant_id", columnNames = {"tenant_id", "id"})
    }
)
public class Communication {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "study_id")
    private UUID studyId;

    @Column(name = "participant_id")
    private UUID participantId;

    @Column(name = "template_id")
    private UUID templateId;

    @Column(name = "channel", nullable = false, length = 30)
    private String channel; // EMAIL, SMS, PHONE, OTHER

    @Column(name = "direction", nullable = false, length = 20)
    private String direction = "OUTBOUND";

    @Column(name = "subject_snapshot", length = 500)
    private String subjectSnapshot;

    @Column(name = "body_snapshot", columnDefinition = "TEXT")
    private String bodySnapshot;

    @Column(name = "status", nullable = false, length = 30)
    private String status = "SENT";

    @Column(name = "initiated_by_user_id")
    private UUID initiatedByUserId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "sent_at")
    private OffsetDateTime sentAt = OffsetDateTime.now();

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;

    @Column(name = "external_message_id", length = 255)
    private String externalMessageId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    private String metadata = "{}";

    @Column(name = "pinned", nullable = false)
    private boolean pinned = false;

    @OneToMany(mappedBy = "communication", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<CommunicationRecipient> recipients = new ArrayList<>();

    public Communication() {
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

    public UUID getStudyId() {
        return studyId;
    }

    public void setStudyId(UUID studyId) {
        this.studyId = studyId;
    }

    public UUID getParticipantId() {
        return participantId;
    }

    public void setParticipantId(UUID participantId) {
        this.participantId = participantId;
    }

    public UUID getTemplateId() {
        return templateId;
    }

    public void setTemplateId(UUID templateId) {
        this.templateId = templateId;
    }

    public String getChannel() {
        return channel;
    }

    public void setChannel(String channel) {
        this.channel = channel;
    }

    public String getDirection() {
        return direction;
    }

    public void setDirection(String direction) {
        this.direction = direction;
    }

    public String getSubjectSnapshot() {
        return subjectSnapshot;
    }

    public void setSubjectSnapshot(String subjectSnapshot) {
        this.subjectSnapshot = subjectSnapshot;
    }

    public String getBodySnapshot() {
        return bodySnapshot;
    }

    public void setBodySnapshot(String bodySnapshot) {
        this.bodySnapshot = bodySnapshot;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public UUID getInitiatedByUserId() {
        return initiatedByUserId;
    }

    public void setInitiatedByUserId(UUID initiatedByUserId) {
        this.initiatedByUserId = initiatedByUserId;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public OffsetDateTime getSentAt() {
        return sentAt;
    }

    public void setSentAt(OffsetDateTime sentAt) {
        this.sentAt = sentAt;
    }

    public OffsetDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(OffsetDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public String getExternalMessageId() {
        return externalMessageId;
    }

    public void setExternalMessageId(String externalMessageId) {
        this.externalMessageId = externalMessageId;
    }

    public String getMetadata() {
        return metadata;
    }

    public void setMetadata(String metadata) {
        this.metadata = metadata;
    }

    public boolean isPinned() {
        return pinned;
    }

    public void setPinned(boolean pinned) {
        this.pinned = pinned;
    }

    public List<CommunicationRecipient> getRecipients() {
        return recipients;
    }

    public void setRecipients(List<CommunicationRecipient> recipients) {
        this.recipients = recipients;
    }

    public void addRecipient(CommunicationRecipient recipient) {
        recipients.add(recipient);
        recipient.setCommunication(this);
    }
}
