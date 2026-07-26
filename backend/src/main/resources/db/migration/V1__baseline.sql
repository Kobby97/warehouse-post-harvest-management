-- V1__baseline.sql
-- Purpose: confirm Flyway is correctly wired to the MySQL instance before
-- any real domain tables exist (those arrive in Milestone M1).
--
-- This table is intentionally trivial and will be dropped/superseded once
-- real entities are introduced. It exists purely to prove:
--   1. Flyway can connect and apply migrations on startup
--   2. Migration history is tracked correctly (see flyway_schema_history)

CREATE TABLE schema_bootstrap_check (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    note VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO schema_bootstrap_check (note) VALUES ('GrainGuard schema initialized successfully');
