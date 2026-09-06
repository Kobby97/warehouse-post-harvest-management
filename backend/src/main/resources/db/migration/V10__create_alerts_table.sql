-- V10__create_alerts_table.sql
CREATE TABLE alerts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    silo_id BIGINT NOT NULL,
    reading_id BIGINT NOT NULL,
    breach_type VARCHAR(30) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    message VARCHAR(255) NOT NULL,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_alerts_silo FOREIGN KEY (silo_id) REFERENCES silos (id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_alerts_reading FOREIGN KEY (reading_id) REFERENCES sensor_readings (id)
        ON DELETE RESTRICT
);

-- Supports the duplicate-prevention check: "is there already an ACTIVE
-- alert for this silo + breach type?"
CREATE INDEX idx_alerts_silo_status ON alerts (silo_id, status);
