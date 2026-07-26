-- V5__create_devices_table.sql
CREATE TABLE devices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    device_identifier VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    last_seen_at TIMESTAMP NULL,
    silo_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_devices_identifier UNIQUE (device_identifier),
    CONSTRAINT fk_devices_silo FOREIGN KEY (silo_id) REFERENCES silos (id)
        ON DELETE RESTRICT
);

CREATE INDEX idx_devices_silo_id ON devices (silo_id);
