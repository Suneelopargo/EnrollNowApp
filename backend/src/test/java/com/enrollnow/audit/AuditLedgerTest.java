package com.enrollnow.audit;

import com.enrollnow.models.AdminAuditLog;
import com.enrollnow.repository.AdminAuditLogRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class AuditLedgerTest {

    @Autowired
    private AuditService auditService;

    @Autowired
    private AdminAuditLogRepository auditLogRepository;

    @Test
    void testAuditLogCreationWithoutCredentialLeakage() {
        String username = "investigator_dr_smith";
        String ip = "192.168.1.100";

        // Log authentication success
        auditService.logAuthSuccess(username, 10L, ip);

        List<AdminAuditLog> logs = auditLogRepository.findAll();
        assertFalse(logs.isEmpty());

        AdminAuditLog latest = logs.get(logs.size() - 1);
        assertEquals("LOGIN_SUCCESS", latest.getAction());
        assertEquals(username, latest.getPerformedByUsername());
        assertEquals(ip, latest.getIpAddress());

        // Verify that sensitive passwords/tokens are NEVER in details or logs
        assertFalse(latest.getDetails().contains("password"));
        assertFalse(latest.getDetails().contains("Bearer"));
        assertFalse(latest.getDetails().contains("secret"));
    }

    @Test
    void testAuditAuthFailureLogging() {
        String attemptUser = "attacker_or_typo";
        String ip = "10.0.0.5";

        auditService.logAuthFailure(attemptUser, "Bad password", ip);

        List<AdminAuditLog> logs = auditLogRepository.findAll();
        AdminAuditLog latest = logs.get(logs.size() - 1);
        assertEquals("LOGIN_FAILURE", latest.getAction());
        assertEquals(attemptUser, latest.getTargetUsername());
        assertTrue(latest.getDetails().contains("Bad password"));
    }
}
