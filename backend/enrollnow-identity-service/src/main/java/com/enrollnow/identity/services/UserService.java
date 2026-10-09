package com.enrollnow.identity.services;

import com.enrollnow.identity.dtos.UserSummaryResponse;
import com.enrollnow.identity.exceptions.UserNotFoundException;
import com.enrollnow.identity.models.User;
import com.enrollnow.identity.repositories.RoleRepository;
import com.enrollnow.identity.repositories.UserEmailRepository;
import com.enrollnow.identity.repositories.UserRepository;
import com.enrollnow.identity.repositories.UserRoleAssignmentRepository;
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



import java.util.Locale;
import java.util.List;
import java.util.UUID;

@Service
public class UserService {

	private final UserRepository userRepository;
	private final UserEmailRepository userEmailRepository;
	private final UserSecurityStateRepository userSecurityStateRepository;
	private final RoleRepository roleRepository;
	private final UserRoleAssignmentRepository userRoleAssignmentRepository;

	public UserService(
	        UserRepository userRepository,
	        UserEmailRepository userEmailRepository,
	        UserSecurityStateRepository userSecurityStateRepository,
	        RoleRepository roleRepository,
	        UserRoleAssignmentRepository userRoleAssignmentRepository
	) {
	    this.userRepository = userRepository;
	    this.userEmailRepository = userEmailRepository;
	    this.userSecurityStateRepository = userSecurityStateRepository;
	    this.roleRepository = roleRepository;
	    this.userRoleAssignmentRepository = userRoleAssignmentRepository;
	}

	public UserSummaryResponse getUser(UUID tenantId, UUID userId) {

		User user = userRepository.findByTenantIdAndId(tenantId, userId)
				.orElseThrow(() -> new UserNotFoundException(userId));

		return toSummary(user);
	}

	public List<UserSummaryResponse> getUsers(UUID tenantId) {

	    return userRepository.findByTenantId(tenantId)
	            .stream()
	            .map(this::toSummary)
	            .toList();
	}
	private UserSummaryResponse toSummary(User user) {

		String primaryEmail = userEmailRepository
				.findByTenantIdAndUserIdAndPrimaryEmailTrue(user.getTenantId(), user.getId())
				.map(email -> email.getEmail()).orElse(null);

		return new UserSummaryResponse(user.getId(), user.getFirstName(), user.getLastName(), user.getTitle(),
				user.getStatus(), primaryEmail);
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

		return new UserSummaryResponse(user.getId(), user.getFirstName(), user.getLastName(), user.getTitle(),
				user.getStatus(), normalizedEmail);
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

	    return toSummary(user);
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

	    return toSummary(user);
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

	    // 5. Validate scopeId
	    if (scopeType.equals("TENANT")) {

	        if (scopeId != null) {
	            throw new IllegalArgumentException(
	                    "scopeId must be null for TENANT scope"
	            );
	        }

	    } else {

	        if (scopeId == null) {
	        	throw new InvalidRoleAssignmentException(
	        	        "scopeId is required for " + scopeType + " scope"
	        	);
	        }
	    }

	    // 6. Prevent duplicate active assignment
	    boolean alreadyAssigned;

	    if (scopeType.equals("TENANT")) {

	        alreadyAssigned =
	                userRoleAssignmentRepository
	                        .existsByTenantIdAndUserIdAndRoleIdAndSiteIdIsNullAndTeamIdIsNullAndStudyIdIsNullAndActiveTrue(
	                                tenantId,
	                                userId,
	                                role.getId()
	                        );

	    } else if (scopeType.equals("SITE")) {

	        alreadyAssigned =
	                userRoleAssignmentRepository
	                        .existsByTenantIdAndUserIdAndRoleIdAndSiteIdAndActiveTrue(
	                                tenantId,
	                                userId,
	                                role.getId(),
	                                scopeId
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
}