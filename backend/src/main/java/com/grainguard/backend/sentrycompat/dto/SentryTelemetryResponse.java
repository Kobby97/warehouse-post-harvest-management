package com.grainguard.backend.sentrycompat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/**
 * Field names match the Sentry frontend's expected JSON exactly (see its
 * README, GET /telemetry/latest and /telemetry/history). This is a
 * translation shape, not a core domain DTO — it exists only so the
 * frontend's existing pages work against our real data with zero JS edits.
 */
@Getter
@Builder
@AllArgsConstructor
public class SentryTelemetryResponse {

    private Long at;               // epoch millis
    private String siloId;         // silo code, e.g. "SILO-A1"
    private Double temperature;
    private Double humidity;
    private Double moisture;       // always null — no grain-moisture sensor on this hardware
    private Double weightKg;        // derived: fillPercentage/100 * silo.capacityKg
    private Double co2;            // always null — no CO2 sensor on this hardware
    private String gateway;        // device name
    private Boolean online;        // derived from device status + lastSeenAt recency
}
