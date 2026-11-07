package com.enrollnow.notification.services;

import com.enrollnow.identity.services.InvitationEmailService;
import com.enrollnow.participant.models.Communication;
import com.enrollnow.participant.models.CommunicationRecipient;
import com.enrollnow.participant.repositories.CommunicationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
public class NotificationEmailDeliveryService {

    private static final Logger log = LoggerFactory.getLogger(NotificationEmailDeliveryService.class);

    private final InvitationEmailService invitationEmailService;
    private final CommunicationRepository communicationRepository;

    @Autowired
    public NotificationEmailDeliveryService(
            InvitationEmailService invitationEmailService,
            @Autowired(required = false) CommunicationRepository communicationRepository) {
        this.invitationEmailService = invitationEmailService;
        this.communicationRepository = communicationRepository;
    }

    public boolean sendEmail(
            UUID tenantId,
            UUID studyId,
            UUID participantId,
            String recipientEmail,
            String subject,
            String htmlBody,
            String templateId) {

        log.info("Sending notification email to {} [subject: {}, template: {}]", recipientEmail, subject, templateId);

        boolean delivered = false;
        try {
            invitationEmailService.sendParticipantEmail(
                    List.of(recipientEmail),
                    Collections.emptyList(),
                    Collections.emptyList(),
                    null,
                    subject,
                    htmlBody,
                    true,
                    Collections.emptyList()
            );
            delivered = true;
        } catch (Exception e) {
            log.warn("Direct delivery through Graph API failed: {}. Logging notification locally.", e.getMessage());
            delivered = false;
        }

        // Record communication audit log if repository available
        if (communicationRepository != null && tenantId != null) {
            try {
                Communication communication = new Communication();
                communication.setTenantId(tenantId);
                communication.setStudyId(studyId);
                communication.setParticipantId(participantId);
                communication.setChannel("EMAIL");
                communication.setDirection("OUTBOUND");
                communication.setSubjectSnapshot(subject);
                communication.setBodySnapshot(htmlBody);
                communication.setStatus(delivered ? "SENT" : "FAILED");
                communication.setSentAt(OffsetDateTime.now());

                CommunicationRecipient recipient = new CommunicationRecipient();
                recipient.setTenantId(tenantId);
                recipient.setRecipientType("USER");
                recipient.setRecipientValue(recipientEmail);
                recipient.setActive(true);
                recipient.setCreatedAt(OffsetDateTime.now());
                communication.addRecipient(recipient);

                communicationRepository.save(communication);
            } catch (Exception ex) {
                log.warn("Could not persist communication log: {}", ex.getMessage());
            }
        }

        return delivered;
    }
}
