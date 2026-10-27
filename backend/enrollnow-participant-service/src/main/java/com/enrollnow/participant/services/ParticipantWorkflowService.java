package com.enrollnow.participant.services;

import com.enrollnow.identity.models.AuditEvent;
import com.enrollnow.identity.repositories.AuditEventRepository;
import com.enrollnow.participant.dtos.*;
import com.enrollnow.participant.models.*;
import com.enrollnow.participant.repositories.*;
import com.enrollnow.study.models.Study;
import com.enrollnow.study.repositories.StudyRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ParticipantWorkflowService {

    private static final Logger log = LoggerFactory.getLogger(ParticipantWorkflowService.class);

    private final ParticipantRepository participantRepository;
    private final ParticipantCommentRepository commentRepository;
    private final CommunicationRepository communicationRepository;
    private final CommunicationRecipientRepository recipientRepository;
    private final ParticipantContactRepository contactRepository;
    private final ParticipantAddressRepository addressRepository;
    private final ConsentRecordRepository consentRecordRepository;
    private final ConsentVersionRepository consentVersionRepository;
    private final SurveyAssignmentRepository surveyAssignmentRepository;
    private final SurveyDefinitionRepository surveyDefinitionRepository;
    private final StudyRepository studyRepository;
    private final AuditEventRepository auditEventRepository;

    public ParticipantWorkflowService(
            ParticipantRepository participantRepository,
            ParticipantCommentRepository commentRepository,
            CommunicationRepository communicationRepository,
            CommunicationRecipientRepository recipientRepository,
            ParticipantContactRepository contactRepository,
            ParticipantAddressRepository addressRepository,
            ConsentRecordRepository consentRecordRepository,
            ConsentVersionRepository consentVersionRepository,
            SurveyAssignmentRepository surveyAssignmentRepository,
            SurveyDefinitionRepository surveyDefinitionRepository,
            StudyRepository studyRepository,
            AuditEventRepository auditEventRepository
    ) {
        this.participantRepository = participantRepository;
        this.commentRepository = commentRepository;
        this.communicationRepository = communicationRepository;
        this.recipientRepository = recipientRepository;
        this.contactRepository = contactRepository;
        this.addressRepository = addressRepository;
        this.consentRecordRepository = consentRecordRepository;
        this.consentVersionRepository = consentVersionRepository;
        this.surveyAssignmentRepository = surveyAssignmentRepository;
        this.surveyDefinitionRepository = surveyDefinitionRepository;
        this.studyRepository = studyRepository;
        this.auditEventRepository = auditEventRepository;
    }

    // =========================================================================
    // 1. PARTICIPANT COMMENTS
    // =========================================================================

    @Transactional(readOnly = true)
    public List<ParticipantCommentDto> getComments(UUID tenantId, UUID participantId) {
        verifyParticipantExists(tenantId, participantId);
        return commentRepository.findByTenantIdAndParticipantIdOrderByPinnedDescCreatedAtDesc(tenantId, participantId)
                .stream()
                .map(this::mapCommentToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ParticipantCommentDto createComment(UUID tenantId, UUID participantId, UUID userId, String userName, CreateCommentRequest request) {
        verifyParticipantExists(tenantId, participantId);

        ParticipantComment comment = new ParticipantComment();
        comment.setTenantId(tenantId);
        comment.setParticipantId(participantId);
        comment.setStudyId(resolveStudyId(tenantId, request.getStudyId(), request.getStudyIdentifier()));
        comment.setText(request.getText().trim());
        comment.setPinned(request.isPinned());
        comment.setGlobal(request.isGlobal());
        comment.setAuthorId(userId);
        comment.setAuthorName(userName != null && !userName.isBlank() ? userName : "Current User");
        comment.setCreatedBy(userId);
        comment.setUpdatedBy(userId);
        comment.setCreatedAt(OffsetDateTime.now());
        comment.setUpdatedAt(OffsetDateTime.now());

        ParticipantComment saved = commentRepository.save(comment);
        recordAudit(tenantId, userId, "PARTICIPANT_COMMENT_CREATED", "ParticipantComment", saved.getId(), "Created comment on participant " + participantId);

        return mapCommentToDto(saved);
    }

    @Transactional
    public ParticipantCommentDto updateComment(UUID tenantId, UUID participantId, UUID commentId, UUID userId, UpdateCommentRequest request) {
        ParticipantComment comment = commentRepository.findByTenantIdAndParticipantIdAndId(tenantId, participantId, commentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));

        if (request.getText() != null) {
            comment.setText(request.getText().trim());
        }
        if (request.getPinned() != null) {
            comment.setPinned(request.getPinned());
        }
        comment.setUpdatedBy(userId);
        comment.setUpdatedAt(OffsetDateTime.now());

        ParticipantComment saved = commentRepository.save(comment);
        recordAudit(tenantId, userId, "PARTICIPANT_COMMENT_UPDATED", "ParticipantComment", saved.getId(), "Updated comment on participant " + participantId);

        return mapCommentToDto(saved);
    }

    @Transactional
    public ParticipantCommentDto pinComment(UUID tenantId, UUID participantId, UUID commentId, UUID userId, boolean pinned) {
        ParticipantComment comment = commentRepository.findByTenantIdAndParticipantIdAndId(tenantId, participantId, commentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));

        comment.setPinned(pinned);
        comment.setUpdatedBy(userId);
        comment.setUpdatedAt(OffsetDateTime.now());

        ParticipantComment saved = commentRepository.save(comment);
        return mapCommentToDto(saved);
    }

    @Transactional
    public void deleteComment(UUID tenantId, UUID participantId, UUID commentId, UUID userId) {
        ParticipantComment comment = commentRepository.findByTenantIdAndParticipantIdAndId(tenantId, participantId, commentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));

        commentRepository.delete(comment);
        recordAudit(tenantId, userId, "PARTICIPANT_COMMENT_DELETED", "ParticipantComment", commentId, "Deleted comment on participant " + participantId);
    }

    private ParticipantCommentDto mapCommentToDto(ParticipantComment comment) {
        ParticipantCommentDto dto = new ParticipantCommentDto();
        dto.setId(comment.getId());
        dto.setParticipantId(comment.getParticipantId());
        dto.setStudyId(comment.getStudyId());
        dto.setText(comment.getText());
        dto.setPinned(comment.isPinned());
        dto.setGlobal(comment.isGlobal());
        dto.setAuthorId(comment.getAuthorId());
        dto.setAuthorName(comment.getAuthorName());
        dto.setCreatedAt(comment.getCreatedAt());
        dto.setUpdatedAt(comment.getUpdatedAt());
        return dto;
    }

    // =========================================================================
    // 2. COMMUNICATIONS (EMAIL & SMS)
    // =========================================================================

    @Transactional(readOnly = true)
    public List<CommunicationDto> getEmails(UUID tenantId, UUID participantId) {
        verifyParticipantExists(tenantId, participantId);
        List<Communication> list = communicationRepository.findByTenantIdAndParticipantIdAndChannelOrderByPinnedDescCreatedAtDesc(
                tenantId, participantId, "EMAIL");

        return list.stream().map(this::mapCommunicationToDto).collect(Collectors.toList());
    }

    @Transactional
    public CommunicationDto sendEmail(UUID tenantId, UUID participantId, UUID userId, String userName, SendEmailRequest request) {
        verifyParticipantExists(tenantId, participantId);

        if (request.getTo() == null || request.getTo().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one recipient (To) is required");
        }

        Communication comm = new Communication();
        comm.setTenantId(tenantId);
        comm.setParticipantId(participantId);
        comm.setStudyId(resolveStudyId(tenantId, request.getStudyId(), request.getStudyIdentifier()));
        comm.setChannel("EMAIL");
        comm.setDirection("OUTBOUND");
        comm.setSubjectSnapshot(request.getSubject().trim());
        comm.setBodySnapshot(request.getBody().trim());
        comm.setStatus("SENT");
        comm.setInitiatedByUserId(userId);
        comm.setPinned(request.isPinned());
        comm.setCreatedAt(OffsetDateTime.now());
        comm.setSentAt(OffsetDateTime.now());
        comm.setCompletedAt(OffsetDateTime.now());

        // Add recipients
        for (String to : request.getTo()) {
            if (to != null && !to.isBlank()) {
                CommunicationRecipient r = new CommunicationRecipient();
                r.setTenantId(tenantId);
                r.setParticipantId(participantId);
                r.setRecipientType("TO");
                r.setRecipientValue(to.trim());
                comm.addRecipient(r);
            }
        }
        if (request.getCc() != null) {
            for (String cc : request.getCc()) {
                if (cc != null && !cc.isBlank()) {
                    CommunicationRecipient r = new CommunicationRecipient();
                    r.setTenantId(tenantId);
                    r.setParticipantId(participantId);
                    r.setRecipientType("CC");
                    r.setRecipientValue(cc.trim());
                    comm.addRecipient(r);
                }
            }
        }
        if (request.getBcc() != null) {
            for (String bcc : request.getBcc()) {
                if (bcc != null && !bcc.isBlank()) {
                    CommunicationRecipient r = new CommunicationRecipient();
                    r.setTenantId(tenantId);
                    r.setParticipantId(participantId);
                    r.setRecipientType("BCC");
                    r.setRecipientValue(bcc.trim());
                    comm.addRecipient(r);
                }
            }
        }

        Communication saved = communicationRepository.save(comm);
        recordAudit(tenantId, userId, "EMAIL_SENT", "Communication", saved.getId(), "Sent email to participant " + participantId);

        return mapCommunicationToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<CommunicationDto> getSms(UUID tenantId, UUID participantId) {
        verifyParticipantExists(tenantId, participantId);
        List<Communication> list = communicationRepository.findByTenantIdAndParticipantIdAndChannelOrderByPinnedDescCreatedAtDesc(
                tenantId, participantId, "SMS");

        return list.stream().map(this::mapCommunicationToDto).collect(Collectors.toList());
    }

    @Transactional
    public CommunicationDto sendSms(UUID tenantId, UUID participantId, UUID userId, String userName, SendSmsRequest request) {
        verifyParticipantExists(tenantId, participantId);

        Communication comm = new Communication();
        comm.setTenantId(tenantId);
        comm.setParticipantId(participantId);
        comm.setStudyId(resolveStudyId(tenantId, request.getStudyId(), request.getStudyIdentifier()));
        comm.setChannel("SMS");
        comm.setDirection("OUTBOUND");
        comm.setSubjectSnapshot("SMS to " + request.getToPhone().trim());
        comm.setBodySnapshot(request.getBody().trim());
        comm.setStatus("SENT");
        comm.setInitiatedByUserId(userId);
        comm.setCreatedAt(OffsetDateTime.now());
        comm.setSentAt(OffsetDateTime.now());
        comm.setCompletedAt(OffsetDateTime.now());

        CommunicationRecipient r = new CommunicationRecipient();
        r.setTenantId(tenantId);
        r.setParticipantId(participantId);
        r.setRecipientType("TO");
        r.setRecipientValue(request.getToPhone().trim());
        comm.addRecipient(r);

        Communication saved = communicationRepository.save(comm);
        recordAudit(tenantId, userId, "SMS_SENT", "Communication", saved.getId(), "Sent SMS to " + request.getToPhone());

        return mapCommunicationToDto(saved);
    }

    @Transactional
    public CommunicationDto pinCommunication(UUID tenantId, UUID participantId, UUID commId, UUID userId, boolean pinned) {
        Communication comm = communicationRepository.findByTenantIdAndParticipantIdAndId(tenantId, participantId, commId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Communication record not found"));

        comm.setPinned(pinned);
        Communication saved = communicationRepository.save(comm);
        return mapCommunicationToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<String> getEmailRecipients(UUID tenantId, UUID participantId) {
        Participant p = participantRepository.findByTenantIdAndId(tenantId, participantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Participant not found"));

        Set<String> emails = new LinkedHashSet<>();
        // Fetch all email contacts
        List<ParticipantContact> contacts = contactRepository.findByTenantIdAndParticipantId(tenantId, participantId);
        for (ParticipantContact c : contacts) {
            if ("EMAIL".equalsIgnoreCase(c.getContactType()) && c.getContactValue() != null && !c.getContactValue().isBlank()) {
                emails.add(c.getContactValue().trim());
            }
        }
        return new ArrayList<>(emails);
    }

    @Transactional(readOnly = true)
    public List<String> getSmsRecipients(UUID tenantId, UUID participantId) {
        Participant p = participantRepository.findByTenantIdAndId(tenantId, participantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Participant not found"));

        Set<String> phones = new LinkedHashSet<>();
        List<ParticipantContact> contacts = contactRepository.findByTenantIdAndParticipantId(tenantId, participantId);
        for (ParticipantContact c : contacts) {
            if (("PHONE".equalsIgnoreCase(c.getContactType()) || "SMS".equalsIgnoreCase(c.getContactType()))
                    && c.getContactValue() != null && !c.getContactValue().isBlank()) {
                phones.add(c.getContactValue().trim());
            }
        }
        return new ArrayList<>(phones);
    }

    private CommunicationDto mapCommunicationToDto(Communication comm) {
        CommunicationDto dto = new CommunicationDto();
        dto.setId(comm.getId());
        dto.setParticipantId(comm.getParticipantId());
        dto.setStudyId(comm.getStudyId());
        dto.setChannel(comm.getChannel());
        dto.setDirection(comm.getDirection());
        dto.setSubject(comm.getSubjectSnapshot());
        dto.setBody(comm.getBodySnapshot());
        dto.setStatus(comm.getStatus());
        dto.setSentAt(comm.getSentAt() != null ? comm.getSentAt() : comm.getCreatedAt());
        dto.setPinned(comm.isPinned());

        List<RecipientDto> rDtos = new ArrayList<>();
        if (comm.getRecipients() != null) {
            for (CommunicationRecipient r : comm.getRecipients()) {
                rDtos.add(new RecipientDto(r.getId(), r.getRecipientType(), r.getRecipientName(), r.getRecipientValue()));
            }
        }
        dto.setRecipients(rDtos);
        return dto;
    }

    // =========================================================================
    // 3. CONTACT MANAGEMENT (CONTACT PERSONS & ADDRESSES)
    // =========================================================================

    @Transactional(readOnly = true)
    public List<ParticipantContactDto> getContacts(UUID tenantId, UUID participantId) {
        verifyParticipantExists(tenantId, participantId);
        return contactRepository.findByTenantIdAndParticipantIdOrderByPrimaryContactDescCreatedAtDesc(tenantId, participantId)
                .stream()
                .map(this::mapContactToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ParticipantContactDto createContact(UUID tenantId, UUID participantId, UUID userId, CreateContactPersonRequest request) {
        verifyParticipantExists(tenantId, participantId);

        ParticipantContact contact = new ParticipantContact();
        contact.setTenantId(tenantId);
        contact.setParticipantId(participantId);
        contact.setContactType(request.getContactType().toUpperCase());
        contact.setContactValue(request.getContactValue().trim());
        contact.setLabel(request.getLabel());
        contact.setContactName(request.getContactName());
        contact.setRelationship(request.getRelationship());
        contact.setCanLeaveMessage(request.isCanLeaveMessage());
        contact.setNotes(request.getNotes());
        contact.setPrimaryContact(request.isPrimaryContact());
        contact.setPreferred(request.isPreferred());
        contact.setActive(true);
        contact.setCreatedBy(userId);
        contact.setUpdatedBy(userId);
        contact.setCreatedAt(OffsetDateTime.now());
        contact.setUpdatedAt(OffsetDateTime.now());

        ParticipantContact saved = contactRepository.save(contact);
        recordAudit(tenantId, userId, "PARTICIPANT_CONTACT_CREATED", "ParticipantContact", saved.getId(), "Created contact on participant " + participantId);

        return mapContactToDto(saved);
    }

    @Transactional
    public void deleteContact(UUID tenantId, UUID participantId, UUID contactId, UUID userId) {
        ParticipantContact contact = contactRepository.findByTenantIdAndParticipantIdAndId(tenantId, participantId, contactId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contact method not found"));

        contactRepository.delete(contact);
        recordAudit(tenantId, userId, "PARTICIPANT_CONTACT_DELETED", "ParticipantContact", contactId, "Deleted contact on participant " + participantId);
    }

    private ParticipantContactDto mapContactToDto(ParticipantContact c) {
        ParticipantContactDto dto = new ParticipantContactDto();
        dto.setId(c.getId());
        dto.setParticipantId(c.getParticipantId());
        dto.setContactType(c.getContactType());
        dto.setContactValue(c.getContactValue());
        dto.setLabel(c.getLabel());
        dto.setContactName(c.getContactName());
        dto.setRelationship(c.getRelationship());
        dto.setCanLeaveMessage(c.isCanLeaveMessage());
        dto.setNotes(c.getNotes());
        dto.setPrimaryContact(c.isPrimaryContact());
        dto.setPreferred(c.isPreferred());
        dto.setActive(c.isActive());
        dto.setCreatedAt(c.getCreatedAt());
        return dto;
    }

    @Transactional(readOnly = true)
    public List<ParticipantAddressDto> getAddresses(UUID tenantId, UUID participantId) {
        verifyParticipantExists(tenantId, participantId);
        return addressRepository.findByTenantIdAndParticipantIdOrderByPrimaryAddressDescCreatedAtDesc(tenantId, participantId)
                .stream()
                .map(this::mapAddressToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ParticipantAddressDto createAddress(UUID tenantId, UUID participantId, UUID userId, CreateAddressRequest request) {
        verifyParticipantExists(tenantId, participantId);

        ParticipantAddress address = new ParticipantAddress();
        address.setTenantId(tenantId);
        address.setParticipantId(participantId);
        address.setAddressType(request.getAddressType() != null ? request.getAddressType().toUpperCase() : "HOME");
        address.setAddressLine1(request.getAddressLine1());
        address.setAddressLine2(request.getAddressLine2());
        address.setCity(request.getCity());
        address.setStateRegion(request.getStateRegion());
        address.setPostalCode(request.getPostalCode());
        address.setCountryCode(request.getCountryCode() != null ? request.getCountryCode() : "USA");
        address.setPrimaryAddress(request.isPrimaryAddress());
        address.setActive(true);
        address.setCreatedBy(userId);
        address.setUpdatedBy(userId);
        address.setCreatedAt(OffsetDateTime.now());
        address.setUpdatedAt(OffsetDateTime.now());

        ParticipantAddress saved = addressRepository.save(address);
        recordAudit(tenantId, userId, "PARTICIPANT_ADDRESS_CREATED", "ParticipantAddress", saved.getId(), "Created address on participant " + participantId);

        return mapAddressToDto(saved);
    }

    @Transactional
    public void deleteAddress(UUID tenantId, UUID participantId, UUID addressId, UUID userId) {
        ParticipantAddress address = addressRepository.findByTenantIdAndParticipantIdAndId(tenantId, participantId, addressId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Address not found"));

        addressRepository.delete(address);
        recordAudit(tenantId, userId, "PARTICIPANT_ADDRESS_DELETED", "ParticipantAddress", addressId, "Deleted address on participant " + participantId);
    }

    private ParticipantAddressDto mapAddressToDto(ParticipantAddress a) {
        ParticipantAddressDto dto = new ParticipantAddressDto();
        dto.setId(a.getId());
        dto.setParticipantId(a.getParticipantId());
        dto.setAddressType(a.getAddressType());
        dto.setAddressLine1(a.getAddressLine1());
        dto.setAddressLine2(a.getAddressLine2());
        dto.setCity(a.getCity());
        dto.setStateRegion(a.getStateRegion());
        dto.setPostalCode(a.getPostalCode());
        dto.setCountryCode(a.getCountryCode());
        dto.setPrimaryAddress(a.isPrimaryAddress());
        dto.setActive(a.isActive());
        dto.setCreatedAt(a.getCreatedAt());
        return dto;
    }

    // =========================================================================
    // 4. CONSENT MANAGEMENT
    // =========================================================================

    @Transactional(readOnly = true)
    public List<ConsentDto> getConsents(UUID tenantId, UUID participantId) {
        verifyParticipantExists(tenantId, participantId);
        List<ConsentRecord> records = consentRecordRepository.findByTenantIdAndParticipantIdOrderByCreatedAtDesc(tenantId, participantId);
        return records.stream().map(c -> {
            ConsentDto dto = new ConsentDto();
            dto.setId(c.getId());
            dto.setParticipantId(c.getParticipantId());
            dto.setStudyId(c.getStudyId());
            dto.setConsentVersionId(c.getConsentVersionId());
            dto.setStatus(c.getStatus());
            dto.setConsentedAt(c.getConsentedAt());
            dto.setConsentMethod(c.getConsentMethod());
            dto.setWithdrawalReason(c.getWithdrawalReason());
            dto.setCreatedAt(c.getCreatedAt());

            // Study Name
            studyRepository.findByTenantIdAndId(tenantId, c.getStudyId())
                    .ifPresent(s -> dto.setStudyName(s.getName()));

            // Consent Version Title
            consentVersionRepository.findByTenantIdAndId(tenantId, c.getConsentVersionId())
                    .ifPresent(v -> {
                        dto.setConsentVersionTitle(v.getTitle());
                        dto.setVersionNumber(v.getVersionNumber());
                    });

            return dto;
        }).collect(Collectors.toList());
    }

    @Transactional
    public ConsentDto recordConsent(UUID tenantId, UUID participantId, UUID userId, String userName, RecordConsentRequest request) {
        verifyParticipantExists(tenantId, participantId);

        ConsentRecord record = new ConsentRecord();
        record.setTenantId(tenantId);
        record.setParticipantId(participantId);
        record.setStudyId(resolveStudyId(tenantId, request.getStudyId(), request.getStudyIdentifier()));
        record.setConsentVersionId(request.getConsentVersionId());
        record.setStatus(request.getStatus() != null ? request.getStatus().toUpperCase() : "CONSENTED");
        record.setConsentedAt(request.getConsentDate() != null ? request.getConsentDate() : OffsetDateTime.now());
        record.setConsentedByUserId(userId);
        record.setConsentMethod(request.getConsentMethod() != null ? request.getConsentMethod() : "ELECTRONIC");
        record.setWithdrawalReason(request.getWithdrawalReason());
        record.setActive(true);
        record.setCreatedBy(userId);
        record.setUpdatedBy(userId);
        record.setCreatedAt(OffsetDateTime.now());
        record.setUpdatedAt(OffsetDateTime.now());

        ConsentRecord saved = consentRecordRepository.save(record);
        recordAudit(tenantId, userId, "CONSENT_RECORDED", "ConsentRecord", saved.getId(), "Recorded consent status " + saved.getStatus() + " for participant " + participantId);

        ConsentDto dto = new ConsentDto();
        dto.setId(saved.getId());
        dto.setParticipantId(saved.getParticipantId());
        dto.setStudyId(saved.getStudyId());
        dto.setConsentVersionId(saved.getConsentVersionId());
        dto.setStatus(saved.getStatus());
        dto.setConsentedAt(saved.getConsentedAt());
        dto.setConsentMethod(saved.getConsentMethod());
        dto.setCreatedAt(saved.getCreatedAt());

        studyRepository.findByTenantIdAndId(tenantId, saved.getStudyId())
                .ifPresent(s -> dto.setStudyName(s.getName()));
        consentVersionRepository.findByTenantIdAndId(tenantId, saved.getConsentVersionId())
                .ifPresent(v -> {
                    dto.setConsentVersionTitle(v.getTitle());
                    dto.setVersionNumber(v.getVersionNumber());
                });

        return dto;
    }

    @Transactional(readOnly = true)
    public List<ConsentOptionDto> getConsentOptions(UUID tenantId, UUID participantId) {
        List<ConsentVersion> versions = consentVersionRepository.findByTenantIdAndActiveTrue(tenantId);
        return versions.stream().map(v -> {
            String studyName = studyRepository.findByTenantIdAndId(tenantId, v.getStudyId())
                    .map(Study::getName)
                    .orElse("General Registry");
            return new ConsentOptionDto(v.getStudyId(), studyName, v.getId(), v.getTitle(), v.getVersionNumber());
        }).collect(Collectors.toList());
    }

    // =========================================================================
    // 5. FORMS & SURVEY ASSIGNMENTS
    // =========================================================================

    @Transactional(readOnly = true)
    public List<SurveyAssignmentDto> getSurveyAssignments(UUID tenantId, UUID participantId) {
        verifyParticipantExists(tenantId, participantId);
        List<SurveyAssignment> assignments = surveyAssignmentRepository.findByTenantIdAndParticipantIdOrderByAssignedAtDesc(tenantId, participantId);

        return assignments.stream().map(a -> {
            SurveyAssignmentDto dto = new SurveyAssignmentDto();
            dto.setId(a.getId());
            dto.setParticipantId(a.getParticipantId());
            dto.setStudyId(a.getStudyId());
            dto.setSurveyVersionId(a.getSurveyVersionId());
            dto.setStatus(a.getStatus());
            dto.setAssignedAt(a.getAssignedAt());
            dto.setDueAt(a.getDueAt());
            dto.setCompletedAt(a.getCompletedAt());

            if (a.getStudyId() != null) {
                studyRepository.findByTenantIdAndId(tenantId, a.getStudyId())
                        .ifPresent(s -> dto.setStudyName(s.getName()));
            }

            // Survey details
            surveyDefinitionRepository.findByTenantIdAndId(tenantId, a.getSurveyVersionId())
                    .ifPresent(def -> {
                        dto.setSurveyCode(def.getCode());
                        dto.setSurveyName(def.getName());
                    });

            if (dto.getSurveyName() == null) {
                dto.setSurveyName("Intake Screening Form");
                dto.setSurveyCode("FORM-001");
            }

            return dto;
        }).collect(Collectors.toList());
    }

    @Transactional
    public SurveyAssignmentDto assignSurvey(UUID tenantId, UUID participantId, UUID userId, AssignSurveyRequest request) {
        verifyParticipantExists(tenantId, participantId);

        SurveyAssignment assignment = new SurveyAssignment();
        assignment.setTenantId(tenantId);
        assignment.setParticipantId(participantId);
        assignment.setStudyId(resolveStudyId(tenantId, request.getStudyId(), request.getStudyIdentifier()));
        assignment.setSurveyVersionId(request.getSurveyDefinitionId());
        assignment.setStatus("ASSIGNED");
        assignment.setAssignedByUserId(userId);
        assignment.setAssignedAt(OffsetDateTime.now());
        assignment.setDueAt(request.getDueAt());
        assignment.setActive(true);
        assignment.setCreatedAt(OffsetDateTime.now());

        SurveyAssignment saved = surveyAssignmentRepository.save(assignment);
        recordAudit(tenantId, userId, "SURVEY_ASSIGNED", "SurveyAssignment", saved.getId(), "Assigned survey to participant " + participantId);

        SurveyAssignmentDto dto = new SurveyAssignmentDto();
        dto.setId(saved.getId());
        dto.setParticipantId(saved.getParticipantId());
        dto.setStudyId(saved.getStudyId());
        dto.setSurveyVersionId(saved.getSurveyVersionId());
        dto.setStatus(saved.getStatus());
        dto.setAssignedAt(saved.getAssignedAt());
        dto.setDueAt(saved.getDueAt());

        surveyDefinitionRepository.findByTenantIdAndId(tenantId, saved.getSurveyVersionId())
                .ifPresent(def -> {
                    dto.setSurveyCode(def.getCode());
                    dto.setSurveyName(def.getName());
                });
        if (dto.getSurveyName() == null) {
            dto.setSurveyName("General Intake Assessment");
        }

        return dto;
    }

    @Transactional
    public SurveyAssignmentDto updateSurveyStatus(UUID tenantId, UUID participantId, UUID assignmentId, String status) {
        SurveyAssignment assignment = surveyAssignmentRepository.findByTenantIdAndParticipantIdAndId(tenantId, participantId, assignmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Survey assignment not found"));

        assignment.setStatus(status.toUpperCase());
        if ("COMPLETED".equalsIgnoreCase(status)) {
            assignment.setCompletedAt(OffsetDateTime.now());
        }
        SurveyAssignment saved = surveyAssignmentRepository.save(assignment);

        SurveyAssignmentDto dto = new SurveyAssignmentDto();
        dto.setId(saved.getId());
        dto.setParticipantId(saved.getParticipantId());
        dto.setStudyId(saved.getStudyId());
        dto.setStatus(saved.getStatus());
        dto.setAssignedAt(saved.getAssignedAt());
        dto.setCompletedAt(saved.getCompletedAt());
        return dto;
    }

    @Transactional(readOnly = true)
    public List<SurveyOptionDto> getAvailableSurveys(UUID tenantId, UUID participantId) {
        List<SurveyDefinition> list = surveyDefinitionRepository.findByTenantIdAndActiveTrue(tenantId);
        return list.stream()
                .map(def -> new SurveyOptionDto(def.getId(), def.getCode(), def.getName(), def.getDescription()))
                .collect(Collectors.toList());
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    private UUID resolveStudyId(UUID tenantId, UUID studyId, String studyIdentifier) {
        if (studyId != null) {
            return studyRepository.findByTenantIdAndId(tenantId, studyId)
                    .map(Study::getId)
                    .orElse(studyId);
        }
        if (studyIdentifier != null && !studyIdentifier.isBlank()) {
            try {
                UUID parsed = UUID.fromString(studyIdentifier.trim());
                return studyRepository.findByTenantIdAndId(tenantId, parsed)
                        .map(Study::getId)
                        .orElse(parsed);
            } catch (IllegalArgumentException ignored) {
                return studyRepository.findByTenantIdAndNameIgnoreCase(tenantId, studyIdentifier.trim())
                        .or(() -> studyRepository.findByTenantIdAndStudyCode(tenantId, studyIdentifier.trim()))
                        .map(Study::getId)
                        .orElse(null);
            }
        }
        return null;
    }

    private void verifyParticipantExists(UUID tenantId, UUID participantId) {
        if (participantRepository.findByTenantIdAndId(tenantId, participantId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Participant not found: " + participantId);
        }
    }

    private void recordAudit(UUID tenantId, UUID userId, String action, String entityType, UUID entityId, String description) {
        try {
            AuditEvent event = new AuditEvent();
            event.setTenantId(tenantId);
            event.setActorUserId(userId);
            event.setAction(action);
            event.setEntityType(entityType);
            event.setEntityId(entityId);
            event.setDescription(description);
            event.setSource("APPLICATION");
            event.setOccurredAt(OffsetDateTime.now());
            event.setCreatedAt(OffsetDateTime.now());
            auditEventRepository.save(event);
        } catch (Exception ex) {
            log.warn("Failed to record audit event for {}: {}", action, ex.getMessage());
        }
    }
}
