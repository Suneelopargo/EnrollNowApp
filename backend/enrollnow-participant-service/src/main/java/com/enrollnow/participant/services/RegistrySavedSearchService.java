package com.enrollnow.participant.services;

import com.enrollnow.participant.dtos.CreateSavedSearchRequest;
import com.enrollnow.participant.dtos.CustomFilterRuleDto;
import com.enrollnow.participant.dtos.SavedSearchDto;
import com.enrollnow.participant.models.RegistrySavedSearch;
import com.enrollnow.participant.repositories.RegistrySavedSearchRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RegistrySavedSearchService {

    private static final Logger log = LoggerFactory.getLogger(RegistrySavedSearchService.class);

    private final RegistrySavedSearchRepository savedSearchRepository;
    private final ObjectMapper objectMapper;

    public RegistrySavedSearchService(RegistrySavedSearchRepository savedSearchRepository, ObjectMapper objectMapper) {
        this.savedSearchRepository = savedSearchRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<SavedSearchDto> getSavedSearches(UUID tenantId, UUID userId) {
        List<RegistrySavedSearch> entities = savedSearchRepository.findByTenantIdAndUserIdOrderByNameAsc(tenantId, userId);
        return entities.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<SavedSearchDto> getSavedSearch(UUID tenantId, UUID userId, UUID id) {
        return savedSearchRepository.findByTenantIdAndUserIdAndId(tenantId, userId, id).map(this::toDto);
    }

    @Transactional
    public SavedSearchDto createSavedSearch(UUID tenantId, UUID userId, CreateSavedSearchRequest request) {
        RegistrySavedSearch entity = savedSearchRepository.findByTenantIdAndUserIdAndName(tenantId, userId, request.getName())
                .orElseGet(() -> {
                    RegistrySavedSearch s = new RegistrySavedSearch();
                    s.setTenantId(tenantId);
                    s.setUserId(userId);
                    s.setName(request.getName());
                    s.setCreatedAt(OffsetDateTime.now());
                    return s;
                });

        Map<String, Object> criteria = new HashMap<>();
        criteria.put("contactFilter", request.getContactFilter() != null ? request.getContactFilter() : "all");
        criteria.put("availableFilter", request.getAvailableFilter() != null ? request.getAvailableFilter() : "all");
        criteria.put("searchTerm", request.getSearchTerm() != null ? request.getSearchTerm() : "");
        criteria.put("selectedStudies", request.getSelectedStudies() != null ? request.getSelectedStudies() : Collections.emptyList());
        criteria.put("customFilters", request.getCustomFilters() != null ? request.getCustomFilters() : Collections.emptyList());

        try {
            entity.setSearchCriteria(objectMapper.writeValueAsString(criteria));
        } catch (Exception e) {
            log.error("Failed to serialize saved search criteria", e);
            entity.setSearchCriteria("{}");
        }

        entity.setUpdatedAt(OffsetDateTime.now());

        RegistrySavedSearch saved = savedSearchRepository.save(entity);
        return toDto(saved);
    }

    @Transactional
    public void deleteSavedSearch(UUID tenantId, UUID userId, UUID id) {
        savedSearchRepository.deleteByTenantIdAndUserIdAndId(tenantId, userId, id);
    }

    private SavedSearchDto toDto(RegistrySavedSearch entity) {
        SavedSearchDto dto = new SavedSearchDto();
        dto.setId(entity.getId().toString());
        dto.setName(entity.getName());
        dto.setContactFilter("all");
        dto.setAvailableFilter("all");
        dto.setSearchTerm("");
        dto.setSelectedStudies(Collections.emptyList());
        dto.setCustomFilters(Collections.emptyList());

        try {
            if (entity.getSearchCriteria() != null && !entity.getSearchCriteria().isBlank()) {
                Map<String, Object> map = objectMapper.readValue(entity.getSearchCriteria(), new TypeReference<Map<String, Object>>() {});
                if (map.containsKey("contactFilter")) {
                    dto.setContactFilter((String) map.get("contactFilter"));
                }
                if (map.containsKey("availableFilter")) {
                    dto.setAvailableFilter((String) map.get("availableFilter"));
                }
                if (map.containsKey("searchTerm")) {
                    dto.setSearchTerm((String) map.get("searchTerm"));
                }
                if (map.containsKey("selectedStudies") && map.get("selectedStudies") instanceof List) {
                    List<?> list = (List<?>) map.get("selectedStudies");
                    dto.setSelectedStudies(list.stream().map(Object::toString).collect(Collectors.toList()));
                }
                if (map.containsKey("customFilters") && map.get("customFilters") instanceof List) {
                    String json = objectMapper.writeValueAsString(map.get("customFilters"));
                    List<CustomFilterRuleDto> rules = objectMapper.readValue(json, new TypeReference<List<CustomFilterRuleDto>>() {});
                    dto.setCustomFilters(rules);
                }
            }
        } catch (Exception e) {
            log.warn("Failed to parse saved search criteria for search {}", entity.getId(), e);
        }

        return dto;
    }
}
