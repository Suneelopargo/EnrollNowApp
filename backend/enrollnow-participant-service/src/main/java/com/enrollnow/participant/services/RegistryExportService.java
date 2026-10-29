package com.enrollnow.participant.services;

import com.enrollnow.participant.dtos.RegistryParticipantDto;
import com.enrollnow.participant.dtos.ParticipantVariableDto;
import com.enrollnow.participant.dtos.StudyItemDto;
import com.enrollnow.participant.models.Communication;
import com.enrollnow.participant.models.ParticipantComment;
import com.enrollnow.participant.models.ParticipantContact;
import com.enrollnow.participant.models.ParticipantContactLog;
import com.enrollnow.participant.models.ConsentRecord;
import com.enrollnow.participant.models.ConsentVersion;
import com.enrollnow.participant.repositories.CommunicationRepository;
import com.enrollnow.participant.repositories.ParticipantCommentRepository;
import com.enrollnow.participant.repositories.ParticipantContactLogRepository;
import com.enrollnow.participant.repositories.ParticipantContactRepository;
import com.enrollnow.participant.repositories.ConsentRecordRepository;
import com.enrollnow.participant.repositories.ConsentVersionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Set;
import java.util.UUID;
import java.time.ZoneId;
import java.time.OffsetDateTime;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.util.stream.Collectors;

@Service
public class RegistryExportService {
    private final ParticipantCommentRepository commentRepository;
    private final ParticipantContactRepository contactRepository;
    private final ParticipantContactLogRepository contactLogRepository;
    private final CommunicationRepository communicationRepository;
    private final ConsentRecordRepository consentRecordRepository;
    private final ConsentVersionRepository consentVersionRepository;

    public RegistryExportService() {
        this(null, null, null, null, null, null);
    }

    @Autowired
    public RegistryExportService(
            ParticipantCommentRepository commentRepository,
            ParticipantContactRepository contactRepository,
            ParticipantContactLogRepository contactLogRepository,
            CommunicationRepository communicationRepository,
            ConsentRecordRepository consentRecordRepository,
            ConsentVersionRepository consentVersionRepository) {
        this.commentRepository = commentRepository;
        this.contactRepository = contactRepository;
        this.contactLogRepository = contactLogRepository;
        this.communicationRepository = communicationRepository;
        this.consentRecordRepository = consentRecordRepository;
        this.consentVersionRepository = consentVersionRepository;
    }

    private static final DateTimeFormatter LEGACY_DATE_TIME = new DateTimeFormatterBuilder()
            .parseCaseInsensitive().appendPattern("dd/MM/yyyy, hh:mm a").toFormatter(java.util.Locale.ENGLISH);
    private static final DateTimeFormatter EXPORT_DATE_TIME = DateTimeFormatter.ofPattern("dd/MM/yyyy, hh:mm a z", java.util.Locale.ENGLISH);

    public byte[] exportToCsv(List<RegistryParticipantDto> participants) {
        return exportToCsv(participants, null, null);
    }

    public byte[] exportToCsv(List<RegistryParticipantDto> participants, List<String> selectedFields, String timezone) {
        return exportToCsv(participants, selectedFields, timezone, null);
    }

    public byte[] exportToCsv(List<RegistryParticipantDto> participants, List<String> selectedFields, String timezone, UUID tenantId) {
        Map<String, String> labels = Map.ofEntries(
                Map.entry("id", "Participant ID"), Map.entry("name", "Name"),
                Map.entry("age", "Age"), Map.entry("status", "Status"),
                Map.entry("globalId", "Global ID"), Map.entry("firstName", "First Name"),
                Map.entry("middleName", "Middle Name"), Map.entry("lastName", "Last Name"),
                Map.entry("gender", "Gender"), Map.entry("demographics.dob", "Birthday"),
                Map.entry("demographics.race", "Race"), Map.entry("demographics.ethnicity", "Ethnicity"),
                Map.entry("familyId", "Family ID"),
                Map.entry("tags", "Tags"), Map.entry("dateCreated", "Date Created"),
                Map.entry("phone", "Phone"), Map.entry("contactMethods.primaryEmail", "Email"),
                Map.entry("contactMethods.address", "Address"), Map.entry("city", "City"),
                Map.entry("state", "State"), Map.entry("zipcode", "Zip Code"),
                Map.entry("studies", "Studies"), Map.entry("contactForFutureStudies", "Contact For Future Studies"),
                Map.entry("section.comments", "Comments Log"),
                Map.entry("section.contacts", "Participant Contacts"),
                Map.entry("section.contactLogs", "Contact Log"),
                Map.entry("section.emailLogs", "Email Log"),
                Map.entry("section.consentLogs", "Consent Log")
        );
        List<String> fields = selectedFields == null || selectedFields.isEmpty()
                ? List.of("id", "name", "firstName", "lastName", "age", "gender", "status", "phone", "city", "state", "zipcode", "studies", "contactForFutureStudies", "dateCreated")
                : selectedFields;
        ZoneId zone = timezone == null || timezone.isBlank() ? null : ZoneId.of(timezone);
        Map<String, Map<UUID, String>> sectionValues = loadGlobalSections(participants, fields, tenantId, zone);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (PrintWriter writer = new PrintWriter(out, true, StandardCharsets.UTF_8)) {
            writer.println(fields.stream().map(field -> escapeCsv(labels.getOrDefault(field,
                    field.startsWith("variables.") ? field.substring("variables.".length()) : field)))
                    .collect(Collectors.joining(",")));

            for (RegistryParticipantDto p : participants) {
                writer.println(fields.stream().map(field -> escapeCsv(valueFor(p, field, zone, sectionValues))).collect(Collectors.joining(",")));
            }
        }
        return out.toByteArray();
    }

    private String valueFor(RegistryParticipantDto p, String field, ZoneId zone, Map<String, Map<UUID, String>> sectionValues) {
        if (field.startsWith("section.")) {
            try {
                UUID participantId = UUID.fromString(p.getId());
                return sectionValues.getOrDefault(field, Map.of()).getOrDefault(participantId, "");
            } catch (IllegalArgumentException ignored) {
                return "";
            }
        }
        if (field.startsWith("variables.")) {
            String id = field.substring("variables.".length());
            if (p.getVariables() == null) return "";
            ParticipantVariableDto variable = p.getVariables().stream()
                    .filter(v -> id.equals(v.getId()) || id.equals(v.getName())).findFirst().orElse(null);
            if (variable == null || variable.getValue() == null) return "";
            if (zone != null && "dateTime".equalsIgnoreCase(variable.getType())) {
                return convertDateTime(variable.getValue(), zone);
            }
            return variable.getValue();
        }
        String value = switch (field) {
            case "id" -> p.getId(); case "name" -> p.getName(); case "globalId" -> p.getGlobalId();
            case "firstName" -> p.getFirstName(); case "middleName" -> p.getMiddleName(); case "lastName" -> p.getLastName();
            case "gender" -> p.getGender(); case "age" -> p.getAge(); case "status" -> p.getStatus();
            case "familyId" -> p.getFamilyId(); case "dateCreated" -> p.getDateCreated();
            case "phone" -> p.getPhone(); case "city" -> p.getCity(); case "state" -> p.getState(); case "zipcode" -> p.getZipcode();
            case "tags" -> p.getTags() == null ? "" : String.join("; ", p.getTags());
            case "studies" -> p.getStudies() == null ? "" : p.getStudies().stream().map(StudyItemDto::getName).collect(Collectors.joining("; "));
            case "contactForFutureStudies" -> p.getContactForFutureStudies() == null ? "" : (p.getContactForFutureStudies() ? "Yes" : "No");
            case "demographics.race" -> p.getDemographics() == null ? "" : p.getDemographics().getRace();
            case "demographics.ethnicity" -> p.getDemographics() == null ? "" : p.getDemographics().getEthnicity();
            case "demographics.dob" -> p.getDemographics() == null ? "" : p.getDemographics().getDob();
            case "contactMethods.primaryEmail" -> p.getContactMethods() == null ? "" : p.getContactMethods().getPrimaryEmail();
            case "contactMethods.address" -> p.getContactMethods() == null ? "" : p.getContactMethods().getAddress();
            default -> "";
        };
        if (zone != null && value != null && (field.equals("dateCreated") || field.equals("lastContact"))) {
            return convertDateTime(value, zone);
        }
        return value == null ? "" : value;
    }

    private Map<String, Map<UUID, String>> loadGlobalSections(
            List<RegistryParticipantDto> participants, List<String> fields, UUID tenantId, ZoneId zone) {
        Map<String, Map<UUID, String>> values = new HashMap<>();
        if (tenantId == null || participants.isEmpty()) return values;
        Set<String> requested = Set.copyOf(fields);
        List<UUID> participantIds = participants.stream().map(RegistryParticipantDto::getId)
                .filter(id -> id != null).map(id -> {
                    try { return UUID.fromString(id); } catch (IllegalArgumentException ignored) { return null; }
                }).filter(id -> id != null).distinct().toList();
        if (participantIds.isEmpty()) return values;

        if (requested.contains("section.comments") && commentRepository != null) {
            Map<UUID, List<String>> grouped = new LinkedHashMap<>();
            for (List<UUID> batch : batches(participantIds)) {
                for (ParticipantComment comment : commentRepository.findByTenantIdAndParticipantIdInAndGlobalTrueOrderByCreatedAtDesc(tenantId, batch)) {
                    grouped.computeIfAbsent(comment.getParticipantId(), ignored -> new ArrayList<>()).add(
                            formatDateTime(comment.getCreatedAt(), zone) + " — " + safe(comment.getAuthorName()) + ": " + safe(comment.getText()));
                }
            }
            values.put("section.comments", joinValues(grouped));
        }

        if (requested.contains("section.contacts") && contactRepository != null) {
            Map<UUID, List<String>> grouped = new LinkedHashMap<>();
            for (List<UUID> batch : batches(participantIds)) {
                for (ParticipantContact contact : contactRepository.findByTenantIdAndParticipantIdIn(tenantId, batch)) {
                    String label = contact.getLabel() == null || contact.getLabel().isBlank() ? contact.getContactType() : contact.getLabel();
                    String details = safe(label) + ": " + safe(contact.getContactValue());
                    if (contact.getContactName() != null && !contact.getContactName().isBlank()) details += " (" + contact.getContactName() + ")";
                    grouped.computeIfAbsent(contact.getParticipantId(), ignored -> new ArrayList<>()).add(details);
                }
            }
            values.put("section.contacts", joinValues(grouped));
        }

        if (requested.contains("section.contactLogs") && contactLogRepository != null) {
            Map<UUID, List<String>> grouped = new LinkedHashMap<>();
            for (List<UUID> batch : batches(participantIds)) {
                for (ParticipantContactLog log : contactLogRepository.findByTenantIdAndParticipantIdInAndGlobalTrueOrderByDateTimeOfContactDesc(tenantId, batch)) {
                    String details = formatDateTime(log.getDateTimeOfContact(), zone) + " — " + safe(log.getContactType())
                            + " / " + safe(log.getContactMethod()) + " — " + safe(log.getOutcome());
                    if (log.getComments() != null && !log.getComments().isBlank()) details += ": " + log.getComments();
                    grouped.computeIfAbsent(log.getParticipantId(), ignored -> new ArrayList<>()).add(details);
                }
            }
            values.put("section.contactLogs", joinValues(grouped));
        }

        if (requested.contains("section.emailLogs") && communicationRepository != null) {
            Map<UUID, List<String>> grouped = new LinkedHashMap<>();
            for (List<UUID> batch : batches(participantIds)) {
                for (Communication communication : communicationRepository
                        .findByTenantIdAndParticipantIdInAndStudyIdIsNullAndChannelIgnoreCaseOrderByCreatedAtDesc(tenantId, batch, "EMAIL")) {
                    String details = formatDateTime(communication.getSentAt() == null ? communication.getCreatedAt() : communication.getSentAt(), zone)
                            + " — " + safe(communication.getSubjectSnapshot()) + " — " + safe(communication.getStatus());
                    if (communication.getBodySnapshot() != null && !communication.getBodySnapshot().isBlank()) details += ": " + communication.getBodySnapshot();
                    grouped.computeIfAbsent(communication.getParticipantId(), ignored -> new ArrayList<>()).add(details);
                }
            }
            values.put("section.emailLogs", joinValues(grouped));
        }

        if (requested.contains("section.consentLogs") && consentRecordRepository != null) {
            Map<UUID, List<String>> grouped = new LinkedHashMap<>();
            List<ConsentRecord> records = consentRecordRepository.findByTenantIdAndParticipantIdInOrderByCreatedAtDesc(tenantId, participantIds);
            Map<UUID, String> versionTitles = new HashMap<>();
            if (consentVersionRepository != null) {
                List<UUID> versionIds = records.stream().map(ConsentRecord::getConsentVersionId)
                        .filter(java.util.Objects::nonNull).distinct().toList();
                for (ConsentVersion version : consentVersionRepository.findByTenantIdAndIdIn(tenantId, versionIds)) {
                    versionTitles.put(version.getId(), version.getTitle());
                }
            }
            for (ConsentRecord record : records) {
                String when = record.getConsentedAt() != null ? formatDateTime(record.getConsentedAt(), zone)
                        : record.getDeclinedAt() != null ? formatDateTime(record.getDeclinedAt(), zone)
                        : record.getWithdrawnAt() != null ? formatDateTime(record.getWithdrawnAt(), zone)
                        : formatDateTime(record.getCreatedAt(), zone);
                String title = versionTitles.getOrDefault(record.getConsentVersionId(), "Consent " + record.getConsentVersionId());
                String details = when + " — " + safe(title) + " — " + safe(record.getStatus());
                if (record.getConsentMethod() != null && !record.getConsentMethod().isBlank()) details += " — " + record.getConsentMethod();
                if (record.getWithdrawalReason() != null && !record.getWithdrawalReason().isBlank()) details += " — " + record.getWithdrawalReason();
                grouped.computeIfAbsent(record.getParticipantId(), ignored -> new ArrayList<>()).add(details);
            }
            values.put("section.consentLogs", joinValues(grouped));
        }
        return values;
    }

    private Map<UUID, String> joinValues(Map<UUID, List<String>> grouped) {
        Map<UUID, String> joined = new HashMap<>();
        grouped.forEach((participantId, entries) -> joined.put(participantId, String.join(" | ", entries)));
        return joined;
    }

    private List<List<UUID>> batches(List<UUID> values) {
        List<List<UUID>> batches = new ArrayList<>();
        for (int index = 0; index < values.size(); index += 500) {
            batches.add(values.subList(index, Math.min(index + 500, values.size())));
        }
        return batches;
    }

    private String formatDateTime(java.time.OffsetDateTime value, ZoneId zone) {
        if (value == null) return "";
        return zone == null ? value.format(EXPORT_DATE_TIME) : value.atZoneSameInstant(zone).format(EXPORT_DATE_TIME);
    }

    private String safe(String value) { return value == null ? "" : value; }

    private String convertDateTime(String value, ZoneId zone) {
        try { return OffsetDateTime.parse(value).atZoneSameInstant(zone).format(EXPORT_DATE_TIME); }
        catch (Exception ignored) {
            try { return LocalDateTime.parse(value).atZone(ZoneOffset.UTC).withZoneSameInstant(zone).format(EXPORT_DATE_TIME); }
            catch (Exception ignoredIsoLocalDateTime) {
                try { return LocalDateTime.parse(value, LEGACY_DATE_TIME).atZone(ZoneOffset.UTC).withZoneSameInstant(zone).format(EXPORT_DATE_TIME); }
                catch (Exception ignoredAgain) { return value; }
            }
        }
    }

    private String escapeCsv(String value) {
        if (value == null) {
            return "\"\"";
        }
        String sanitized = value;
        // Prevent CSV Formula Injection (CWE-1236) if cell value begins with dangerous characters
        if (sanitized.startsWith("=") || sanitized.startsWith("+") || sanitized.startsWith("-") || sanitized.startsWith("@") || sanitized.startsWith("\t")) {
            sanitized = "'" + sanitized;
        }
        String escaped = sanitized.replace("\"", "\"\"");
        return "\"" + escaped + "\"";
    }
}
