package com.grainguard.backend.device;

import com.grainguard.backend.common.BaseEntity;
import com.grainguard.backend.silo.Silo;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.time.Instant;

/**
 * Deliberately minimal for M1 — no API key field yet. That column
 * (api_key_hash) and its authentication wiring belong to Milestone M4
 * (Device Registration & Device Authentication), added via its own
 * Flyway migration rather than being bolted on here.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(callSuper = true, exclude = "silo")
@Entity
@Table(name = "devices")
public class Device extends BaseEntity {

    @Column(nullable = false, length = 120)
    private String name;

    // Human/factory identifier for the physical unit (e.g. ESP32 serial or
    // MAC address) - distinct from the internal database id, and from the
    // API key introduced in M4.
    @Column(name = "device_identifier", nullable = false, unique = true, length = 100)
    private String deviceIdentifier;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private DeviceStatus status = DeviceStatus.ACTIVE;

    @Column(name = "last_seen_at")
    private Instant lastSeenAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "silo_id", nullable = false)
    private Silo silo;
}
