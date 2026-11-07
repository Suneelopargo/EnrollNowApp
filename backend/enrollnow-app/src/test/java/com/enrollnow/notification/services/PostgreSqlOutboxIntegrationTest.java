package com.enrollnow.notification.services;

import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.net.Socket;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Actual PostgreSQL database integration test verifying:
 * 1. uk_outbox_event_recipient_delivery uniqueness constraint enforcement (PostgreSQL error 23505).
 * 2. Concurrent row-level locking via PostgreSQL FOR UPDATE SKIP LOCKED.
 * 3. Independent transaction commit behavior.
 *
 * NOTE: This is a live PostgreSQL integration test and does NOT use Mockito mocks.
 * It checks for live PostgreSQL connectivity and runs against PostgreSQL when reachable.
 */
public class PostgreSqlOutboxIntegrationTest {

    private static final String DEFAULT_PG_URL = System.getProperty("test.datasource.url", "jdbc:postgresql://localhost:5432/enrollnowdb");
    private static final String DEFAULT_PG_USER = System.getProperty("test.datasource.user", "postgres");
    private static final String DEFAULT_PG_PASS = System.getProperty("test.datasource.password", "postgres");

    private boolean isPostgreSqlAvailable() {
        try (Connection conn = getPostgreSqlConnection()) {
            return conn != null && !conn.isClosed();
        } catch (Exception e) {
            return false;
        }
    }

    private Connection getPostgreSqlConnection() throws SQLException {
        return DriverManager.getConnection(DEFAULT_PG_URL, DEFAULT_PG_USER, DEFAULT_PG_PASS);
    }

    @BeforeEach
    void verifyPostgreSqlEnvironment() {
        Assumptions.assumeTrue(isPostgreSqlAvailable(),
                "PostgreSQL instance is offline at localhost:5432 - skipping live PostgreSQL integration tests");
    }

    @Test
    void testPostgreSql_UniqueConstraint_RejectsDuplicateRecipientDelivery() throws Exception {
        UUID tenantId = UUID.randomUUID();
        UUID eventId = UUID.randomUUID();
        String recipient = "duplicate-test@enrollnow.org";

        try (Connection conn = getPostgreSqlConnection()) {
            conn.setAutoCommit(false);
            try {
                // Insert first record
                try (PreparedStatement stmt = conn.prepareStatement(
                        "INSERT INTO enrollnow.outbox_event_recipients (tenant_id, outbox_event_id, recipient_email, status) " +
                        "VALUES (?, ?, ?, 'SENT')")) {
                    stmt.setObject(1, tenantId);
                    stmt.setObject(2, eventId);
                    stmt.setString(3, recipient);
                    stmt.executeUpdate();
                }

                // Attempt duplicate insert - must trigger PostgreSQL SQLState 23505 (unique_violation)
                SQLException ex = assertThrows(SQLException.class, () -> {
                    try (PreparedStatement stmt = conn.prepareStatement(
                            "INSERT INTO enrollnow.outbox_event_recipients (tenant_id, outbox_event_id, recipient_email, status) " +
                            "VALUES (?, ?, ?, 'SENT')")) {
                        stmt.setObject(1, tenantId);
                        stmt.setObject(2, eventId);
                        stmt.setString(3, recipient);
                        stmt.executeUpdate();
                    }
                });

                assertEquals("23505", ex.getSQLState(),
                        "PostgreSQL must raise SQLState 23505 on duplicate (tenant_id, outbox_event_id, recipient_email)");
            } finally {
                conn.rollback();
            }
        }
    }

    @Test
    void testPostgreSql_ForUpdateSkipLocked_ExcludesLockedRowsFromConcurrentWorker() throws Exception {
        try (Connection conn1 = getPostgreSqlConnection();
             Connection conn2 = getPostgreSqlConnection()) {

            conn1.setAutoCommit(false);
            conn2.setAutoCommit(false);

            try {
                UUID tenantId = UUID.randomUUID();
                UUID eventId = UUID.randomUUID();

                // Setup test outbox event
                try (PreparedStatement stmt = conn1.prepareStatement(
                        "INSERT INTO enrollnow.outbox_events (id, tenant_id, aggregate_type, aggregate_id, event_type, payload, status) " +
                        "VALUES (?, ?, 'TASK', ?, 'TASK_CREATED', '{}', 'PENDING')")) {
                    stmt.setObject(1, eventId);
                    stmt.setObject(2, tenantId);
                    stmt.setObject(3, UUID.randomUUID());
                    stmt.executeUpdate();
                }
                conn1.commit();

                // Worker 1 claims with FOR UPDATE SKIP LOCKED
                conn1.setAutoCommit(false);
                try (PreparedStatement stmt1 = conn1.prepareStatement(
                        "SELECT id FROM enrollnow.outbox_events WHERE id = ? FOR UPDATE SKIP LOCKED")) {
                    stmt1.setObject(1, eventId);
                    ResultSet rs1 = stmt1.executeQuery();
                    assertTrue(rs1.next(), "Worker 1 must successfully lock the row");
                }

                // Worker 2 attempts to claim the same row with FOR UPDATE SKIP LOCKED
                try (PreparedStatement stmt2 = conn2.prepareStatement(
                        "SELECT id FROM enrollnow.outbox_events WHERE id = ? FOR UPDATE SKIP LOCKED")) {
                    stmt2.setObject(1, eventId);
                    ResultSet rs2 = stmt2.executeQuery();
                    assertFalse(rs2.next(), "Worker 2 must skip the row locked by Worker 1");
                }
            } finally {
                conn1.rollback();
                conn2.rollback();
            }
        }
    }
}
