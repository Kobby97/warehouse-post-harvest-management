-- V11__create_ventilation_actions_table.sql
-- Records what the system decided to do in response to a CRITICAL alert.
-- This is a logged decision only — no command is sent to real hardware.
-- The ESP32 already handles its own instant local response (LED/buzzer)
-- independently; this is a parallel software record, not a replacement.
CREATE TABLE ventilation_actions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    alert_id BIGINT NOT NULL,
    silo_id BIGINT NOT NULL,
    description VARCHAR(500) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_ventilation_actions_alert FOREIGN KEY (alert_id) REFERENCES alerts (id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_ventilation_actions_silo FOREIGN KEY (silo_id) REFERENCES silos (id)
        ON DELETE RESTRICT
);

CREATE INDEX idx_ventilation_actions_silo_created ON ventilation_actions (silo_id, created_at DESC);
