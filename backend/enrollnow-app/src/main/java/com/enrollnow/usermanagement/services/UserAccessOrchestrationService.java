package com.enrollnow.usermanagement.services;

import java.util.UUID;

import com.enrollnow.common.audit.AuditRecorder;
import com.enrollnow.identity.services.UserService;
import com.enrollnow.study.services.StudyAccessService;
import com.enrollnow.usermanagement.dtos.CreateUserAccessRequest;
import com.enrollnow.usermanagement.dtos.UpdateUserAccessRequest;
import com.enrollnow.usermanagement.dtos.UpdateUserAccessRequest.StudyAccessItemRequest;

import org.springframework.stereotype.Service;
import com.enrollnow.identity.dtos.AssignRoleRequest;
import com.enrollnow.identity.dtos.UserSummaryResponse;
import com.enrollnow.study.dtos.GrantStudyAccessRequest;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import com.enrollnow.common.audit.AuditEntitySnapshot;
import com.enrollnow.common.audit.AuditRequest;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserAccessOrchestrationService {

	private final UserService userService;
	private final StudyAccessService studyAccessService;
	private final AuditRecorder auditRecorder;

	public UserAccessOrchestrationService(UserService userService, StudyAccessService studyAccessService,
			AuditRecorder auditRecorder) {
		this.userService = userService;
		this.studyAccessService = studyAccessService;
		this.auditRecorder = auditRecorder;
	}

	@Transactional
	public void updateUserAccess(UUID tenantId, UUID userId, UpdateUserAccessRequest request) {

		List<AuditEntitySnapshot> snapshots = new ArrayList<>();

		/*
		 * 1. USER PROFILE
		 */
		if (request.getUser() != null) {

			Map<String, Object> beforeUser = userService.getUserAuditSnapshot(tenantId, userId);

			userService.updateUser(tenantId, userId, request.getUser());

			Map<String, Object> afterUser = userService.getUserAuditSnapshot(tenantId, userId);

			snapshots.add(new AuditEntitySnapshot("USER", userId, beforeUser, afterUser));
		}

		/*
		 * 2. SITE ACCESS
		 */
		if (request.getSiteAccess() != null) {

			UpdateUserAccessRequest.SiteAccessRequest siteAccess = request.getSiteAccess();

			UUID siteId = siteAccess.getSiteId();

			Map<String, Object> beforeSite = userService.getSiteAccessAuditSnapshot(tenantId, userId, siteId);

			String sitePermission = siteAccess.getSitePermission();

			if (sitePermission == null || sitePermission.isBlank() || "NONE".equalsIgnoreCase(sitePermission)) {

				userService.removeSiteRole(tenantId, userId, siteId);

			} else {

				AssignRoleRequest assignRoleRequest = new AssignRoleRequest(sitePermission, "SITE", siteId);

				userService.assignRole(tenantId, userId, assignRoleRequest);
			}

			Map<String, Object> afterSite = userService.getSiteAccessAuditSnapshot(tenantId, userId, siteId);

			snapshots.add(new AuditEntitySnapshot("USER", userId, beforeSite, afterSite));
		}

		/*
		 * 3. STUDY ACCESS
		 */
		if (request.getStudies() != null) {

			for (UpdateUserAccessRequest.StudyAccessItemRequest studyAccess : request.getStudies()) {

				if (studyAccess == null) {
					continue;
				}

				UUID studyId = studyAccess.getStudyId();

				Map<String, Object> beforeStudy = studyAccessService.getStudyAccessAuditSnapshot(tenantId, studyId,
						userId);

				String studyPermission = studyAccess.getStudyPermission();

				if (studyPermission == null || studyPermission.isBlank() || "NONE".equalsIgnoreCase(studyPermission)) {

					studyAccessService.removeStudyAccess(tenantId, studyId, userId);

				} else {

					GrantStudyAccessRequest grantRequest = new GrantStudyAccessRequest();

					grantRequest.setStudyRole(studyAccess.getStudyRole());

					grantRequest.setStudyPermission(studyPermission);

					studyAccessService.grantStudyAccess(tenantId, studyId, userId, grantRequest);
				}

				Map<String, Object> afterStudy = studyAccessService.getStudyAccessAuditSnapshot(tenantId, studyId,
						userId);

				snapshots.add(new AuditEntitySnapshot("STUDY", studyId, beforeStudy, afterStudy));
			}
		}

		/*
		 * 4. ONE audit call for the whole Save operation.
		 *
		 * AuditRecorder automatically: - compares before / after - ignores unchanged
		 * fields - creates field history - suppresses event if nothing changed
		 */
		if (!snapshots.isEmpty()) {

			auditRecorder.record(new AuditRequest(tenantId, "USER", userId, "USER_ACCESS_UPDATED",
					"User access updated", "API", snapshots));
		}
	}

	@Transactional
	public UserSummaryResponse createUserWithAccess(UUID tenantId, CreateUserAccessRequest request) {

		// 1. create user using business service only
		UserSummaryResponse createdUser = userService.createUser(tenantId, request.getUser());

		UUID userId = createdUser.getId();

		// 2. collect USER after snapshot
		Map<String, Object> userAfter = userService.getUserAuditSnapshot(tenantId, userId);

		List<AuditEntitySnapshot> snapshots = new ArrayList<>();

		snapshots.add(new AuditEntitySnapshot("USER", userId, null, userAfter));

		// 3. site access
		if (request.getSiteAccess() != null) {

			var site = request.getSiteAccess();

			Map<String, Object> beforeSite = userService.getSiteAccessAuditSnapshot(tenantId, userId, site.getSiteId());

			AssignRoleRequest roleRequest = new AssignRoleRequest(site.getSitePermission(), "SITE", site.getSiteId());

			userService.assignRole(tenantId, userId, roleRequest);

			Map<String, Object> afterSite = userService.getSiteAccessAuditSnapshot(tenantId, userId, site.getSiteId());

			snapshots.add(new AuditEntitySnapshot("USER", userId, beforeSite, afterSite));
		}

		// 4. studies
		if (request.getStudies() != null) {

			for (StudyAccessItemRequest study : request.getStudies()) {

				UUID studyId = study.getStudyId();

				Map<String, Object> beforeStudy = studyAccessService.getStudyAccessAuditSnapshot(tenantId, studyId,
						userId);

				GrantStudyAccessRequest grantRequest = new GrantStudyAccessRequest();

				grantRequest.setStudyRole(study.getStudyRole());

				grantRequest.setStudyPermission(study.getStudyPermission());

				studyAccessService.grantStudyAccess(tenantId, studyId, userId, grantRequest);

				Map<String, Object> afterStudy = studyAccessService.getStudyAccessAuditSnapshot(tenantId, studyId,
						userId);

				snapshots.add(new AuditEntitySnapshot("STUDY", studyId, beforeStudy, afterStudy));
			}
		}

		// 5. exactly one audit call
		auditRecorder.record(new AuditRequest(tenantId, "USER", userId, "USER_CREATED_WITH_ACCESS",
				"User created with access", "API", snapshots));

		UUID siteId = request.getSiteAccess() != null ? request.getSiteAccess().getSiteId() : null;

		return userService.getUser(tenantId, userId, siteId);
	}
}