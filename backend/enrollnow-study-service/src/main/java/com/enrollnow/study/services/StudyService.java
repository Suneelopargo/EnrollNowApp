package com.enrollnow.study.services;

import com.enrollnow.identity.models.Role;
import com.enrollnow.identity.models.TeamMembership;
import com.enrollnow.identity.models.UserRoleAssignment;
import com.enrollnow.identity.repositories.PermissionRepository;
import com.enrollnow.identity.repositories.RolePermissionRepository;
import com.enrollnow.identity.repositories.RoleRepository;
import com.enrollnow.identity.repositories.TeamMembershipRepository;
import com.enrollnow.identity.repositories.UserEmailRepository;
import com.enrollnow.identity.repositories.UserRepository;
import com.enrollnow.identity.repositories.UserRoleAssignmentRepository;
import com.enrollnow.study.dtos.CopyStudyRequest;
import com.enrollnow.study.dtos.CreateStudyRequest;
import com.enrollnow.study.dtos.ImportStudyResponse;
import com.enrollnow.study.dtos.MyStudyResponse;
import com.enrollnow.study.dtos.ReorderBulkTasksRequest;
import com.enrollnow.study.dtos.SaveBulkTaskGroupRequest;
import com.enrollnow.study.dtos.ReorderTemplatesRequest;
import com.enrollnow.study.dtos.SaveBulkTaskRequest;
import com.enrollnow.study.dtos.SaveEmailTemplateRequest;
import com.enrollnow.study.dtos.SaveTextTemplateRequest;
import com.enrollnow.study.dtos.StudyAdminSummary;
import com.enrollnow.study.dtos.StudyBulkTasksResponse;
import com.enrollnow.study.dtos.StudyCustomVariableDto;
import com.enrollnow.study.dtos.StudyDetailsResponse;
import com.enrollnow.study.dtos.StudyDisplaySettingsResponse;
import com.enrollnow.study.dtos.StudyEmailTextSettingsResponse;
import com.enrollnow.study.dtos.StudyGrantDto;
import com.enrollnow.study.dtos.StudyMilestoneDto;
import com.enrollnow.study.dtos.StudyNavigationPermissionsResponse;
import com.enrollnow.study.dtos.StudyRequirementsResponse;
import com.enrollnow.study.dtos.StudySummaryResponse;
import com.enrollnow.study.dtos.UpdateStudyDetailsRequest;
import com.enrollnow.study.dtos.UpdateStudyDisplaySettingsRequest;
import com.enrollnow.study.dtos.UpdateStudyRequirementsRequest;
import com.enrollnow.study.dtos.UpdateStudyRequest;
import com.enrollnow.study.exceptions.DuplicateStudyNameException;
import com.enrollnow.study.exceptions.InvalidStudyException;
import com.enrollnow.study.exceptions.StudyLimitExceededException;
import com.enrollnow.study.exceptions.StudyNotFoundException;
import com.enrollnow.study.models.Study;
import com.enrollnow.study.models.StudyGrant;
import com.enrollnow.study.models.StudyMember;
import com.enrollnow.study.models.StudyMemberId;
import com.enrollnow.study.models.TeamStudy;
import com.enrollnow.study.models.TeamStudyId;
import com.enrollnow.study.repositories.StudyGrantRepository;
import com.enrollnow.study.repositories.StudyMemberRepository;
import com.enrollnow.study.repositories.StudyRepository;
import com.enrollnow.study.repositories.StudyRequirementRepository;
import com.enrollnow.study.repositories.TeamStudyRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Authoritative service managing clinical study lifecycles, queries, cloning, importing, and summaries.
 */
@Service
public class StudyService {

    private static class StudyAssignmentMetadata {
        String studyRole;
        String studyPermission;

        StudyAssignmentMetadata(String studyRole, String studyPermission) {
            this.studyRole = studyRole;
            this.studyPermission = studyPermission;
        }
    }

    private final StudyRepository studyRepository;
    private final StudyConfigurationService studyConfigurationService;
    private StudyMemberRepository studyMemberRepository;
    private final RoleRepository roleRepository;
    private final UserRoleAssignmentRepository userRoleAssignmentRepository;
    private final TeamMembershipRepository teamMembershipRepository;
    private final TeamStudyRepository teamStudyRepository;
    private int maxStudiesPerTenant = -1;

    @Autowired(required = false)
    private UserRepository userRepository;

    @Autowired(required = false)
    private UserEmailRepository userEmailRepository;

    @Autowired(required = false)
    private StudyRequirementRepository studyRequirementRepository;

    @Autowired(required = false)
    private StudyGrantRepository studyGrantRepository;

    @Autowired(required = false)
    private RolePermissionRepository rolePermissionRepository;

    @Autowired(required = false)
    private PermissionRepository permissionRepository;

    @Autowired(required = false)
    private ObjectMapper objectMapper;

    public StudyService(StudyRepository studyRepository) {
        this(studyRepository, null, null, null, null, null, null);
    }

    @Autowired
    public StudyService(
            StudyRepository studyRepository,
            @Autowired(required = false) StudyConfigurationService studyConfigurationService,
            @Autowired(required = false) StudyMemberRepository studyMemberRepository,
            @Autowired(required = false) RoleRepository roleRepository,
            @Autowired(required = false) UserRoleAssignmentRepository userRoleAssignmentRepository,
            @Autowired(required = false) TeamMembershipRepository teamMembershipRepository,
            @Autowired(required = false) TeamStudyRepository teamStudyRepository
    ) {
        this.studyRepository = studyRepository;
        this.studyConfigurationService = studyConfigurationService;
        this.studyMemberRepository = studyMemberRepository;
        this.roleRepository = roleRepository;
        this.userRoleAssignmentRepository = userRoleAssignmentRepository;
        this.teamMembershipRepository = teamMembershipRepository;
        this.teamStudyRepository = teamStudyRepository;
    }

    @Autowired(required = false)
    public void setStudyMemberRepository(StudyMemberRepository studyMemberRepository) {
        this.studyMemberRepository = studyMemberRepository;
    }

    @Autowired(required = false)
    public void setUserRepository(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Autowired(required = false)
    public void setUserEmailRepository(UserEmailRepository userEmailRepository) {
        this.userEmailRepository = userEmailRepository;
    }

    @Autowired(required = false)
    public void setStudyRequirementRepository(StudyRequirementRepository studyRequirementRepository) {
        this.studyRequirementRepository = studyRequirementRepository;
    }

    @Autowired(required = false)
    public void setStudyGrantRepository(StudyGrantRepository studyGrantRepository) {
        this.studyGrantRepository = studyGrantRepository;
    }

    @Autowired(required = false)
    public void setMaxStudiesPerTenant(@Value("${enrollnow.study.max-studies-per-tenant:-1}") int maxStudies) {
        this.maxStudiesPerTenant = maxStudies;
    }

    /**
     * Retrieves all active studies assigned to the specified user within the authorized tenant,
     * combining active study memberships (study_members) and active study-scoped role assignments
     * (user_role_assignments) without duplicates.
     */
    @Transactional(readOnly = true)
    public List<MyStudyResponse> getMyStudies(UUID tenantId, UUID userId) {
        if (tenantId == null || userId == null) {
            return List.of();
        }

        // Map of studyId -> Metadata (Role, Permission), preserving insertion order and preventing duplicates
        Map<UUID, StudyAssignmentMetadata> studyMap = new LinkedHashMap<>();

        // 1. Gather active studies from study_members (Coordinator, Investigator, etc.)
        if (studyMemberRepository != null) {
            List<StudyMember> memberships = studyMemberRepository.findByTenantIdAndIdUserIdAndActiveTrue(tenantId, userId);
            if (memberships != null) {
                for (StudyMember membership : memberships) {
                    if (membership != null && membership.isActive() && membership.getId() != null && membership.getId().getStudyId() != null) {
                        UUID studyId = membership.getId().getStudyId();
                        studyMap.put(studyId, new StudyAssignmentMetadata(membership.getStudyRole(), null));
                    }
                }
            }
        }

        // 2. Gather active studies from user_role_assignments (STUDY_ADMIN, STUDY_LEADER, etc.)
        OffsetDateTime now = OffsetDateTime.now();
        if (userRoleAssignmentRepository != null) {
            List<UserRoleAssignment> allAssignments = userRoleAssignmentRepository
                    .findByTenantIdAndUserIdAndActiveTrue(tenantId, userId);

            if (allAssignments != null) {
                for (UserRoleAssignment assignment : allAssignments) {
                    if (assignment == null || !assignment.isActive() || assignment.getStudyId() == null) {
                        continue;
                    }
                    if (assignment.getEffectiveFrom() != null && now.isBefore(assignment.getEffectiveFrom())) {
                        continue;
                    }
                    if (assignment.getEffectiveTo() != null && now.isAfter(assignment.getEffectiveTo())) {
                        continue;
                    }

                    UUID studyId = assignment.getStudyId();
                    Role role = (roleRepository != null && assignment.getRoleId() != null)
                            ? roleRepository.findById(assignment.getRoleId()).orElse(null)
                            : null;
                    String roleName = role != null && role.getName() != null ? role.getName() : "Study Member";
                    String roleCode = role != null ? role.getCode() : null;

                    StudyAssignmentMetadata meta = studyMap.get(studyId);
                    if (meta == null) {
                        studyMap.put(studyId, new StudyAssignmentMetadata(roleName, roleCode));
                    } else {
                        if (meta.studyPermission == null && roleCode != null) {
                            meta.studyPermission = roleCode;
                        }
                        if (meta.studyRole == null) {
                            meta.studyRole = roleName;
                        }
                    }
                }
            }
        }

        List<MyStudyResponse> responses = new ArrayList<>();

        for (Map.Entry<UUID, StudyAssignmentMetadata> entry : studyMap.entrySet()) {
            UUID studyId = entry.getKey();
            StudyAssignmentMetadata metadata = entry.getValue();

            // Enforce tenant isolation: never fallback to unscoped findById or fabricate placeholder names
            Study study = (studyRepository != null)
                    ? studyRepository.findByTenantIdAndId(tenantId, studyId).orElse(null)
                    : null;

            if (study == null) {
                continue;
            }

            // If we didn't get permission from step 2, try to resolve it specifically for this study
            String studyPermission = metadata.studyPermission;
            if (studyPermission == null && userRoleAssignmentRepository != null) {
                List<UserRoleAssignment> assignments = userRoleAssignmentRepository
                        .findByTenantIdAndUserIdAndStudyIdAndActiveTrue(
                                tenantId,
                                userId,
                                studyId
                        );

                if (assignments != null && !assignments.isEmpty() && roleRepository != null) {
                    for (UserRoleAssignment assignment : assignments) {
                        if (assignment == null || !assignment.isActive()) {
                            continue;
                        }
                        if (assignment.getEffectiveFrom() != null && now.isBefore(assignment.getEffectiveFrom())) {
                            continue;
                        }
                        if (assignment.getEffectiveTo() != null && now.isAfter(assignment.getEffectiveTo())) {
                            continue;
                        }
                        Role role = assignment.getRoleId() != null
                                ? roleRepository.findById(assignment.getRoleId()).orElse(null)
                                : null;
                        if (role != null) {
                            studyPermission = role.getCode();
                            break;
                        }
                    }
                }
            }

            responses.add(new MyStudyResponse(
                    studyId,
                    study.getStudyCode(),
                    study.getName(),
                    metadata.studyRole != null ? metadata.studyRole : "Study Member",
                    studyPermission
            ));
        }

        return responses;
    }

    @Transactional(readOnly = true)
    public List<StudySummaryResponse> getStudies(
            UUID tenantId,
            boolean includeArchived,
            UUID callerUserId,
            boolean canManageSiteAdmins
    ) {
        return getStudies(tenantId, includeArchived, null, callerUserId, canManageSiteAdmins);
    }

    @Transactional(readOnly = true)
    public List<StudySummaryResponse> getStudies(
            UUID tenantId,
            boolean includeArchived,
            String status,
            UUID callerUserId,
            boolean canManageSiteAdmins
    ) {
        if (tenantId == null) {
            throw new InvalidStudyException("Tenant ID is required to retrieve studies.");
        }
        List<Study> studies;
        if ("archived".equalsIgnoreCase(status)) {
            studies = studyRepository.findByTenantIdAndArchivedTrue(tenantId);
        } else if ("all".equalsIgnoreCase(status)) {
            studies = studyRepository.findByTenantId(tenantId);
        } else {
            studies = includeArchived
                    ? studyRepository.findByTenantId(tenantId)
                    : studyRepository.findByTenantIdAndArchivedFalse(tenantId);
        }

        // If caller is non-admin and restricted to assigned studies
        if (callerUserId != null && !canManageSiteAdmins && tenantId != null) {
            List<MyStudyResponse> myStudies = getMyStudies(tenantId, callerUserId);
            Set<UUID> assignedIds = myStudies.stream()
                    .map(MyStudyResponse::getId)
                    .collect(Collectors.toSet());
            studies = studies.stream()
                    .filter(s -> assignedIds.contains(s.getId()))
                    .collect(Collectors.toList());
        }

        return toSummaryResponseList(studies);
    }

    @Transactional(readOnly = true)
    public StudySummaryResponse getStudyByIdOrCode(
            UUID tenantId,
            String studyId,
            UUID callerUserId,
            boolean canManageSiteAdmins
    ) {
        Study study = findStudyByIdOrCode(tenantId, studyId)
                .orElseThrow(() -> new StudyNotFoundException("Study not found: " + studyId));

        if (callerUserId != null && !canManageSiteAdmins && tenantId != null) {
            List<MyStudyResponse> myStudies = getMyStudies(tenantId, callerUserId);
            boolean hasAccess = myStudies.stream().anyMatch(ms -> ms.getId().equals(study.getId()));
            if (!hasAccess) {
                throw new org.springframework.security.access.AccessDeniedException("Access denied: you do not have permission to access study " + studyId);
            }
        }

        return toSummaryResponse(study);
    }

    @Transactional(readOnly = true)
    public StudySummaryResponse getStudyByIdOrCode(UUID tenantId, String studyId) {
        return getStudyByIdOrCode(tenantId, studyId, null, true);
    }

    @Transactional(readOnly = true)
    public StudyNavigationPermissionsResponse getStudyNavigationPermissions(
            UUID tenantId,
            String studyId,
            UUID callerUserId,
            boolean canManageSiteAdmins
    ) {
        if (callerUserId == null) {
            throw new org.springframework.security.access.AccessDeniedException("Access denied: caller identity could not be resolved.");
        }

        Study study = findStudyByIdOrCode(tenantId, studyId)
                .orElseThrow(() -> new StudyNotFoundException("Study not found: " + studyId));

        OffsetDateTime now = OffsetDateTime.now();

        // 1. Resolve assignments from user_role_assignments
        List<UserRoleAssignment> allAssignments = (userRoleAssignmentRepository != null && tenantId != null)
                ? userRoleAssignmentRepository.findByTenantIdAndUserIdAndStudyIdAndActiveTrue(tenantId, callerUserId, study.getId())
                : Collections.emptyList();

        List<UserRoleAssignment> validAssignments = allAssignments.stream()
                .filter(UserRoleAssignment::isActive)
                .filter(a -> a.getEffectiveFrom() == null || !now.isBefore(a.getEffectiveFrom()))
                .filter(a -> a.getEffectiveTo() == null || !now.isAfter(a.getEffectiveTo()))
                .toList();

        boolean hasExpiredAssignment = !allAssignments.isEmpty() && validAssignments.isEmpty();

        // 2. Resolve membership from study_members
        Optional<StudyMember> memberOpt = (studyMemberRepository != null && tenantId != null)
                ? studyMemberRepository.findByTenantIdAndIdStudyIdAndIdUserId(tenantId, study.getId(), callerUserId)
                : Optional.empty();

        boolean isMemberActive = memberOpt.isPresent() && memberOpt.get().isActive();
        boolean isMemberInactive = memberOpt.isPresent() && !memberOpt.get().isActive();

        // Fail closed for expired or explicitly inactive assignments when not a site admin
        if (!canManageSiteAdmins && (hasExpiredAssignment || isMemberInactive)) {
            throw new org.springframework.security.access.AccessDeniedException("Access denied: your study assignment is inactive or has expired.");
        }

        // 3. Check access via consolidated getMyStudies
        List<MyStudyResponse> myStudies = tenantId != null
                ? getMyStudies(tenantId, callerUserId)
                : List.of();
        boolean isAssignedViaMyStudies = myStudies.stream().anyMatch(ms -> ms.getId().equals(study.getId()));

        // Non-site admins must have a valid assignment or active membership
        if (!canManageSiteAdmins && validAssignments.isEmpty() && !isMemberActive && !isAssignedViaMyStudies) {
            throw new org.springframework.security.access.AccessDeniedException("Access denied: you do not have permission to access study " + studyId);
        }

        // 4. Resolve effective study role
        String matchedRoleCode = null;
        String matchedRoleName = null;
        UUID matchedRoleId = null;
        int highestRank = 999;

        for (UserRoleAssignment assignment : validAssignments) {
            if (roleRepository != null) {
                Role role = roleRepository.findById(assignment.getRoleId()).orElse(null);
                if (role != null && "STUDY".equalsIgnoreCase(role.getScopeType())) {
                    String code = role.getCode() != null ? role.getCode().trim().toUpperCase(Locale.ROOT) : "";
                    int rank = switch (code) {
                        case "STUDY_ADMIN" -> 1;
                        case "STUDY_LEADER" -> 2;
                        case "STUDY_RA" -> 3;
                        case "STUDY_READ_ONLY" -> 4;
                        default -> 5;
                    };
                    if (rank < highestRank) {
                        highestRank = rank;
                        matchedRoleCode = role.getCode();
                        matchedRoleName = role.getName();
                        matchedRoleId = role.getId();
                    }
                }
            }
        }

        if (matchedRoleCode == null && isMemberActive) {
            String rawRole = memberOpt.get().getStudyRole();
            String lower = rawRole != null ? rawRole.toLowerCase(Locale.ROOT) : "";
            if (lower.contains("admin")) {
                matchedRoleCode = "STUDY_ADMIN";
                matchedRoleName = "Study Admin";
            } else if (lower.contains("leader") || lower.contains("principal") || lower.contains("pi")) {
                matchedRoleCode = "STUDY_LEADER";
                matchedRoleName = "Study Leader";
            } else if (lower.contains("ra") || lower.contains("assistant") || lower.contains("coordinator")) {
                matchedRoleCode = "STUDY_RA";
                matchedRoleName = (rawRole != null && !rawRole.isBlank()) ? rawRole : "Study RA";
            } else {
                matchedRoleCode = "STUDY_READ_ONLY";
                matchedRoleName = (rawRole != null && !rawRole.isBlank()) ? rawRole : "Study Read-Only";
            }
        }

        if (matchedRoleCode == null && isAssignedViaMyStudies) {
            MyStudyResponse ms = myStudies.stream()
                    .filter(s -> s.getId().equals(study.getId()))
                    .findFirst().orElse(null);
            if (ms != null && ms.getStudyPermission() != null) {
                matchedRoleCode = ms.getStudyPermission();
                matchedRoleName = ms.getStudyRole();
            }
        }

        // Global Site Admin without an explicit study assignment gets STUDY_READ_ONLY (never elevated to Study Admin)
        if (matchedRoleCode == null && canManageSiteAdmins) {
            matchedRoleCode = "STUDY_READ_ONLY";
            matchedRoleName = "Site Administrator (Read Only)";
        }

        if (matchedRoleCode == null) {
            throw new org.springframework.security.access.AccessDeniedException("Access denied: unable to resolve valid role for study " + studyId);
        }

        if (matchedRoleName == null) {
            matchedRoleName = switch (matchedRoleCode) {
                case "STUDY_ADMIN" -> "Study Admin";
                case "STUDY_LEADER" -> "Study Leader";
                case "STUDY_RA" -> "Study RA";
                default -> "Study Read-Only";
            };
        }

        List<String> permissions = resolvePermissionsForStudyRole(matchedRoleCode, matchedRoleId);

        return new StudyNavigationPermissionsResponse(
                study.getId(),
                study.getStudyCode(),
                study.getName(),
                matchedRoleName,
                matchedRoleCode,
                permissions,
                study.isArchived(),
                study.isArchived() ? "ARCHIVED" : "ACTIVE",
                false
        );
    }

    private List<String> resolvePermissionsForStudyRole(String roleCode, UUID roleId) {
        if (roleId != null && rolePermissionRepository != null && permissionRepository != null) {
            try {
                var rolePerms = rolePermissionRepository.findByIdRoleId(roleId);
                if (rolePerms != null && !rolePerms.isEmpty()) {
                    List<String> loadedCodes = new ArrayList<>();
                    for (var rp : rolePerms) {
                        permissionRepository.findById(rp.getId().getPermissionId())
                                .ifPresent(p -> loadedCodes.add(p.getCode()));
                    }
                    if (!loadedCodes.isEmpty()) {
                        return loadedCodes;
                    }
                }
            } catch (Exception ignored) {
                // Fall back to canonical defaults
            }
        }

        String normalized = roleCode != null ? roleCode.trim().toUpperCase(Locale.ROOT) : "STUDY_READ_ONLY";
        switch (normalized) {
            case "STUDY_ADMIN":
                return List.of(
                        "STUDY_DASHBOARD_READ",
                        "TASK_READ",
                        "RECRUITMENT_READ",
                        "RECRUITMENT_MANAGE",
                        "CALENDAR_READ",
                        "POTENTIAL_PARTICIPANT_READ",
                        "POTENTIAL_PARTICIPANT_MANAGE",
                        "ENROLLED_PARTICIPANT_READ",
                        "ENROLLED_PARTICIPANT_MANAGE",
                        "STUDY_SETTINGS_MANAGE",
                        "REPORT_READ",
                        "PHI_READ"
                );
            case "STUDY_LEADER":
                return List.of(
                        "STUDY_DASHBOARD_READ",
                        "TASK_READ",
                        "RECRUITMENT_READ",
                        "RECRUITMENT_MANAGE",
                        "CALENDAR_READ",
                        "POTENTIAL_PARTICIPANT_READ",
                        "POTENTIAL_PARTICIPANT_MANAGE",
                        "ENROLLED_PARTICIPANT_READ",
                        "ENROLLED_PARTICIPANT_MANAGE",
                        "PHI_READ"
                );
            case "STUDY_RA":
                return List.of(
                        "STUDY_DASHBOARD_READ",
                        "TASK_READ",
                        "RECRUITMENT_READ",
                        "CALENDAR_READ"
                );
            case "STUDY_READ_ONLY":
                return List.of(
                        "STUDY_DASHBOARD_READ",
                        "CALENDAR_READ",
                        "POTENTIAL_PARTICIPANT_READ",
                        "ENROLLED_PARTICIPANT_READ",
                        "REPORT_READ",
                        "PHI_READ"
                );
            default:
                return Collections.emptyList();
        }
    }

    @Transactional
    public StudySummaryResponse createStudy(UUID tenantId, CreateStudyRequest request) {
        return createStudy(tenantId, request, null);
    }

    @Transactional
    public StudySummaryResponse createStudy(UUID tenantId, CreateStudyRequest request, UUID callerUserId) {
        if (tenantId == null) {
            throw new InvalidStudyException("Tenant ID is required to create a study.");
        }
        UUID effectiveTenantId = tenantId;

        String name = (request != null && request.getName() != null) ? request.getName() : "";
        validateStudyName(effectiveTenantId, name);
        checkStudyLimit(effectiveTenantId);

        String trimmedName = name.trim();
        String code = (request != null && request.getStudyCode() != null && !request.getStudyCode().isBlank())
                ? request.getStudyCode().trim()
                : generateUniqueStudyCode(effectiveTenantId, trimmedName);

        String description = (request != null && request.getDescription() != null)
                ? request.getDescription()
                : "";

        Integer sampleSize = (request != null && request.getSampleSize() != null && request.getSampleSize() > 0)
                ? request.getSampleSize()
                : null;

        Study study = new Study();
        study.setTenantId(effectiveTenantId);
        study.setName(trimmedName);
        study.setStudyCode(code);
        study.setDescription(description);
        study.setSampleSize(sampleSize);
        study.setArchived(false);
        study.setCreatedBy(callerUserId);
        study.setUpdatedBy(callerUserId);
        study.setCreatedAt(OffsetDateTime.now());
        study.setUpdatedAt(OffsetDateTime.now());

        Study saved = studyRepository.save(study);

        if (studyConfigurationService != null) {
            studyConfigurationService.createDefaultConfiguration(effectiveTenantId, saved.getId(), saved.getSampleSize());
        }

        assignStudyCreator(effectiveTenantId, saved.getId(), callerUserId);

        return toSummaryResponse(saved);
    }

    @Transactional
    public StudySummaryResponse copyStudy(UUID tenantId, CopyStudyRequest request, UUID callerUserId) {
        if (tenantId == null) {
            throw new InvalidStudyException("Tenant ID is required to copy a study.");
        }
        UUID effectiveTenantId = tenantId;

        if (request == null || request.getStudyName() == null || request.getStudyName().isBlank()) {
            throw new InvalidStudyException("Short study name is required");
        }
        if (request.getSourceStudyId() == null || request.getSourceStudyId().isBlank()) {
            throw new InvalidStudyException("Source study ID to copy from is required");
        }

        validateStudyName(effectiveTenantId, request.getStudyName());
        checkStudyLimit(effectiveTenantId);

        Study source = findStudyByIdOrCode(effectiveTenantId, request.getSourceStudyId())
                .orElseThrow(() -> new StudyNotFoundException("Source study to copy from not found: " + request.getSourceStudyId()));

        if (!effectiveTenantId.equals(source.getTenantId())) {
            throw new InvalidStudyException("Access denied: cannot copy a study from another tenant");
        }

        String trimmedName = request.getStudyName().trim();
        String newCode = generateUniqueStudyCode(effectiveTenantId, trimmedName);

        Study newStudy = new Study();
        newStudy.setTenantId(effectiveTenantId);
        newStudy.setName(trimmedName);
        newStudy.setStudyCode(newCode);
        newStudy.setDescription("Copy of " + source.getName());
        newStudy.setLongName(source.getLongName());
        newStudy.setPrefix(source.getPrefix());
        newStudy.setSampleSize(source.getSampleSize());
        newStudy.setLocale(source.getLocale());
        newStudy.setAllowParticipationInOtherStudies(source.isAllowParticipationInOtherStudies());
        newStudy.setShowGlobalComments(source.isShowGlobalComments());
        newStudy.setDefaultGlobalLogs(source.isDefaultGlobalLogs());
        newStudy.setStudyUrlLabel(source.getStudyUrlLabel());
        newStudy.setStudyUrl(source.getStudyUrl());
        newStudy.setArchived(false);
        newStudy.setCreatedBy(callerUserId);
        newStudy.setUpdatedBy(callerUserId);
        newStudy.setCreatedAt(OffsetDateTime.now());
        newStudy.setUpdatedAt(OffsetDateTime.now());

        Study saved = studyRepository.save(newStudy);

        if (studyConfigurationService != null) {
            studyConfigurationService.cloneConfiguration(effectiveTenantId, source.getId(), saved.getId(), saved.getSampleSize());
        }

        assignStudyCreator(effectiveTenantId, saved.getId(), callerUserId);

        return toSummaryResponse(saved);
    }

    @Transactional
    public ImportStudyResponse importStudy(
            UUID tenantId,
            String studyName,
            Map<String, Object> dataJSON,
            UUID callerUserId
    ) {
        if (tenantId == null) {
            throw new InvalidStudyException("Tenant ID is required to import a study.");
        }
        UUID effectiveTenantId = tenantId;

        validateStudyName(effectiveTenantId, studyName);
        checkStudyLimit(effectiveTenantId);

        if (dataJSON == null || dataJSON.isEmpty()) {
            throw new InvalidStudyException("Uploaded file does not contain valid study configuration JSON");
        }

        String trimmedName = studyName.trim();
        String newCode = generateUniqueStudyCode(effectiveTenantId, trimmedName);

        Integer sampleSize = null;
        if (dataJSON.get("studyRequirements") instanceof Map<?, ?> reqMap && reqMap.get("sampleSize") instanceof Number n) {
            sampleSize = n.intValue();
        } else if (dataJSON.get("sampleSize") instanceof Number n) {
            sampleSize = n.intValue();
        }

        Study newStudy = new Study();
        newStudy.setTenantId(effectiveTenantId);
        newStudy.setName(trimmedName);
        newStudy.setStudyCode(newCode);
        newStudy.setDescription("Imported study: " + trimmedName);
        newStudy.setSampleSize(sampleSize);
        newStudy.setArchived(false);
        newStudy.setCreatedBy(callerUserId);
        newStudy.setUpdatedBy(callerUserId);
        newStudy.setCreatedAt(OffsetDateTime.now());
        newStudy.setUpdatedAt(OffsetDateTime.now());

        Study saved = studyRepository.save(newStudy);

        ImportStudyResponse response;
        if (studyConfigurationService != null) {
            response = studyConfigurationService.importLegacyStudyConfiguration(
                    effectiveTenantId,
                    saved.getId(),
                    saved.getStudyCode(),
                    saved.getName(),
                    dataJSON
            );
        } else {
            response = new ImportStudyResponse(
                    saved.getId(),
                    saved.getStudyCode(),
                    saved.getName(),
                    "Study imported successfully.",
                    Collections.emptyMap(),
                    Collections.emptyList()
            );
        }

        assignStudyCreator(effectiveTenantId, saved.getId(), callerUserId);

        return response;
    }

    @Transactional
    public StudySummaryResponse updateStudy(UUID tenantId, String studyId, UpdateStudyRequest request) {
        Study study = findStudyByIdOrCode(tenantId, studyId)
                .orElseThrow(() -> new StudyNotFoundException("Study not found: " + studyId));

        if (request != null) {
            if (request.getName() != null && !request.getName().isBlank()) {
                String newName = request.getName().trim();
                if (newName.length() > 15) {
                    throw new InvalidStudyException("Short study name must not exceed 15 characters");
                }
                if (!newName.matches("^[a-zA-Z0-9 _-]+$")) {
                    throw new InvalidStudyException("Short study name may only contain letters, numbers, spaces, hyphens, and underscores");
                }
                if (!newName.equalsIgnoreCase(study.getName())) {
                    validateStudyName(study.getTenantId(), newName);
                }
                study.setName(newName);
            }
            if (request.getDescription() != null) {
                study.setDescription(request.getDescription());
            }
            if (request.getArchived() != null) {
                study.setArchived(request.getArchived());
            }
            if (request.getSampleSize() != null) {
                study.setSampleSize(request.getSampleSize());
            }
        }
        study.setUpdatedAt(OffsetDateTime.now());

        Study updated = studyRepository.save(study);
        return toSummaryResponse(updated);
    }

    @Transactional(readOnly = true)
    public StudyDetailsResponse getStudyDetails(
            UUID tenantId,
            String studyId,
            UUID callerUserId,
            boolean canManageSiteAdmins
    ) {
        Study study = findStudyByIdOrCode(tenantId, studyId)
                .orElseThrow(() -> new StudyNotFoundException("Study not found: " + studyId));

        boolean canManage = canManageSiteAdmins;
        if (!canManage && callerUserId != null) {
            try {
                StudyNavigationPermissionsResponse navPerms = getStudyNavigationPermissions(
                        tenantId,
                        studyId,
                        callerUserId,
                        canManageSiteAdmins
                );
                if (navPerms != null && navPerms.getPermissions() != null) {
                    canManage = navPerms.getPermissions().contains("STUDY_SETTINGS_MANAGE")
                            || "STUDY_ADMIN".equalsIgnoreCase(navPerms.getStudyPermission());
                }
            } catch (Exception ex) {
                // If caller cannot access navigation, let canManage remain false
            }
        }

        List<StudyGrantDto> grantDtos = new ArrayList<>();
        if (studyGrantRepository != null && tenantId != null) {
            List<StudyGrant> grants = studyGrantRepository.findByTenantIdAndStudyId(tenantId, study.getId());
            if (grants != null) {
                for (StudyGrant g : grants) {
                    grantDtos.add(new StudyGrantDto(g.getId(), g.getGrantNumber(), g.getAgency()));
                }
            }
        }

        StudyDetailsResponse response = new StudyDetailsResponse();
        response.setId(study.getId());
        response.setTenantId(study.getTenantId());
        response.setStudyCode(study.getStudyCode());
        response.setName(study.getName());
        response.setLongName(study.getLongName());
        response.setDescription(study.getDescription());
        response.setIrbId(study.getIrbId());
        response.setRecruitmentStartDate(study.getRecruitmentStartDate());
        response.setRecruitmentEndDate(study.getRecruitmentEndDate());
        response.setCompletionDate(study.getCompletionDate());
        response.setSampleSize(study.getSampleSize());
        response.setLocale(study.getLocale());
        response.setAllowParticipationInOtherStudies(study.isAllowParticipationInOtherStudies());
        response.setStudyUrlLabel(study.getStudyUrlLabel());
        response.setStudyUrl(study.getStudyUrl());
        response.setArchived(study.isArchived());
        response.setCanManage(canManage);
        response.setCustomIdGenerationEnabled(study.isCustomIdGenerationEnabled());
        response.setPrefix(study.getPrefix());
        response.setGrants(grantDtos);

        return response;
    }

    @Transactional
    public StudyDetailsResponse updateStudyDetails(
            UUID tenantId,
            String studyId,
            UpdateStudyDetailsRequest request,
            UUID callerUserId,
            boolean canManageSiteAdmins
    ) {
        if (request == null) {
            throw new InvalidStudyException("Update study details request cannot be empty.");
        }

        Study study = findStudyByIdOrCode(tenantId, studyId)
                .orElseThrow(() -> new StudyNotFoundException("Study not found: " + studyId));

        boolean canManage = canManageSiteAdmins;
        if (!canManage) {
            if (callerUserId == null) {
                throw new org.springframework.security.access.AccessDeniedException(
                        "Access denied: authenticated caller identity is required"
                );
            }
            StudyNavigationPermissionsResponse navPerms = getStudyNavigationPermissions(
                    tenantId,
                    studyId,
                    callerUserId,
                    canManageSiteAdmins
            );
            if (navPerms != null && navPerms.getPermissions() != null) {
                canManage = navPerms.getPermissions().contains("STUDY_SETTINGS_MANAGE")
                        || "STUDY_ADMIN".equalsIgnoreCase(navPerms.getStudyPermission());
            }
            if (!canManage) {
                throw new org.springframework.security.access.AccessDeniedException(
                        "Access denied: modifying study details requires STUDY_SETTINGS_MANAGE permission or Site Admin role"
                );
            }
        }

        String newName = request.getName() != null ? request.getName().trim() : "";
        if (newName.isBlank()) {
            throw new InvalidStudyException("Short Study Name is required.");
        }
        if (newName.length() > 15) {
            throw new InvalidStudyException("Short Study Name must be 15 characters or less.");
        }
        if (!newName.matches("^[a-zA-Z0-9 _-]+$")) {
            throw new InvalidStudyException("Short Study Name may only contain letters, numbers, spaces, hyphens, and underscores.");
        }
        if (!newName.equalsIgnoreCase(study.getName())) {
            validateStudyName(study.getTenantId(), newName);
        }
        study.setName(newName);

        if (request.getRecruitmentStartDate() != null && request.getRecruitmentEndDate() != null) {
            if (request.getRecruitmentEndDate().isBefore(request.getRecruitmentStartDate())) {
                throw new InvalidStudyException("Recruitment end date cannot be earlier than start date.");
            }
        }

        study.setLongName(request.getLongName());
        study.setDescription(request.getDescription());
        study.setIrbId(request.getIrbId());
        study.setRecruitmentStartDate(request.getRecruitmentStartDate());
        study.setRecruitmentEndDate(request.getRecruitmentEndDate());
        study.setCompletionDate(request.getCompletionDate());
        if (request.getAllowParticipationInOtherStudies() != null) {
            study.setAllowParticipationInOtherStudies(request.getAllowParticipationInOtherStudies());
        }

        if (request.getCustomIdGenerationEnabled() != null) {
            boolean enabled = request.getCustomIdGenerationEnabled();
            study.setCustomIdGenerationEnabled(enabled);
            if (!enabled) {
                study.setPrefix(null);
            } else {
                String rawPrefix = request.getPrefix() != null ? request.getPrefix().trim() : "";
                if (rawPrefix.isBlank()) {
                    throw new InvalidStudyException("Study Prefix is required when Custom ID Autogeneration is enabled.");
                }
                if (rawPrefix.length() > 5) {
                    throw new InvalidStudyException("Study Prefix must be 5 characters or less.");
                }
                if (!rawPrefix.matches("^[a-zA-Z0-9]+$")) {
                    throw new InvalidStudyException("Study Prefix may only contain alphanumeric characters.");
                }
                String upperPrefix = rawPrefix.toUpperCase(Locale.ROOT);
                if (studyRepository.existsByTenantIdAndPrefixIgnoreCaseAndIdNot(study.getTenantId(), upperPrefix, study.getId())) {
                    throw new DuplicateStudyNameException("A study with prefix '" + upperPrefix + "' already exists.");
                }
                study.setPrefix(upperPrefix);
            }
        } else if (request.getPrefix() != null) {
            // If prefix explicitly updated without changing toggle
            if (study.isCustomIdGenerationEnabled()) {
                String rawPrefix = request.getPrefix().trim();
                if (rawPrefix.isBlank()) {
                    throw new InvalidStudyException("Study Prefix is required when Custom ID Autogeneration is enabled.");
                }
                if (rawPrefix.length() > 5) {
                    throw new InvalidStudyException("Study Prefix must be 5 characters or less.");
                }
                if (!rawPrefix.matches("^[a-zA-Z0-9]+$")) {
                    throw new InvalidStudyException("Study Prefix may only contain alphanumeric characters.");
                }
                String upperPrefix = rawPrefix.toUpperCase(Locale.ROOT);
                if (studyRepository.existsByTenantIdAndPrefixIgnoreCaseAndIdNot(study.getTenantId(), upperPrefix, study.getId())) {
                    throw new DuplicateStudyNameException("A study with prefix '" + upperPrefix + "' already exists.");
                }
                study.setPrefix(upperPrefix);
            }
        }

        study.setStudyUrlLabel(request.getStudyUrlLabel());
        study.setStudyUrl(request.getStudyUrl());
        study.setUpdatedAt(OffsetDateTime.now());
        if (callerUserId != null) {
            study.setUpdatedBy(callerUserId);
        }

        studyRepository.save(study);

        // Update grants atomically
        if (studyGrantRepository != null && tenantId != null && request.getGrants() != null) {
            List<StudyGrant> existingGrants = studyGrantRepository.findByTenantIdAndStudyId(tenantId, study.getId());
            studyGrantRepository.deleteAll(existingGrants);

            List<StudyGrant> toSave = new ArrayList<>();
            for (StudyGrantDto gDto : request.getGrants()) {
                boolean hasNum = gDto.getGrantNumber() != null && !gDto.getGrantNumber().isBlank();
                boolean hasAgency = gDto.getAgency() != null && !gDto.getAgency().isBlank();
                if (hasNum || hasAgency) {
                    StudyGrant sg = new StudyGrant();
                    sg.setTenantId(tenantId);
                    sg.setStudyId(study.getId());
                    sg.setGrantNumber(gDto.getGrantNumber() != null ? gDto.getGrantNumber().trim() : "");
                    sg.setAgency(gDto.getAgency() != null ? gDto.getAgency().trim() : "");
                    toSave.add(sg);
                }
            }
            if (!toSave.isEmpty()) {
                studyGrantRepository.saveAll(toSave);
            }
        }

        return getStudyDetails(tenantId, study.getId().toString(), callerUserId, canManageSiteAdmins);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> exportStudy(UUID tenantId, String studyId, UUID callerUserId, boolean canManageSiteAdmins) {
        Study study = findStudyByIdOrCode(tenantId, studyId)
                .orElseThrow(() -> new StudyNotFoundException("Study not found: " + studyId));

        if (!canManageSiteAdmins) {
            if (callerUserId == null) {
                throw new org.springframework.security.access.AccessDeniedException(
                        "Access denied: authenticated caller identity is required"
                );
            }
            StudyNavigationPermissionsResponse navPerms = getStudyNavigationPermissions(
                    tenantId,
                    studyId,
                    callerUserId,
                    canManageSiteAdmins
            );
            if (navPerms == null || navPerms.getPermissions() == null || navPerms.getPermissions().isEmpty()) {
                throw new org.springframework.security.access.AccessDeniedException(
                        "Access denied: you do not have permission to export study " + studyId
                );
            }
        }

        Map<String, Object> export = new LinkedHashMap<>();
        export.put("version", "2.0");
        export.put("exportedAt", OffsetDateTime.now().toString());

        Map<String, Object> studyMap = new LinkedHashMap<>();
        studyMap.put("id", study.getId().toString());
        studyMap.put("studyCode", study.getStudyCode());
        studyMap.put("name", study.getName());
        studyMap.put("studyName", study.getName());
        studyMap.put("longname", study.getLongName());
        studyMap.put("description", study.getDescription());
        studyMap.put("irbId", study.getIrbId());
        studyMap.put("startDate", study.getRecruitmentStartDate() != null ? study.getRecruitmentStartDate().toString() : null);
        studyMap.put("endDate", study.getRecruitmentEndDate() != null ? study.getRecruitmentEndDate().toString() : null);
        studyMap.put("completionDate", study.getCompletionDate() != null ? study.getCompletionDate().toString() : null);
        studyMap.put("studyURL", study.getStudyUrl());
        studyMap.put("studyUrlLabel", study.getStudyUrlLabel());
        studyMap.put("allowParticipationInOtherStudies", study.isAllowParticipationInOtherStudies());
        studyMap.put("customIdGenerationEnabled", study.isCustomIdGenerationEnabled());
        studyMap.put("prefix", study.getPrefix());
        studyMap.put("sampleSize", study.getSampleSize());
        studyMap.put("locale", study.getLocale());
        studyMap.put("showGlobalComments", study.isShowGlobalComments());
        studyMap.put("defaultGlobalLogs", study.isDefaultGlobalLogs());
        export.put("study", studyMap);

        List<Map<String, Object>> grantsList = new ArrayList<>();
        if (studyGrantRepository != null && tenantId != null) {
            List<StudyGrant> grants = studyGrantRepository.findByTenantIdAndStudyId(tenantId, study.getId());
            if (grants != null) {
                for (StudyGrant g : grants) {
                    Map<String, Object> gMap = new LinkedHashMap<>();
                    gMap.put("grantNum", g.getGrantNumber());
                    gMap.put("grantAgency", g.getAgency());
                    grantsList.add(gMap);
                }
            }
        }
        export.put("study_grants", grantsList);

        if (studyRequirementRepository != null && tenantId != null) {
            studyRequirementRepository.findByTenantIdAndStudyId(tenantId, study.getId())
                    .ifPresent(req -> {
                        if (req.getConfiguration() != null && !req.getConfiguration().isBlank()) {
                            try {
                                ObjectMapper mapper = (this.objectMapper != null) ? this.objectMapper : new ObjectMapper();
                                Map<String, Object> config = mapper.readValue(
                                        req.getConfiguration(),
                                        new TypeReference<Map<String, Object>>() {}
                                );
                                for (Map.Entry<String, Object> entry : config.entrySet()) {
                                    if (!"study".equals(entry.getKey()) && !"study_grants".equals(entry.getKey())) {
                                        export.put(entry.getKey(), entry.getValue());
                                    }
                                }
                            } catch (Exception ex) {
                                throw new InvalidStudyException("Corrupted study configuration JSON: " + ex.getMessage());
                            }
                        }
                    });
        }

        return export;
    }

    @Transactional
    public Map<String, Object> importStudyComponents(
            UUID tenantId,
            String studyId,
            Map<String, Object> components,
            UUID callerUserId,
            boolean canManageSiteAdmins
    ) {
        Study study = findStudyByIdOrCode(tenantId, studyId)
                .orElseThrow(() -> new StudyNotFoundException("Study not found: " + studyId));

        boolean canManage = canManageSiteAdmins;
        if (!canManage) {
            if (callerUserId == null) {
                throw new org.springframework.security.access.AccessDeniedException(
                        "Access denied: authenticated caller identity is required"
                );
            }
            StudyNavigationPermissionsResponse navPerms = getStudyNavigationPermissions(
                    tenantId,
                    studyId,
                    callerUserId,
                    canManageSiteAdmins
            );
            if (navPerms != null && navPerms.getPermissions() != null) {
                canManage = navPerms.getPermissions().contains("STUDY_SETTINGS_MANAGE")
                        || "STUDY_ADMIN".equalsIgnoreCase(navPerms.getStudyPermission());
            }
            if (!canManage) {
                throw new org.springframework.security.access.AccessDeniedException(
                        "Access denied: importing study components requires STUDY_SETTINGS_MANAGE permission or Site Admin role"
                );
            }
        }

        if (studyConfigurationService != null) {
            return studyConfigurationService.importComponentsIntoExistingStudy(
                    study.getTenantId(),
                    study.getId(),
                    components
            );
        }

        return Map.of("importedCount", 0, "message", "Configuration service unavailable.");
    }

    @Transactional
    public synchronized String generateNextCustomParticipantId(UUID tenantId, UUID studyId) {
        Study study = studyRepository.findByTenantIdAndId(tenantId, studyId)
                .orElseThrow(() -> new StudyNotFoundException("Study not found: " + studyId));

        if (!study.isCustomIdGenerationEnabled() || study.getPrefix() == null || study.getPrefix().isBlank()) {
            return "SP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
        }

        String prefix = study.getPrefix().trim().toUpperCase(Locale.ROOT);
        long nextVal = study.getNextSequentialIdentifier() + 1;
        study.setNextSequentialIdentifier(nextVal);
        studyRepository.save(study);

        return String.format("%s%08d", prefix, nextVal);
    }

    private boolean resolveCanManageStudySettings(
            Study study,
            String studyId,
            UUID callerUserId,
            boolean canManageSiteAdmins
    ) {
        if (canManageSiteAdmins) {
            return true;
        }
        if (callerUserId == null) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Access denied: authenticated caller identity is required"
            );
        }
        StudyNavigationPermissionsResponse navPerms = getStudyNavigationPermissions(
                study.getTenantId(),
                studyId,
                callerUserId,
                canManageSiteAdmins
        );
        if (navPerms == null || navPerms.getPermissions() == null || navPerms.getPermissions().isEmpty()) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Access denied: you do not have permission to view study " + studyId
            );
        }
        return navPerms.getPermissions().contains("STUDY_SETTINGS_MANAGE")
                || "STUDY_ADMIN".equalsIgnoreCase(navPerms.getStudyPermission());
    }

    private void requireStudySettingsManage(
            Study study,
            String studyId,
            UUID callerUserId,
            boolean canManageSiteAdmins
    ) {
        if (canManageSiteAdmins) {
            return;
        }
        if (callerUserId == null) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Access denied: authenticated caller identity is required"
            );
        }
        StudyNavigationPermissionsResponse navPerms = getStudyNavigationPermissions(
                study.getTenantId(),
                studyId,
                callerUserId,
                canManageSiteAdmins
        );
        boolean canManage = navPerms != null
                && navPerms.getPermissions() != null
                && (navPerms.getPermissions().contains("STUDY_SETTINGS_MANAGE")
                || "STUDY_ADMIN".equalsIgnoreCase(navPerms.getStudyPermission()));
        if (!canManage) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Access denied: modifying study settings requires STUDY_SETTINGS_MANAGE permission or Site Admin role"
            );
        }
    }

    @Transactional(readOnly = true)
    public StudyDisplaySettingsResponse getStudyDisplaySettings(
            UUID tenantId,
            String studyId,
            UUID callerUserId,
            boolean canManageSiteAdmins
    ) {
        Study study = findStudyByIdOrCode(tenantId, studyId)
                .orElseThrow(() -> new StudyNotFoundException("Study not found: " + studyId));

        boolean canManage = resolveCanManageStudySettings(study, studyId, callerUserId, canManageSiteAdmins);
        return buildDisplaySettingsResponse(study, canManage);
    }

    private StudyDisplaySettingsResponse buildDisplaySettingsResponse(Study study, boolean canManage) {
        if (studyConfigurationService != null) {
            return studyConfigurationService.getDisplayConfiguration(
                    study.getTenantId(),
                    study.getId(),
                    study.getLocale(),
                    study.isShowGlobalComments(),
                    study.isDefaultGlobalLogs(),
                    canManage
            );
        }
        StudyDisplaySettingsResponse response = new StudyDisplaySettingsResponse();
        response.setStudyId(study.getId().toString());
        response.setLocale(study.getLocale() != null && !study.getLocale().isBlank() ? study.getLocale() : "en-US");
        response.setShowGlobalComments(study.isShowGlobalComments());
        response.setDefaultGlobalLogs(study.isDefaultGlobalLogs());
        response.setStatusPageCombinedView(false);
        response.setEnrolledParticipantColumnsShowEvents(true);
        response.setPotentialParticipantColumns(StudyConfigurationService.getDefaultPotentialColumns());
        response.setEnrolledParticipantColumns(StudyConfigurationService.getDefaultEnrolledColumns());
        response.setAvailableColumnOptions(new ArrayList<>());
        response.setSupportedLocales(new ArrayList<>());
        response.setCanManage(canManage);
        return response;
    }

    @Transactional
    public StudyDisplaySettingsResponse updateStudyDisplaySettings(
            UUID tenantId,
            String studyId,
            UpdateStudyDisplaySettingsRequest request,
            UUID callerUserId,
            boolean canManageSiteAdmins
    ) {
        if (request == null) {
            throw new InvalidStudyException("Update study display settings request cannot be empty.");
        }

        Study study = findStudyByIdOrCode(tenantId, studyId)
                .orElseThrow(() -> new StudyNotFoundException("Study not found: " + studyId));

        requireStudySettingsManage(study, studyId, callerUserId, canManageSiteAdmins);

        if (request.getLocale() != null) {
            String trimmedLocale = request.getLocale().trim();
            boolean validLocale = studyConfigurationService != null
                    ? studyConfigurationService.isLocaleSupported(trimmedLocale)
                    : !trimmedLocale.isBlank();
            if (!validLocale) {
                throw new InvalidStudyException("Unsupported study locale: " + trimmedLocale);
            }
            study.setLocale(trimmedLocale);
        }
        if (request.getShowGlobalComments() != null) {
            study.setShowGlobalComments(request.getShowGlobalComments());
        }
        if (request.getDefaultGlobalLogs() != null) {
            study.setDefaultGlobalLogs(request.getDefaultGlobalLogs());
        }

        // Validate & persist study customizations first so an invalid column list
        // rolls back the whole update (transactional) rather than partially saving.
        boolean hasCustomizationChanges = request.getStatusPageCombinedView() != null
                || request.getEnrolledParticipantColumnsShowEvents() != null
                || request.getPotentialParticipantColumns() != null
                || request.getEnrolledParticipantColumns() != null;
        if (hasCustomizationChanges && studyConfigurationService != null) {
            studyConfigurationService.updateDisplayCustomizationsInConfig(
                    study.getTenantId(),
                    study.getId(),
                    request
            );
        }

        study.setUpdatedAt(OffsetDateTime.now());
        if (callerUserId != null) {
            study.setUpdatedBy(callerUserId);
        }
        studyRepository.save(study);

        return buildDisplaySettingsResponse(study, true);
    }

    @Transactional(readOnly = true)
    public StudyBulkTasksResponse getStudyBulkTasks(
            UUID tenantId,
            String studyId,
            UUID callerUserId,
            boolean canManageSiteAdmins
    ) {
        Study study = findStudyByIdOrCode(tenantId, studyId)
                .orElseThrow(() -> new StudyNotFoundException("Study not found: " + studyId));

        boolean canManage = resolveCanManageStudySettings(study, studyId, callerUserId, canManageSiteAdmins);
        return buildBulkTasksResponse(study, canManage);
    }

    private StudyBulkTasksResponse buildBulkTasksResponse(Study study, boolean canManage) {
        List<StudyAdminSummary> teamMembers = new ArrayList<>();
        StudySummaryResponse summary = toSummaryResponse(study);
        if (summary != null && summary.getAdmins() != null) {
            teamMembers.addAll(summary.getAdmins());
        }
        if (studyConfigurationService != null) {
            return studyConfigurationService.getBulkTasksConfiguration(
                    study.getTenantId(),
                    study.getId(),
                    teamMembers,
                    canManage
            );
        }
        StudyBulkTasksResponse response = new StudyBulkTasksResponse();
        response.setStudyId(study.getId().toString());
        response.setBulkTaskGroups(new ArrayList<>());
        response.setBulkTasks(new ArrayList<>());
        response.setEvents(new ArrayList<>());
        response.setTeamMembers(teamMembers);
        response.setCanManage(canManage);
        return response;
    }

    private Study requireBulkTaskManage(UUID tenantId, String studyId, UUID callerUserId, boolean canManageSiteAdmins) {
        Study study = findStudyByIdOrCode(tenantId, studyId)
                .orElseThrow(() -> new StudyNotFoundException("Study not found: " + studyId));
        requireStudySettingsManage(study, studyId, callerUserId, canManageSiteAdmins);
        if (studyConfigurationService == null) {
            throw new InvalidStudyException("Study configuration service is unavailable.");
        }
        return study;
    }

    @Transactional
    public StudyBulkTasksResponse createBulkTaskGroup(
            UUID tenantId,
            String studyId,
            SaveBulkTaskGroupRequest request,
            UUID callerUserId,
            boolean canManageSiteAdmins
    ) {
        if (request == null) {
            throw new InvalidStudyException("Bulk task group request cannot be empty.");
        }
        Study study = requireBulkTaskManage(tenantId, studyId, callerUserId, canManageSiteAdmins);
        studyConfigurationService.createBulkTaskGroup(study.getTenantId(), study.getId(), request);
        return buildBulkTasksResponse(study, true);
    }

    @Transactional
    public StudyBulkTasksResponse updateBulkTaskGroup(
            UUID tenantId,
            String studyId,
            String groupId,
            SaveBulkTaskGroupRequest request,
            UUID callerUserId,
            boolean canManageSiteAdmins
    ) {
        if (request == null) {
            throw new InvalidStudyException("Bulk task group request cannot be empty.");
        }
        Study study = requireBulkTaskManage(tenantId, studyId, callerUserId, canManageSiteAdmins);
        studyConfigurationService.updateBulkTaskGroup(study.getTenantId(), study.getId(), groupId, request);
        return buildBulkTasksResponse(study, true);
    }

    @Transactional
    public StudyBulkTasksResponse deleteBulkTaskGroup(
            UUID tenantId,
            String studyId,
            String groupId,
            UUID callerUserId,
            boolean canManageSiteAdmins
    ) {
        Study study = requireBulkTaskManage(tenantId, studyId, callerUserId, canManageSiteAdmins);
        studyConfigurationService.deleteBulkTaskGroup(study.getTenantId(), study.getId(), groupId);
        return buildBulkTasksResponse(study, true);
    }

    @Transactional
    public StudyBulkTasksResponse createBulkTask(
            UUID tenantId,
            String studyId,
            String groupId,
            SaveBulkTaskRequest request,
            UUID callerUserId,
            boolean canManageSiteAdmins
    ) {
        Study study = requireBulkTaskManage(tenantId, studyId, callerUserId, canManageSiteAdmins);
        studyConfigurationService.createBulkTask(study.getTenantId(), study.getId(), groupId, request);
        return buildBulkTasksResponse(study, true);
    }

    @Transactional
    public StudyBulkTasksResponse updateBulkTask(
            UUID tenantId,
            String studyId,
            String taskId,
            SaveBulkTaskRequest request,
            UUID callerUserId,
            boolean canManageSiteAdmins
    ) {
        Study study = requireBulkTaskManage(tenantId, studyId, callerUserId, canManageSiteAdmins);
        studyConfigurationService.updateBulkTask(study.getTenantId(), study.getId(), taskId, request);
        return buildBulkTasksResponse(study, true);
    }

    @Transactional
    public StudyBulkTasksResponse deleteBulkTask(
            UUID tenantId,
            String studyId,
            String taskId,
            UUID callerUserId,
            boolean canManageSiteAdmins
    ) {
        Study study = requireBulkTaskManage(tenantId, studyId, callerUserId, canManageSiteAdmins);
        studyConfigurationService.deleteBulkTask(study.getTenantId(), study.getId(), taskId);
        return buildBulkTasksResponse(study, true);
    }

    @Transactional
    public StudyBulkTasksResponse reorderBulkTasks(
            UUID tenantId,
            String studyId,
            String groupId,
            ReorderBulkTasksRequest request,
            UUID callerUserId,
            boolean canManageSiteAdmins
    ) {
        Study study = requireBulkTaskManage(tenantId, studyId, callerUserId, canManageSiteAdmins);
        studyConfigurationService.reorderBulkTasks(
                study.getTenantId(),
                study.getId(),
                groupId,
                request != null && request.getTaskIds() != null ? request.getTaskIds() : List.of()
        );
        return buildBulkTasksResponse(study, true);
    }

    @Transactional
    public StudySummaryResponse archiveStudy(UUID tenantId, String studyId) {
        return updateStudy(tenantId, studyId, new UpdateStudyRequest(null, null, true, null));
    }

    @Transactional
    public StudySummaryResponse restoreStudy(UUID tenantId, String studyId) {
        return updateStudy(tenantId, studyId, new UpdateStudyRequest(null, null, false, null));
    }

    @Transactional
    public void deleteStudy(UUID tenantId, String studyId) {
        Study study = findStudyByIdOrCode(tenantId, studyId)
                .orElseThrow(() -> new StudyNotFoundException("Study not found: " + studyId));

        UUID sId = study.getId();
        UUID effectiveTenantId = study.getTenantId() != null ? study.getTenantId() : tenantId;
        if (studyMemberRepository != null) {
            if (effectiveTenantId != null) {
                studyMemberRepository.deleteByTenantIdAndIdStudyId(effectiveTenantId, sId);
            } else {
                studyMemberRepository.deleteByIdStudyId(sId);
            }
        }
        if (teamStudyRepository != null) {
            if (effectiveTenantId != null) {
                teamStudyRepository.deleteByTenantIdAndIdStudyId(effectiveTenantId, sId);
            } else {
                teamStudyRepository.deleteByIdStudyId(sId);
            }
        }
        if (studyRequirementRepository != null) {
            studyRequirementRepository.deleteById(sId);
        }
        studyRepository.delete(study);
    }

    public void validateStudyName(UUID tenantId, String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new InvalidStudyException("Short study name is required");
        }
        String trimmed = name.trim();
        if (trimmed.length() > 15) {
            throw new InvalidStudyException("Short study name must not exceed 15 characters");
        }
        if (!trimmed.matches("^[a-zA-Z0-9 _-]+$")) {
            throw new InvalidStudyException("Short study name may only contain letters, numbers, spaces, hyphens, and underscores");
        }
        if (studyRepository != null && tenantId != null && studyRepository.existsByTenantIdAndNameIgnoreCase(tenantId, trimmed)) {
            throw new DuplicateStudyNameException("Study name already exists. Please choose another");
        }
    }

    private void checkStudyLimit(UUID tenantId) {
        if (maxStudiesPerTenant > 0 && studyRepository != null && tenantId != null) {
            List<Study> existing = studyRepository.findByTenantId(tenantId);
            if (existing != null && existing.size() >= maxStudiesPerTenant) {
                throw new StudyLimitExceededException("Your account is limited to only "
                        + maxStudiesPerTenant + (maxStudiesPerTenant == 1 ? " study." : " studies.")
                        + " Contact the EnrollNow sales team (sales@enrollnow.io) to upgrade your account.");
            }
        }
    }

    private String generateUniqueStudyCode(UUID tenantId, String studyName) {
        String base = studyName.trim().toUpperCase().replaceAll("[^A-Z0-9_-]", "_");
        if (base.isBlank()) {
            base = "STD";
        }
        if (studyRepository == null || tenantId == null || !studyRepository.existsByTenantIdAndStudyCode(tenantId, base)) {
            return base;
        }

        for (int i = 1; i <= 99; i++) {
            String candidate = base + "_" + i;
            if (!studyRepository.existsByTenantIdAndStudyCode(tenantId, candidate)) {
                return candidate;
            }
        }

        return base + "_" + System.currentTimeMillis();
    }

    private void assignStudyCreator(UUID tenantId, UUID studyId, UUID callerUserId) {
        if (callerUserId == null) {
            return;
        }

        if (studyMemberRepository != null) {
            StudyMember member = studyMemberRepository
                    .findByTenantIdAndIdStudyIdAndIdUserId(tenantId, studyId, callerUserId)
                    .orElseGet(() -> {
                        StudyMember m = new StudyMember();
                        m.setId(new StudyMemberId(studyId, callerUserId));
                        m.setTenantId(tenantId);
                        return m;
                    });
            member.setActive(true);
            member.setStudyRole("Coordinator");
            member.setJoinedAt(OffsetDateTime.now());
            studyMemberRepository.save(member);
        }

        if (roleRepository != null && userRoleAssignmentRepository != null) {
            Optional<Role> studyAdminRoleOpt = roleRepository.findByCode("STUDY_ADMIN");
            if (studyAdminRoleOpt.isPresent()) {
                Role adminRole = studyAdminRoleOpt.get();
                boolean exists = userRoleAssignmentRepository
                        .findByTenantIdAndUserIdAndStudyIdAndActiveTrue(tenantId, callerUserId, studyId)
                        .stream()
                        .anyMatch(a -> a.getRoleId().equals(adminRole.getId()));
                if (!exists) {
                    UserRoleAssignment assignment = new UserRoleAssignment();
                    assignment.setTenantId(tenantId);
                    assignment.setUserId(callerUserId);
                    assignment.setRoleId(adminRole.getId());
                    assignment.setStudyId(studyId);
                    assignment.setActive(true);
                    assignment.setCreatedAt(OffsetDateTime.now());
                    userRoleAssignmentRepository.save(assignment);
                }
            }
        }

        if (teamMembershipRepository != null && teamStudyRepository != null) {
            List<TeamMembership> userTeams = teamMembershipRepository.findByTenantIdAndUserIdAndActiveTrue(tenantId, callerUserId);
            for (TeamMembership tm : userTeams) {
                if (tm.getTeamId() != null && !teamStudyRepository.existsByTenantIdAndIdTeamIdAndIdStudyId(tenantId, tm.getTeamId(), studyId)) {
                    TeamStudy ts = new TeamStudy();
                    ts.setId(new TeamStudyId(tm.getTeamId(), studyId));
                    ts.setTenantId(tenantId);
                    teamStudyRepository.save(ts);
                }
            }
        }
    }

    public List<StudySummaryResponse> toSummaryResponseList(List<Study> studyList) {
        if (studyList == null || studyList.isEmpty()) {
            return Collections.emptyList();
        }

        Map<UUID, List<Study>> studiesByTenant = new LinkedHashMap<>();
        for (Study s : studyList) {
            if (s != null && s.getId() != null && s.getTenantId() != null) {
                studiesByTenant.computeIfAbsent(s.getTenantId(), k -> new ArrayList<>()).add(s);
            }
        }

        Map<UUID, List<StudyMember>> membersByStudyId = new HashMap<>();
        Map<UUID, Map<UUID, com.enrollnow.identity.models.User>> usersByTenantAndId = new HashMap<>();
        Map<UUID, Map<UUID, String>> primaryEmailByTenantAndUserId = new HashMap<>();

        for (Map.Entry<UUID, List<Study>> entry : studiesByTenant.entrySet()) {
            UUID tenantId = entry.getKey();
            List<Study> tenantStudies = entry.getValue();
            List<UUID> tenantStudyIds = tenantStudies.stream()
                    .map(Study::getId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());

            Set<UUID> tenantUserIds = new LinkedHashSet<>();
            tenantStudies.stream()
                    .map(Study::getCreatedBy)
                    .filter(Objects::nonNull)
                    .forEach(tenantUserIds::add);

            if (studyMemberRepository != null && !tenantStudyIds.isEmpty()) {
                List<StudyMember> tenantMembers = studyMemberRepository.findByTenantIdAndIdStudyIdIn(tenantId, tenantStudyIds);
                if (tenantMembers != null) {
                    for (StudyMember m : tenantMembers) {
                        if (m != null && m.getId() != null && m.getId().getStudyId() != null
                                && (m.getTenantId() == null || tenantId.equals(m.getTenantId()))) {
                            membersByStudyId.computeIfAbsent(m.getId().getStudyId(), k -> new ArrayList<>()).add(m);
                            if (m.getId().getUserId() != null) {
                                tenantUserIds.add(m.getId().getUserId());
                            }
                        }
                    }
                }
            }

            if (userRepository != null && !tenantUserIds.isEmpty()) {
                List<com.enrollnow.identity.models.User> tenantUsers =
                        userRepository.findByTenantIdAndIdIn(tenantId, tenantUserIds);
                if (tenantUsers != null) {
                    Map<UUID, com.enrollnow.identity.models.User> userMap =
                            usersByTenantAndId.computeIfAbsent(tenantId, k -> new HashMap<>());
                    for (com.enrollnow.identity.models.User u : tenantUsers) {
                        if (u != null && u.getId() != null && (u.getTenantId() == null || tenantId.equals(u.getTenantId()))) {
                            userMap.put(u.getId(), u);
                        }
                    }
                }
            }

            if (userEmailRepository != null && !tenantUserIds.isEmpty()) {
                List<com.enrollnow.identity.models.UserEmail> tenantEmails =
                        userEmailRepository.findByTenantIdAndUserIdInAndPrimaryEmailTrue(tenantId, tenantUserIds);
                if (tenantEmails != null) {
                    Map<UUID, String> emailMap =
                            primaryEmailByTenantAndUserId.computeIfAbsent(tenantId, k -> new HashMap<>());
                    for (com.enrollnow.identity.models.UserEmail ue : tenantEmails) {
                        if (ue != null && ue.getUserId() != null && ue.getEmail() != null && !ue.getEmail().isBlank()
                                && (ue.getTenantId() == null || tenantId.equals(ue.getTenantId()))) {
                            emailMap.put(ue.getUserId(), ue.getEmail().trim());
                        }
                    }
                }
            }
        }

        List<StudySummaryResponse> results = new ArrayList<>(studyList.size());
        for (Study s : studyList) {
            StudySummaryResponse res = new StudySummaryResponse(
                    s.getId(),
                    s.getStudyCode(),
                    s.getName(),
                    s.getDescription(),
                    s.isArchived()
            );
            res.setSampleSize(s.getSampleSize());
            // No fabricated or synthetic enrollment values - represented as unrecorded/null
            res.setEnrolled(null);
            res.setStartDate(s.getRecruitmentStartDate());
            res.setEndDate(s.getRecruitmentEndDate());

            UUID studyTenantId = s.getTenantId();
            Map<UUID, com.enrollnow.identity.models.User> tenantUsers =
                    studyTenantId != null ? usersByTenantAndId.getOrDefault(studyTenantId, Collections.emptyMap()) : Collections.emptyMap();
            Map<UUID, String> tenantEmails =
                    studyTenantId != null ? primaryEmailByTenantAndUserId.getOrDefault(studyTenantId, Collections.emptyMap()) : Collections.emptyMap();

            List<StudyAdminSummary> adminList = new ArrayList<>();
            List<StudyMember> members = membersByStudyId.getOrDefault(s.getId(), Collections.emptyList());
            for (StudyMember m : members) {
                if (m.getId() != null && m.getId().getUserId() != null) {
                    UUID uid = m.getId().getUserId();
                    com.enrollnow.identity.models.User u = tenantUsers.get(uid);
                    String name = null;
                    String initials = null;
                    if (u != null) {
                        String first = u.getFirstName() != null ? u.getFirstName().trim() : "";
                        String last = u.getLastName() != null ? u.getLastName().trim() : "";
                        String fullName = (first + " " + last).trim();
                        if (!fullName.isEmpty()) {
                            name = fullName;
                        }
                        StringBuilder initBuilder = new StringBuilder();
                        if (!first.isEmpty()) initBuilder.append(Character.toUpperCase(first.charAt(0)));
                        if (!last.isEmpty()) initBuilder.append(Character.toUpperCase(last.charAt(0)));
                        if (initBuilder.length() > 0) {
                            initials = initBuilder.toString();
                        }
                    }
                    String email = tenantEmails.get(uid);
                    adminList.add(new StudyAdminSummary(uid, name, email, initials, m.getStudyRole()));
                }
            }

            if (adminList.isEmpty() && s.getCreatedBy() != null) {
                UUID uid = s.getCreatedBy();
                com.enrollnow.identity.models.User u = tenantUsers.get(uid);
                String name = null;
                String initials = null;
                if (u != null) {
                    String first = u.getFirstName() != null ? u.getFirstName().trim() : "";
                    String last = u.getLastName() != null ? u.getLastName().trim() : "";
                    String fullName = (first + " " + last).trim();
                    if (!fullName.isEmpty()) {
                        name = fullName;
                    }
                    StringBuilder initBuilder = new StringBuilder();
                    if (!first.isEmpty()) initBuilder.append(Character.toUpperCase(first.charAt(0)));
                    if (!last.isEmpty()) initBuilder.append(Character.toUpperCase(last.charAt(0)));
                    if (initBuilder.length() > 0) {
                        initials = initBuilder.toString();
                    }
                }
                String email = tenantEmails.get(uid);
                if (u != null || email != null) {
                    adminList.add(new StudyAdminSummary(uid, name, email, initials, "STUDY_ADMIN"));
                }
            }
            res.setAdmins(adminList);
            results.add(res);
        }
        return results;
    }

    public StudySummaryResponse toSummaryResponse(Study s) {
        if (s == null) return null;
        List<StudySummaryResponse> list = toSummaryResponseList(Collections.singletonList(s));
        return list.isEmpty() ? null : list.get(0);
    }

    private Optional<Study> findStudyByIdOrCode(UUID tenantId, String studyId) {
        if (tenantId == null || studyId == null || studyId.isBlank()) {
            return Optional.empty();
        }

        UUID idUuid = null;
        try {
            idUuid = UUID.fromString(studyId.trim());
        } catch (IllegalArgumentException ignored) {
        }

        if (idUuid != null) {
            Optional<Study> byId = studyRepository.findByTenantIdAndId(tenantId, idUuid);
            if (byId.isPresent()) {
                return byId;
            }
        }

        return studyRepository.findByTenantIdAndStudyCode(tenantId, studyId.trim());
    }


    // --- Study Settings: Email & Text Templates ---

    @Transactional(readOnly = true)
    public StudyEmailTextSettingsResponse getStudyEmailTextSettings(
            UUID tenantId,
            String studyId,
            UUID callerUserId,
            boolean canManageSiteAdmins
    ) {
        Study study = findStudyByIdOrCode(tenantId, studyId)
                .orElseThrow(() -> new StudyNotFoundException("Study not found: " + studyId));
        boolean canManage = resolveCanManageStudySettings(study, studyId, callerUserId, canManageSiteAdmins);
        return buildEmailTextSettingsResponse(study, canManage);
    }

    private StudyEmailTextSettingsResponse buildEmailTextSettingsResponse(Study study, boolean canManage) {
        if (studyConfigurationService != null) {
            return studyConfigurationService.getEmailAndTextConfiguration(
                    study.getTenantId(),
                    study.getId(),
                    canManage
            );
        }
        StudyEmailTextSettingsResponse response = new StudyEmailTextSettingsResponse();
        response.setStudyId(study.getId().toString());
        response.setCanManage(canManage);
        response.setTextMessagingEnabled(true);
        response.setEmailTemplates(new ArrayList<>());
        response.setTextTemplates(new ArrayList<>());
        response.setEvents(new ArrayList<>());
        return response;
    }

    private Study requireEmailTextManage(UUID tenantId, String studyId, UUID callerUserId, boolean canManageSiteAdmins) {
        Study study = findStudyByIdOrCode(tenantId, studyId)
                .orElseThrow(() -> new StudyNotFoundException("Study not found: " + studyId));
        requireStudySettingsManage(study, studyId, callerUserId, canManageSiteAdmins);
        if (studyConfigurationService == null) {
            throw new InvalidStudyException("Study configuration service is unavailable.");
        }
        return study;
    }

    @Transactional
    public StudyEmailTextSettingsResponse createEmailTemplate(
            UUID tenantId,
            String studyId,
            SaveEmailTemplateRequest request,
            UUID callerUserId,
            boolean canManageSiteAdmins
    ) {
        Study study = requireEmailTextManage(tenantId, studyId, callerUserId, canManageSiteAdmins);
        studyConfigurationService.createEmailTemplate(study.getTenantId(), study.getId(), request);
        return buildEmailTextSettingsResponse(study, true);
    }

    @Transactional
    public StudyEmailTextSettingsResponse updateEmailTemplate(
            UUID tenantId,
            String studyId,
            String templateId,
            SaveEmailTemplateRequest request,
            UUID callerUserId,
            boolean canManageSiteAdmins
    ) {
        Study study = requireEmailTextManage(tenantId, studyId, callerUserId, canManageSiteAdmins);
        studyConfigurationService.updateEmailTemplate(study.getTenantId(), study.getId(), templateId, request);
        return buildEmailTextSettingsResponse(study, true);
    }

    @Transactional
    public StudyEmailTextSettingsResponse copyEmailTemplate(
            UUID tenantId,
            String studyId,
            String templateId,
            UUID callerUserId,
            boolean canManageSiteAdmins
    ) {
        Study study = requireEmailTextManage(tenantId, studyId, callerUserId, canManageSiteAdmins);
        studyConfigurationService.copyEmailTemplate(study.getTenantId(), study.getId(), templateId);
        return buildEmailTextSettingsResponse(study, true);
    }

    @Transactional
    public StudyEmailTextSettingsResponse archiveEmailTemplate(
            UUID tenantId,
            String studyId,
            String templateId,
            UUID callerUserId,
            boolean canManageSiteAdmins
    ) {
        Study study = requireEmailTextManage(tenantId, studyId, callerUserId, canManageSiteAdmins);
        studyConfigurationService.archiveEmailTemplate(study.getTenantId(), study.getId(), templateId);
        return buildEmailTextSettingsResponse(study, true);
    }

    @Transactional
    public StudyEmailTextSettingsResponse restoreEmailTemplate(
            UUID tenantId,
            String studyId,
            String templateId,
            UUID callerUserId,
            boolean canManageSiteAdmins
    ) {
        Study study = requireEmailTextManage(tenantId, studyId, callerUserId, canManageSiteAdmins);
        studyConfigurationService.restoreEmailTemplate(study.getTenantId(), study.getId(), templateId);
        return buildEmailTextSettingsResponse(study, true);
    }

    @Transactional
    public StudyEmailTextSettingsResponse deleteEmailTemplate(
            UUID tenantId,
            String studyId,
            String templateId,
            UUID callerUserId,
            boolean canManageSiteAdmins
    ) {
        Study study = requireEmailTextManage(tenantId, studyId, callerUserId, canManageSiteAdmins);
        studyConfigurationService.deleteEmailTemplate(study.getTenantId(), study.getId(), templateId);
        return buildEmailTextSettingsResponse(study, true);
    }

    @Transactional
    public StudyEmailTextSettingsResponse reorderEmailTemplates(
            UUID tenantId,
            String studyId,
            ReorderTemplatesRequest request,
            UUID callerUserId,
            boolean canManageSiteAdmins
    ) {
        Study study = requireEmailTextManage(tenantId, studyId, callerUserId, canManageSiteAdmins);
        studyConfigurationService.reorderEmailTemplates(study.getTenantId(), study.getId(), request != null ? request.getSortedIds() : Collections.emptyList());
        return buildEmailTextSettingsResponse(study, true);
    }

    @Transactional
    public StudyEmailTextSettingsResponse createTextTemplate(
            UUID tenantId,
            String studyId,
            SaveTextTemplateRequest request,
            UUID callerUserId,
            boolean canManageSiteAdmins
    ) {
        Study study = requireEmailTextManage(tenantId, studyId, callerUserId, canManageSiteAdmins);
        studyConfigurationService.createTextTemplate(study.getTenantId(), study.getId(), request);
        return buildEmailTextSettingsResponse(study, true);
    }

    @Transactional
    public StudyEmailTextSettingsResponse updateTextTemplate(
            UUID tenantId,
            String studyId,
            String templateId,
            SaveTextTemplateRequest request,
            UUID callerUserId,
            boolean canManageSiteAdmins
    ) {
        Study study = requireEmailTextManage(tenantId, studyId, callerUserId, canManageSiteAdmins);
        studyConfigurationService.updateTextTemplate(study.getTenantId(), study.getId(), templateId, request);
        return buildEmailTextSettingsResponse(study, true);
    }

    @Transactional
    public StudyEmailTextSettingsResponse copyTextTemplate(
            UUID tenantId,
            String studyId,
            String templateId,
            UUID callerUserId,
            boolean canManageSiteAdmins
    ) {
        Study study = requireEmailTextManage(tenantId, studyId, callerUserId, canManageSiteAdmins);
        studyConfigurationService.copyTextTemplate(study.getTenantId(), study.getId(), templateId);
        return buildEmailTextSettingsResponse(study, true);
    }

    @Transactional
    public StudyEmailTextSettingsResponse archiveTextTemplate(
            UUID tenantId,
            String studyId,
            String templateId,
            UUID callerUserId,
            boolean canManageSiteAdmins
    ) {
        Study study = requireEmailTextManage(tenantId, studyId, callerUserId, canManageSiteAdmins);
        studyConfigurationService.archiveTextTemplate(study.getTenantId(), study.getId(), templateId);
        return buildEmailTextSettingsResponse(study, true);
    }

    @Transactional
    public StudyEmailTextSettingsResponse restoreTextTemplate(
            UUID tenantId,
            String studyId,
            String templateId,
            UUID callerUserId,
            boolean canManageSiteAdmins
    ) {
        Study study = requireEmailTextManage(tenantId, studyId, callerUserId, canManageSiteAdmins);
        studyConfigurationService.restoreTextTemplate(study.getTenantId(), study.getId(), templateId);
        return buildEmailTextSettingsResponse(study, true);
    }

    @Transactional
    public StudyEmailTextSettingsResponse deleteTextTemplate(
            UUID tenantId,
            String studyId,
            String templateId,
            UUID callerUserId,
            boolean canManageSiteAdmins
    ) {
        Study study = requireEmailTextManage(tenantId, studyId, callerUserId, canManageSiteAdmins);
        studyConfigurationService.deleteTextTemplate(study.getTenantId(), study.getId(), templateId);
        return buildEmailTextSettingsResponse(study, true);
    }

    @Transactional
    public StudyEmailTextSettingsResponse reorderTextTemplates(
            UUID tenantId,
            String studyId,
            ReorderTemplatesRequest request,
            UUID callerUserId,
            boolean canManageSiteAdmins
    ) {
        Study study = requireEmailTextManage(tenantId, studyId, callerUserId, canManageSiteAdmins);
        studyConfigurationService.reorderTextTemplates(study.getTenantId(), study.getId(), request != null ? request.getSortedIds() : Collections.emptyList());
        return buildEmailTextSettingsResponse(study, true);
    }

    @Transactional(readOnly = true)
    public StudyRequirementsResponse getStudyRequirements(
            UUID tenantId,
            String studyId,
            UUID callerUserId,
            boolean canManageSiteAdmins
    ) {
        Study study = findStudyByIdOrCode(tenantId, studyId)
                .orElseThrow(() -> new StudyNotFoundException("Study not found: " + studyId));
        boolean canManage = resolveCanManageStudySettings(study, studyId, callerUserId, canManageSiteAdmins);
        if (studyConfigurationService != null) {
            return studyConfigurationService.getStudyRequirements(study.getTenantId(), study.getId(), canManage);
        }
        StudyRequirementsResponse fallback = new StudyRequirementsResponse();
        fallback.setStudyId(study.getId().toString());
        fallback.setCanManage(canManage);
        return fallback;
    }

    @Transactional
    public StudyRequirementsResponse updateStudyRequirements(
            UUID tenantId,
            String studyId,
            UpdateStudyRequirementsRequest request,
            UUID callerUserId,
            boolean canManageSiteAdmins
    ) {
        Study study = findStudyByIdOrCode(tenantId, studyId)
                .orElseThrow(() -> new StudyNotFoundException("Study not found: " + studyId));
        requireStudySettingsManage(study, studyId, callerUserId, canManageSiteAdmins);
        if (studyConfigurationService == null) {
            throw new IllegalStateException("StudyConfigurationService is unavailable");
        }
        return studyConfigurationService.updateStudyRequirements(study.getTenantId(), study.getId(), request, true);
    }

    @Transactional
    public StudyMilestoneDto addStudyMilestone(
            UUID tenantId,
            String studyId,
            StudyMilestoneDto dto,
            UUID callerUserId,
            boolean canManageSiteAdmins
    ) {
        Study study = findStudyByIdOrCode(tenantId, studyId)
                .orElseThrow(() -> new StudyNotFoundException("Study not found: " + studyId));
        requireStudySettingsManage(study, studyId, callerUserId, canManageSiteAdmins);
        if (studyConfigurationService == null) {
            throw new IllegalStateException("StudyConfigurationService is unavailable");
        }
        return studyConfigurationService.addStudyMilestone(study.getTenantId(), study.getId(), dto);
    }

    @Transactional
    public StudyMilestoneDto updateStudyMilestone(
            UUID tenantId,
            String studyId,
            String milestoneId,
            StudyMilestoneDto dto,
            UUID callerUserId,
            boolean canManageSiteAdmins
    ) {
        Study study = findStudyByIdOrCode(tenantId, studyId)
                .orElseThrow(() -> new StudyNotFoundException("Study not found: " + studyId));
        requireStudySettingsManage(study, studyId, callerUserId, canManageSiteAdmins);
        if (studyConfigurationService == null) {
            throw new IllegalStateException("StudyConfigurationService is unavailable");
        }
        return studyConfigurationService.updateStudyMilestone(study.getTenantId(), study.getId(), milestoneId, dto);
    }

    @Transactional
    public void deleteStudyMilestone(
            UUID tenantId,
            String studyId,
            String milestoneId,
            UUID callerUserId,
            boolean canManageSiteAdmins
    ) {
        Study study = findStudyByIdOrCode(tenantId, studyId)
                .orElseThrow(() -> new StudyNotFoundException("Study not found: " + studyId));
        requireStudySettingsManage(study, studyId, callerUserId, canManageSiteAdmins);
        if (studyConfigurationService == null) {
            throw new IllegalStateException("StudyConfigurationService is unavailable");
        }
        studyConfigurationService.deleteStudyMilestone(study.getTenantId(), study.getId(), milestoneId);
    }

    @Transactional(readOnly = true)
    public List<StudyCustomVariableDto> getGlobalCustomVariables(
            UUID tenantId,
            String studyId,
            UUID callerUserId,
            boolean canManageSiteAdmins
    ) {
        Study study = findStudyByIdOrCode(tenantId, studyId)
                .orElseThrow(() -> new StudyNotFoundException("Study not found: " + studyId));
        resolveCanManageStudySettings(study, studyId, callerUserId, canManageSiteAdmins);
        if (studyConfigurationService == null) {
            return Collections.emptyList();
        }
        return studyConfigurationService.findTenantGlobalVariables(study.getTenantId());
    }

    @Transactional
    public StudyCustomVariableDto addGlobalVariableToStudy(
            UUID tenantId,
            String studyId,
            String variableId,
            UUID callerUserId,
            boolean canManageSiteAdmins
    ) {
        Study study = findStudyByIdOrCode(tenantId, studyId)
                .orElseThrow(() -> new StudyNotFoundException("Study not found: " + studyId));
        requireStudySettingsManage(study, studyId, callerUserId, canManageSiteAdmins);
        if (studyConfigurationService == null) {
            throw new IllegalStateException("StudyConfigurationService is unavailable");
        }
        return studyConfigurationService.addGlobalVariableToStudy(study.getTenantId(), study.getId(), variableId);
    }
}
