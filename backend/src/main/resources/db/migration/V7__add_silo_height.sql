-- V7__add_silo_height.sql
-- Needed to convert a raw ultrasonic distance reading into a fill
-- percentage in M5. Default of 300cm is a placeholder only — update each
-- silo's real height via PUT /api/v1/silos/{id} to match the physical
-- mounting height of its ultrasonic sensor.
ALTER TABLE silos
    ADD COLUMN height_cm DOUBLE NOT NULL DEFAULT 300;
