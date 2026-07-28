-- V6__add_device_api_key.sql
-- Deferred from M1 by design (see V5 comments) — device authentication
-- wasn't built until this milestone, so there was nothing to store yet.
ALTER TABLE devices
    ADD COLUMN api_key_hash VARCHAR(255) NOT NULL;

CREATE UNIQUE INDEX uk_devices_api_key_hash ON devices (api_key_hash);
