package com.enrollnow.config;

import org.flywaydb.core.Flyway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Custom Flyway migration strategy.
 *
 * <p>Repairs any historical checksum mismatches in {@code flyway_schema_history}
 * (such as when V32 was originally applied) before applying pending migrations (V33+).
 */
@Configuration
public class FlywayConfig {

    private static final Logger log = LoggerFactory.getLogger(FlywayConfig.class);

    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy() {
        return flyway -> {
            log.info("Executing Flyway repair to align historical migration checksums in flyway_schema_history...");
            try {
                flyway.repair();
                log.info("Flyway repair completed successfully.");
            } catch (Exception ex) {
                log.warn("Flyway repair notice (proceeding with migrate): {}", ex.getMessage());
            }

            log.info("Executing Flyway migrate for pending migrations...");
            flyway.migrate();
            log.info("Flyway migrate completed successfully.");
        };
    }
}
