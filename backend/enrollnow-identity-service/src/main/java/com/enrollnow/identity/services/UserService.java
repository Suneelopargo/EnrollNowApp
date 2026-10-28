package com.enrollnow.identity.services;

import com.enrollnow.identity.dtos.UserEffectivePermissionsResponse;
import com.enrollnow.identity.dtos.UserSummaryResponse;
import com.enrollnow.identity.exceptions.UserNotFoundException;
import com.enrollnow.identity.models.User;
import com.enrollnow.identity.repositories.RoleRepository;
import com.enrollnow.identity.repositories.UserEmailRepository;
import com.enrollnow.identity.repositories.UserRepository;
import com.enrollnow.identity.repositories.UserRoleAssignmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.enrollnow.identity.dtos.CreateUserRequest;
import com.enrollnow.identity.dtos.UpdateUserRequest;
import com.enrollnow.identity.exceptions.DuplicateRoleAssignmentException;
import com.enrollnow.identity.exceptions.EmailAlreadyExistsException;
import com.enrollnow.identity.exceptions.InvalidRoleAssignmentException;
import com.enrollnow.identity.exceptions.RoleNotFoundException;
import com.enrollnow.identity.models.UserEmail;
import com.enrollnow.identity.models.UserSecurityState;
import com.enrollnow.identity.repositories.UserSecurityStateRepository;
import org.springframework.transaction.annotation.Transactional;

import com.enrollnow.identity.dtos.AssignRoleRequest;
import com.enrollnow.identity.models.Role;
import com.enrollnow.identity.models.UserRoleAssignment;

import java.util.Map;
import com.enrollnow.common.audit.AuditEventCommand;
import com.enrollnow.common.audit.AuditRecorder;
import com.enrollnow.common.audit.AuditChange;

import java.util.Locale;
import com.enrollnow.identity.models.Site;
import com.enrollnow.identity.repositories.SiteRepository;

import java.util.List;
import java.util.UUID;

@Service
public class UserService {

	private final UserRepository userRepository;
	private final UserEmailRepository userEmailRepository;
	private final UserSecurityStateRepository userSecurityStateRepository;
	private final RoleRepository roleRepository;
	private final UserRoleAssignmentRepository userRoleAssignmentRepository;
	private final SiteRepository siteRepository;
	private final SitePermissionService sitePermissionService;
	private final AuditRecorder auditRecorder;

	public UserService(
	        UserRepository userRepository,
	        UserEmailRepository userEmailRepository,
	        UserSecurityStateRepository userSecurityStateRepository,
	        RoleRepository roleRepository,
	        UserRoleAssignmentRepository userRoleAssignmentRepository,
	        SiteRepository siteRepository
	) {
	    this(
	            userRepository,
	            userEmailRepository,
	            userSecurityStateRepository,
	            roleRepository,
	            userRoleAssignmentRepository,
	            siteRepository,
	            null,
	            null
	    );
	}

	@Autowired
	public UserService(
	        UserRepository userRepository,
	        UserEmailRepository userEmailRepository,
	        UserSecurityStateRepository userSecurityStateRepository,
	        RoleRepository roleRepository,
	        UserRoleAssignmentRepository userRoleAssignmentRepository,
	        SiteRepository siteRepository,
	        SitePermissionService sitePermissionService,
	        AuditRecorder auditRecorder
	) {
	    this.userRepository = userRepository;
	    this.userEmailRepository = userEmailRepository;
	    this.userSecurityStateRepository = userSecurityStateRepository;
	    this.roleRepository = roleRepository;
	    this.userRoleAssignmentRepository = userRoleAssignmentRepository;
	    this.siteRepository = siteRepository;
	    this.sitePermissionService = sitePermissionService;
	    this.auditRecorder = auditRecorder;
	}

	public UserSummaryResponse getUser(UUID tenantId, UUID userId) {
	    return getUser(tenantId, userId, null);
	}

	public UserSummaryResponse getUser(UUID tenantId, UUID userId, UUID siteId) {

		User user = userRepository.findByTenantIdAndId(tenantId, userId)
				.orElseThrow(() -> new UserNotFoundException(userId));

		return toSummary(user, siteId);
	}

	public List<UserSummaryResponse> getUsers(UUID tenantId) {

	    return userRepository.findByTenantIdOrderByCreatedAtDesc(tenantId)
	            .stream()
	            .map(u -> toSummary(u, null))
	            .toList();
	}

	private UserSummaryResponse toSummary(User user, UUID requestedSiteId) {

		String primaryEmail = userEmailRepository
				.findByTenantIdAndUserIdAndPrimaryEmailTrue(user.getTenantId(), user.getId())
				.map(email -> email.getEmail()).orElse(null);

		UserSummaryResponse summary = new UserSummaryResponse(
		        user.getId(),
		        user.getFirstName(),
		        user.getLastName(),
		        user.getTitle(),
		        user.getStatus(),
		        primaryEmail
		);
		summary.setTenantId(user.getTenantId());

		if (sitePermissionService != null) {
		    UserEffectivePermissionsResponse effective =
		            sitePermissionService.resolveEffectivePermissions(
		                    user.getTenantId(),
		                    user.getId(),
		                    requestedSiteId
		            );
		    if (effective != null) {
		        summary.setSiteId(effective.getSiteId());
		        summary.setSiteRole(effective.getSiteRole());
		        summary.setSitePermissionLabel(effective.getSitePermissionLabel());
		        summary.setRoles(effective.getRoles());
		        summary.setPermissions(effective.getPermissions());
		        summary.setSiteAssignments(effective.getSiteAssignments());
		        summary.setCanAccessRegistry(effective.isCanAccessRegistry());
		        summary.setCanAccessSiteAdmin(effective.isCanAccessSiteAdmin());
		    }
		}

		return summary;
	}

	@Transactional
	public UserSummaryResponse createUser(UUID tenantId, CreateUserRequest request) {

		String normalizedEmail =
		        request.getEmail().trim().toLowerCase(Locale.ROOT);

		if (userEmailRepository.existsByTenantIdAndEmailIgnoreCase(tenantId, normalizedEmail)) {
			throw new EmailAlreadyExistsException(normalizedEmail);
		}

		User user = new User();

		user.setTenantId(tenantId);
		user.setFirstName(request.getFirstName());
		user.setLastName(request.getLastName());
		user.setTitle(request.getTitle());
		user.setTimezone(request.getTimezone());
		user.setStatus("ACTIVE");

		user = userRepository.save(user);

		UserEmail userEmail = new UserEmail();

		userEmail.setTenantId(tenantId);
		userEmail.setUserId(user.getId());
		userEmail.setEmail(normalizedEmail);
		userEmail.setVerified(false);
		userEmail.setPrimaryEmail(true);

		userEmailRepository.save(userEmail);

		UserSecurityState securityState = new UserSecurityState();

		securityState.setTenantId(tenantId);
		securityState.setUserId(user.getId());
		securityState.setFailedLoginAttempts(0);

		userSecurityStateRepository.save(securityState);
		
		// Audit transaction
		
		if (auditRecorder != null) {
		    auditRecorder.record(
		            new AuditEventCommand(
		                    tenantId,
		                    null,
		                    "USER",
		                    user.getId(),
		                    "USER_CREATED",
		                    "User account created",
		                    "API",
		                    null,
		                    null,
		                    null,
		                    Map.of(
		                            "firstName", user.getFirstName(),
		                            "lastName", user.getLastName(),
		                            "title", user.getTitle(),
		                            "status", user.getStatus(),
		                            "email", normalizedEmail
		                    ),
		                    null
		            )
		    );
		}

		UserSummaryResponse summary = new UserSummaryResponse(
		        user.getId(),
		        user.getFirstName(),
		        user.getLastName(),
		        user.getTitle(),
		        user.getStatus(),
		        normalizedEmail
		);
		summary.setTenantId(tenantId);
		return summary;
	}
	
	@Transactional
	public UserSummaryResponse updateUser(
	        UUID tenantId,
	        UUID userId,
	        UpdateUserRequest request
	) {

	    User user = userRepository.findByTenantIdAndId(tenantId, userId)
	            .orElseThrow(() -> new UserNotFoundException(userId));

	    user.setFirstName(request.getFirstName().trim());
	    user.setLastName(request.getLastName().trim());

	    user.setTitle(
	            request.getTitle() == null
	                    ? null
	                    : request.getTitle().trim()
	    );

	    user.setTimezone(
	            request.getTimezone() == null
	                    ? null
	                    : request.getTimezone().trim()
	    );

	    userRepository.save(user);

	    return toSummary(user, null);
	}
	
	@Transactional
	public UserSummaryResponse deactivateUser(
	        UUID tenantId,
	        UUID userId
	) {

	    User user = userRepository.findByTenantIdAndId(tenantId, userId)
	            .orElseThrow(() -> new UserNotFoundException(userId));

	    user.setStatus("DISABLED");

	    userRepository.save(user);

	    return toSummary(user, null);
	}

	@Transactional
	public UserSummaryResponse activateUser(
	        UUID tenantId,
	        UUID userId
	) {

	    User user = userRepository.findByTenantIdAndId(tenantId, userId)
	            .orElseThrow(() -> new UserNotFoundException(userId));

	    user.setStatus("ACTIVE");

	    userRepository.save(user);

	    return toSummary(user, null);
	}
	
	@Transactional
	public UserRoleAssignment assignRole(
	        UUID tenantId,
	        UUID userId,
	        AssignRoleRequest request
	) {

	    // 1. User must belong to this tenant
	    userRepository.findByTenantIdAndId(tenantId, userId)
	            .orElseThrow(() -> new UserNotFoundException(userId));

	    // 2. Resolve role by stable business code
	    String roleCode = request.getRoleCode().trim().toUpperCase(Locale.ROOT);

	    Role role = roleRepository.findByCode(roleCode)
	            .orElseThrow(() ->
	                    new RoleNotFoundException(roleCode));
	              

	    // 3. Only these scopes are supported in Sprint 1
	    String scopeType =
	            request.getScopeType().trim().toUpperCase(Locale.ROOT);

	    if (!scopeType.equals("TENANT")
	            && !scopeType.equals("SITE")
	            && !scopeType.equals("STUDY")) {

	    	throw new InvalidRoleAssignmentException(
	    	        "Unsupported scope type: " + scopeType
	    	);
	    }

	    // 4. Requested scope must match the role's defined scope
	    if (!scopeType.equalsIgnoreCase(role.getScopeType())) {
	    	throw new InvalidRoleAssignmentException(
	    	        "Role " + role.getCode()
	    	                + " has scope " + role.getScopeType()
	    	                + " and cannot be assigned at scope "
	    	                + scopeType
	    	);
	    }

	    UUID scopeId = request.getScopeId();

	    // 5. Validate / resolve scopeId
	    if (scopeType.equals("TENANT")) {

	        if (scopeId != null) {
	            throw new IllegalArgumentException(
	                    "scopeId must be null for TENANT scope"
	            );
	        }

	    } else if (scopeType.equals("SITE")) {

	        if (scopeId != null) {
	            final UUID requestedSiteScopeId = scopeId;
	            siteRepository.findById(requestedSiteScopeId).ifPresent(site -> {
	                if (!tenantId.equals(site.getTenantId())) {
	                    throw new InvalidRoleAssignmentException(
	                            "Site " + requestedSiteScopeId + " does not belong to tenant " + tenantId
	                    );
	                }
	            });
	        } else {
	            // 1. Try existing active site assignment for this user
	            List<UserRoleAssignment> activeSite =
	                    userRoleAssignmentRepository
	                            .findByTenantIdAndUserIdAndSiteIdIsNotNullAndActiveTrue(
	                                    tenantId,
	                                    userId
	                            );
	            if (!activeSite.isEmpty()) {
	                scopeId = activeSite.get(0).getSiteId();
	            }

	            if (scopeId == null) {
	                // 2. Try finding active site for this tenant
	                scopeId = siteRepository
	                        .findFirstByTenantIdAndActiveTrueOrderByNameAsc(tenantId)
	                        .map(Site::getId)
	                        .orElse(null);
	            }

	            if (scopeId == null) {
	                // 3. Try finding any site for this tenant
	                scopeId = siteRepository
	                        .findFirstByTenantId(tenantId)
	                        .map(Site::getId)
	                        .orElse(null);
	            }

	            if (scopeId == null) {
	                // 4. Fallback to any active site assignment in this tenant
	                List<UserRoleAssignment> tenantSiteAssignments =
	                        userRoleAssignmentRepository
	                                .findByTenantIdAndSiteIdIsNotNullAndActiveTrue(tenantId);
	                if (!tenantSiteAssignments.isEmpty()) {
	                    scopeId = tenantSiteAssignments.get(0).getSiteId();
	                }
	            }

	            if (scopeId == null) {
	                // 5. Auto-provision default site for this tenant
	                try {
	                    Site defaultSite = new Site();
	                    defaultSite.setTenantId(tenantId);
	                    defaultSite.setSiteCode("MAIN-SITE");
	                    defaultSite.setName("Main Site");
	                    defaultSite.setActive(true);
	                    defaultSite = siteRepository.save(defaultSite);
	                    scopeId = defaultSite.getId();
	                } catch (Exception ex) {
	                    scopeId = siteRepository
	                            .findFirstByTenantId(tenantId)
	                            .map(Site::getId)
	                            .orElse(null);
	                }
	            }
	        }

	        if (scopeId == null) {
	            throw new InvalidRoleAssignmentException(
	                    "scopeId is required for SITE scope and no active site could be resolved"
	            );
	        }

	    } else {

	        if (scopeId == null) {
	        	throw new InvalidRoleAssignmentException(
	        	        "scopeId is required for " + scopeType + " scope"
	        	);
	        }
	    }

	    // 6. Prevent duplicate active assignment / manage single active site permission per site
	    if (scopeType.equals("SITE")) {
	        List<UserRoleAssignment> activeSiteAssignments =
	                userRoleAssignmentRepository
	                        .findByTenantIdAndUserIdAndSiteIdAndActiveTrue(
	                                tenantId,
	                                userId,
	                                scopeId
	                        );

	        UserRoleAssignment targetAssignment = null;
	        for (UserRoleAssignment existing : activeSiteAssignments) {
	            if (existing.getTeamId() != null || existing.getStudyId() != null) {
	                continue;
	            }
	            if (targetAssignment == null) {
	                targetAssignment = existing;
	            } else {
	                existing.setActive(false);
	                userRoleAssignmentRepository.save(existing);
	            }
	        }

	        if (targetAssignment != null) {
	            if (targetAssignment.getRoleId().equals(role.getId())) {
	                return targetAssignment;
	            }

	            String previousRoleCode = roleRepository
	                    .findById(targetAssignment.getRoleId())
	                    .map(Role::getCode)
	                    .orElse("UNKNOWN");

	            targetAssignment.setRoleId(role.getId());
	            targetAssignment.setActive(true);

	            UserRoleAssignment savedAssignment =
	                    userRoleAssignmentRepository.saveAndFlush(targetAssignment);

	            if (auditRecorder != null) {
	                auditRecorder.record(
	                        new AuditEventCommand(
	                                tenantId,
	                                null,
	                                "USER",
	                                userId,
	                                "SITE_PERMISSION_CHANGED",
	                                "User site permission changed",
	                                "API",
	                                null,
	                                null,
	                                Map.of(
	                                        "siteId", scopeId,
	                                        "sitePermission", previousRoleCode
	                                ),
	                                Map.of(
	                                        "siteId", scopeId,
	                                        "sitePermission", role.getCode()
	                                ),
	                                List.of(
	                                        new AuditChange(
	                                                "sitePermission",
	                                                previousRoleCode,
	                                                role.getCode()
	                                        )
	                                )
	                        )
	                );
	            }

	            return savedAssignment;
	        }

	    } else {

	        boolean alreadyAssigned;

	        if (scopeType.equals("TENANT")) {

	            alreadyAssigned =
	                    userRoleAssignmentRepository
	                            .existsByTenantIdAndUserIdAndRoleIdAndSiteIdIsNullAndTeamIdIsNullAndStudyIdIsNullAndActiveTrue(
	                                    tenantId,
	                                    userId,
	                                    role.getId()
	                            );

	        } else {

	            alreadyAssigned =
	                    userRoleAssignmentRepository
	                            .existsByTenantIdAndUserIdAndRoleIdAndStudyIdAndActiveTrue(
	                                    tenantId,
	                                    userId,
	                                    role.getId(),
	                                    scopeId
	                            );
	        }

	        if (alreadyAssigned) {
	            throw new DuplicateRoleAssignmentException();
	        }
	    }

	    // 7. Create assignment
	    UserRoleAssignment assignment = new UserRoleAssignment();

	    assignment.setTenantId(tenantId);
	    assignment.setUserId(userId);
	    assignment.setRoleId(role.getId());
	    assignment.setActive(true);

	    if (scopeType.equals("SITE")) {
	        assignment.setSiteId(scopeId);
	    }

	    if (scopeType.equals("STUDY")) {
	        assignment.setStudyId(scopeId);
	    }

	    return userRoleAssignmentRepository.save(assignment);
	}

	@Transactional
	public void removeSiteRole(UUID tenantId, UUID userId) {
	    removeSiteRole(tenantId, userId, null);
	}

	@Transactional
	public void removeSiteRole(UUID tenantId, UUID userId, UUID siteId) {
	    userRepository.findByTenantIdAndId(tenantId, userId)
	            .orElseThrow(() -> new UserNotFoundException(userId));

	    List<UserRoleAssignment> activeSiteAssignments =
	            siteId != null
	                    ? userRoleAssignmentRepository.findByTenantIdAndUserIdAndSiteIdAndActiveTrue(tenantId, userId, siteId)
	                    : userRoleAssignmentRepository.findByTenantIdAndUserIdAndSiteIdIsNotNullAndActiveTrue(tenantId, userId);

	    for (UserRoleAssignment assignment : activeSiteAssignments) {
	        if (assignment.getTeamId() != null || assignment.getStudyId() != null) {
	            continue;
	        }

	        String previousRoleCode = roleRepository
	                .findById(assignment.getRoleId())
	                .map(Role::getCode)
	                .orElse("UNKNOWN");

	        assignment.setActive(false);
	        userRoleAssignmentRepository.save(assignment);

	        if (auditRecorder != null) {
	            auditRecorder.record(
	                    new AuditEventCommand(
	                            tenantId,
	                            null,
	                            "USER",
	                            userId,
	                            "SITE_PERMISSION_REMOVED",
	                            "User site permission removed",
	                            "API",
	                            null,
	                            null,
	                            Map.of(
	                                    "siteId", assignment.getSiteId(),
	                                    "sitePermission", previousRoleCode
	                            ),
	                            Map.of(
	                                    "siteId", assignment.getSiteId(),
	                                    "sitePermission", "NONE"
	                            ),
	                            List.of(
	                                    new AuditChange(
	                                            "sitePermission",
	                                            previousRoleCode,
	                                            "NONE"
	                                    )
	                            )
	                    )
	            );
	        }
	    }
	}
}