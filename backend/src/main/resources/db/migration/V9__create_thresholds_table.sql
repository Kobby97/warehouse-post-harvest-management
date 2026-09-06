-- V9__create_thresholds_table.sql
-- One threshold configuration per silo. A silo with no row here simply
-- isn't evaluated yet (see ThresholdEvaluationService) — not an error.
CREATE TABLE thresholds (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    silo_id BIGINT NOT NULL,
    min_temperature_celsius DOUBLE NOT NULL,
    max_temperature_celsius DOUBLE NOT NULL,
    min_humidity_percent DOUBLE NOT NULL,
    max_humidity_percent DOUBLE NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_thresholds_silo UNIQUE (silo_id),
    CONSTRAINT fk_thresholds_silo FOREIGN KEY (silo_id) REFERENCES silos (id)
        ON DELETE RESTRICT
);
