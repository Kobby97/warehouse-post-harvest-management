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

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(callSuper = true, exclude = {"silo", "apiKeyHash"})
@Entity
@Table(name = "devices")
public class Device extends BaseEntity {

    @Column(nullable = false, length = 120)
    private String name;

    // Human/factory identifier for the physical unit (e.g. ESP32 serial or
    // MAC address) - distinct from the internal database id, and from the
    // API key below.
    @Column(name = "device_identifier", nullable = false, unique = true, length = 100)
    private String deviceIdentifier;

    // SHA-256 hash of the device's API key — never the raw key. The raw key
    // is generated once at registration, shown to the caller exactly once,
    // and never stored or retrievable again. See DeviceService.register().
    @Column(name = "api_key_hash", nullable = false, unique = true, length = 255)
    private String apiKeyHash;

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
