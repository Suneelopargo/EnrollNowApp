package com.enrollnow.audit;

import com.enrollnow.models.AdminAuditLog;
import com.enrollnow.models.User;
import com.enrollnow.repository.AdminAuditLogRepository;
import com.enrollnow.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditService {

    private static final Logger logger = LoggerFactory.getLogger(AuditService.class);

    private final AdminAuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public AuditService(AdminAuditLogRepository auditLogRepository, UserRepository userRepository) {
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public AdminAuditLog logEvent(
            String action,
            Long performedById,
            String performedByUsername,
            Long targetUserId,
            String targetUsername,
            String details,
            String ipAddress,
            Long locationId) {

        AdminAuditLog log = new AdminAuditLog();
        log.setAction(action);
        log.setPerformedByUsername(performedByUsername);
        log.setTargetUsername(targetUsername);
        log.setDetails(details);
        log.setIpAddress(ipAddress);
        log.setLocationId(locationId);

        if (performedById != null) {
            userRepository.findById(performedById).ifPresent(log::setPerformedBy);
        }
        if (targetUserId != null) {
            userRepository.findById(targetUserId).ifPresent(log::setTargetUser);
        }

        logger.info("AUDIT: Action=[{}] PerformedBy=[{}] Target=[{}] IP=[{}] Details=[{}]",
                action, performedByUsername, targetUsername, ipAddress, details);

        return auditLogRepository.save(log);
    }

    @Transactional
    public void logAuthSuccess(String username, Long userId, String ipAddress) {
        logEvent("LOGIN_SUCCESS", userId, username, userId, username, "Successful user authentication", ipAddress, null);
    }

    @Transactional
    public void logAuthFailure(String username, String reason, String ipAddress) {
        logEvent("LOGIN_FAILURE", null, username, null, username, "Failed authentication: " + reason, ipAddress, null);
    }

    @Transactional
    public void logLogout(String username, Long userId, String ipAddress) {
        logEvent("LOGOUT", userId, username, userId, username, "User session ended / client logout", ipAddress, null);
    }

    @Transactional
    public void logAdminAction(String action, String performerUsername, Long performerId, Long targetUserId, String targetUsername, String details, String ipAddress) {
        logEvent(action, performerId, performerUsername, targetUserId, targetUsername, details, ipAddress, null);
    }
}
