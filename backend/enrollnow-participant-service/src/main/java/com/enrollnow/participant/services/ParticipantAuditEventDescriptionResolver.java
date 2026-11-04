package com.enrollnow.participant.services;

import com.enrollnow.common.audit.AuditEventDescriptionResolver;
import com.enrollnow.participant.repositories.ParticipantRepository;
import org.springframework.stereotype.Component;

import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class ParticipantAuditEventDescriptionResolver implements AuditEventDescriptionResolver {

    private static final Pattern PARTICIPANT_UUID_PATTERN = Pattern.compile(
            "(?i)(\\bparticipant\\s+)([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\\b");

    private final ParticipantRepository participantRepository;

    public ParticipantAuditEventDescriptionResolver(ParticipantRepository participantRepository) {
        this.participantRepository = participantRepository;
    }

    @Override
    public String resolveDescription(UUID tenantId, String description) {
        if (description == null || description.isBlank()) {
            return null;
        }

        Matcher matcher = PARTICIPANT_UUID_PATTERN.matcher(description);
        StringBuffer resolved = new StringBuffer();
        boolean changed = false;
        while (matcher.find()) {
            UUID participantId = UUID.fromString(matcher.group(2));
            String name = participantRepository.findByTenantIdAndId(tenantId, participantId)
                    .map(ParticipantAuditDescription::formatParticipantName)
                    .filter(value -> !value.isBlank())
                    .orElse(null);
            if (name == null) {
                matcher.appendReplacement(resolved, Matcher.quoteReplacement(matcher.group()));
                continue;
            }
            matcher.appendReplacement(
                    resolved,
                    Matcher.quoteReplacement(matcher.group(1) + name));
            changed = true;
        }
        matcher.appendTail(resolved);
        return changed ? resolved.toString() : null;
    }
}
