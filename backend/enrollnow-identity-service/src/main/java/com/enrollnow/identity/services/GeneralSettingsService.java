package com.enrollnow.identity.services;

import com.enrollnow.identity.dtos.GeneralSettingsDto;
import com.enrollnow.identity.models.GeneralSettings;
import com.enrollnow.identity.repositories.GeneralSettingsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
public class GeneralSettingsService {

    public static final String DEFAULT_TEXT_REPLY =
            "This is an automated message. We can not receive replies to this number.";

    private final GeneralSettingsRepository generalSettingsRepository;
    private final SiteAuthorizationService siteAuthorizationService;

    public GeneralSettingsService(
            GeneralSettingsRepository generalSettingsRepository,
            SiteAuthorizationService siteAuthorizationService) {
        this.generalSettingsRepository = generalSettingsRepository;
        this.siteAuthorizationService = siteAuthorizationService;
    }

    @Transactional
    public GeneralSettingsDto getGeneralSettings(UUID tenantId) {
        siteAuthorizationService.requireTenantMatch(tenantId);
        siteAuthorizationService.requireGeneralSettingsView(tenantId);

        GeneralSettings settings = generalSettingsRepository.findByTenantId(tenantId)
                .orElseGet(() -> createDefaultSettings(tenantId, null));

        return toDto(settings);
    }

    @Transactional
    public GeneralSettingsDto updateGeneralSettings(UUID tenantId, GeneralSettingsDto dto) {
        siteAuthorizationService.requireTenantMatch(tenantId);
        siteAuthorizationService.requireGeneralSettingsManage(tenantId);

        if (dto == null || dto.getDefaultTextReply() == null || dto.getDefaultTextReply().trim().isEmpty()) {
            throw new IllegalArgumentException("Default message response cannot be blank");
        }

        String trimmed = dto.getDefaultTextReply().trim();
        if (trimmed.length() > 160) {
            throw new IllegalArgumentException("Default text reply cannot exceed 160 characters");
        }

        GeneralSettings settings = generalSettingsRepository.findByTenantId(tenantId)
                .orElseGet(() -> createDefaultSettings(tenantId, null));

        UUID callerUserId = siteAuthorizationService.getAuthenticatedCaller()
                .map(SiteAuthorizationService.CallerIdentity::userId)
                .orElse(null);

        settings.setDefaultTextReply(trimmed);
        settings.setUpdatedAt(OffsetDateTime.now());
        settings.setUpdatedBy(callerUserId);

        GeneralSettings saved = generalSettingsRepository.save(settings);
        return toDto(saved);
    }

    private GeneralSettings createDefaultSettings(UUID tenantId, UUID creatorUserId) {
        GeneralSettings settings = new GeneralSettings();
        settings.setTenantId(tenantId);
        settings.setDefaultTextReply(DEFAULT_TEXT_REPLY);
        settings.setCreatedBy(creatorUserId);
        settings.setUpdatedBy(creatorUserId);
        return generalSettingsRepository.save(settings);
    }

    private GeneralSettingsDto toDto(GeneralSettings entity) {
        return new GeneralSettingsDto(
                entity.getId(),
                entity.getTenantId(),
                entity.getDefaultTextReply(),
                entity.getUpdatedAt(),
                entity.getUpdatedBy()
        );
    }
}
