-- V4__create_silos_table.sql
CREATE TABLE silos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    grain_type VARCHAR(30) NOT NULL,
    capacity_kg DOUBLE NOT NULL,
    warehouse_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_silos_code UNIQUE (code),
    -- RESTRICT (not CASCADE) is deliberate: a warehouse with existing silos
    -- cannot be deleted outright. This forces an explicit decision (move or
    -- delete the silos first) rather than silently wiping sensor history
    -- through an accidental cascading delete.
    CONSTRAINT fk_silos_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses (id)
        ON DELETE RESTRICT
);

CREATE INDEX idx_silos_warehouse_id ON silos (warehouse_id);
