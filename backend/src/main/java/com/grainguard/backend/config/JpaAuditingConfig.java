package com.grainguard.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Enables @CreatedDate / @LastModifiedDate support used by BaseEntity.
 * Without this, those fields would silently stay null.
 */
@Configuration
@EnableJpaAuditing
public class JpaAuditingConfig {
}
