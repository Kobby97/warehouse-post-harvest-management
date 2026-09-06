-- V8__create_sensor_readings_table.sql
CREATE TABLE sensor_readings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    device_id BIGINT NOT NULL,
    silo_id BIGINT NOT NULL,
    temperature_celsius DOUBLE NOT NULL,
    humidity_percent DOUBLE NOT NULL,
    distance_cm DOUBLE NOT NULL,
    fill_percentage DOUBLE NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_sensor_readings_device FOREIGN KEY (device_id) REFERENCES devices (id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_sensor_readings_silo FOREIGN KEY (silo_id) REFERENCES silos (id)
        ON DELETE RESTRICT
);

CREATE INDEX idx_sensor_readings_silo_created ON sensor_readings (silo_id, created_at DESC);
