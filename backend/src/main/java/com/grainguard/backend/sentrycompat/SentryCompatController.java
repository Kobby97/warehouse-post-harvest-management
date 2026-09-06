package com.grainguard.backend.sentrycompat;

import com.grainguard.backend.device.Device;
import com.grainguard.backend.device.DeviceStatus;
import com.grainguard.backend.sensorreading.SensorReading;
import com.grainguard.backend.sensorreading.SensorReadingRepository;
import com.grainguard.backend.sentrycompat.dto.SentrySiloResponse;
import com.grainguard.backend.sentrycompat.dto.SentryTelemetryResponse;
import com.grainguard.backend.silo.Silo;
import com.grainguard.backend.silo.SiloRepository;
import com.grainguard.backend.threshold.ThresholdService;
import com.grainguard.backend.threshold.dto.ThresholdRequest;
import com.grainguard.backend.threshold.dto.ThresholdResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Thin translation layer ONLY — no new business logic lives here. See the
 * class-level notes originally written for this controller: mounted under
 * /api/v1/sentry/** to avoid colliding with the real, differently-shaped
 * /api/v1/silos endpoint; single-silo assumption throughout, matching this
 * project's actual physical scope.
 *
 * Thresholds use raw Map<String,Object> for request/response here rather
 * than a dedicated DTO — acceptable in this isolated compatibility layer,
 * since moistureMax/co2Max are static placeholders (no such sensors exist
 * on this hardware) rather than real configurable fields.
 */
@Tag(name = "Sentry Compatibility", description = "Read-only endpoints reshaping real data for the Sentry frontend")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SentryCompatController {

    private static final Duration ONLINE_THRESHOLD = Duration.ofMinutes(10);
    private static final double MOISTURE_MAX_PLACEHOLDER = 13.5; // no grain-moisture sensor on this hardware
    private static final double CO2_MAX_PLACEHOLDER = 1200;      // no CO2 sensor on this hardware

    private final SiloRepository siloRepository;
    private final SensorReadingRepository sensorReadingRepository;
    private final ThresholdService thresholdService;

    @Operation(summary = "[Sentry-compat] Latest reading for the demo silo")
    @GetMapping("/api/v1/sentry/telemetry/latest")
    public SentryTelemetryResponse latest() {
        Silo silo = demoSilo();
        Optional<SensorReading> readingOpt =
                sensorReadingRepository.findFirstBySiloIdOrderByCreatedAtDesc(silo.getId());

        if (readingOpt.isEmpty()) {
            return SentryTelemetryResponse.builder()
                    .at(Instant.now().toEpochMilli())
                    .siloId(silo.getCode())
                    .build();
        }

        return toTelemetryResponse(readingOpt.get(), silo);
    }

    @Operation(summary = "[Sentry-compat] Reading history for the demo silo")
    @GetMapping("/api/v1/sentry/telemetry/history")
    public List<SentryTelemetryResponse> history(@RequestParam(defaultValue = "24h") String range) {
        Silo silo = demoSilo();
        Instant cutoff = Instant.now().minus(parseRange(range));

        return sensorReadingRepository
                .findBySiloIdAndCreatedAtAfterOrderByCreatedAtAsc(silo.getId(), cutoff)
                .stream()
                .map(reading -> toTelemetryResponse(reading, silo))
                .toList();
    }

    @Operation(summary = "[Sentry-compat] All silos, each merged with its latest reading")
    @GetMapping("/api/v1/sentry/silos")
    public List<SentrySiloResponse> silos() {
        return siloRepository.findAll().stream()
                .map(this::toSiloResponse)
                .toList();
    }

    @Operation(summary = "[Sentry-compat] Threshold config for the demo silo")
    @GetMapping("/api/v1/sentry/thresholds")
    public Map<String, Object> getThresholds() {
        Silo silo = demoSilo();
        ThresholdResponse t = thresholdService.getBySilo(silo.getId());
        return toThresholdMap(t);
    }

    @Operation(summary = "[Sentry-compat] Set threshold config for the demo silo")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @PutMapping("/api/v1/sentry/thresholds")
    public Map<String, Object> setThresholds(@RequestBody Map<String, Object> body) {
        Silo silo = demoSilo();

        ThresholdRequest request = new ThresholdRequest();
        request.setMaxTemperatureCelsius(toDouble(body.get("tempMax")));
        request.setMinTemperatureCelsius(toDouble(body.get("tempMin")));
        request.setMaxHumidityPercent(toDouble(body.get("humidityMax")));
        request.setMinHumidityPercent(toDouble(body.get("humidityMin")));

        ThresholdResponse saved = thresholdService.upsert(silo.getId(), request);
        return toThresholdMap(saved);
    }

    private Map<String, Object> toThresholdMap(ThresholdResponse t) {
        Map<String, Object> map = new java.util.HashMap<>();
        map.put("tempMax", t.getMaxTemperatureCelsius());
        map.put("tempMin", t.getMinTemperatureCelsius());
        map.put("humidityMax", t.getMaxHumidityPercent());
        map.put("humidityMin", t.getMinHumidityPercent());
        map.put("moistureMax", MOISTURE_MAX_PLACEHOLDER);
        map.put("co2Max", CO2_MAX_PLACEHOLDER);
        return map;
    }

    private Double toDouble(Object value) {
        if (value == null) {
            return null;
        }
        return ((Number) value).doubleValue();
    }

    private SentryTelemetryResponse toTelemetryResponse(SensorReading reading, Silo silo) {
        Device device = reading.getDevice();
        return SentryTelemetryResponse.builder()
                .at(reading.getCreatedAt().toEpochMilli())
                .siloId(silo.getCode())
                .temperature(reading.getTemperatureCelsius())
                .humidity(reading.getHumidityPercent())
                .moisture(null)
                .weightKg(computeWeightKg(reading.getFillPercentage(), silo.getCapacityKg()))
                .co2(null)
                .gateway(device.getName())
                .online(isOnline(device))
                .build();
    }

    private SentrySiloResponse toSiloResponse(Silo silo) {
        Optional<SensorReading> latest =
                sensorReadingRepository.findFirstBySiloIdOrderByCreatedAtDesc(silo.getId());

        SentrySiloResponse.SentrySiloResponseBuilder builder = SentrySiloResponse.builder()
                .id(silo.getCode())
                .name(silo.getCode() + " — " + silo.getGrainType())
                .crop(silo.getGrainType().name())
                .capacityKg(silo.getCapacityKg());

        latest.ifPresent(reading -> builder
                .weightKg(computeWeightKg(reading.getFillPercentage(), silo.getCapacityKg()))
                .temperature(reading.getTemperatureCelsius())
                .humidity(reading.getHumidityPercent())
                .gateway(reading.getDevice().getName())
                .lastSeen(reading.getCreatedAt().toEpochMilli()));

        return builder.build();
    }

    private Silo demoSilo() {
        return siloRepository.findAll().stream()
                .findFirst()
                .orElseThrow(() -> new IllegalStateException(
                        "No silo exists yet — create one via POST /api/v1/silos first"));
    }

    private Double computeWeightKg(Double fillPercentage, Double capacityKg) {
        if (fillPercentage == null || capacityKg == null) {
            return null;
        }
        return (fillPercentage / 100.0) * capacityKg;
    }

    private boolean isOnline(Device device) {
        if (device.getStatus() != DeviceStatus.ACTIVE || device.getLastSeenAt() == null) {
            return false;
        }
        return Duration.between(device.getLastSeenAt(), Instant.now()).compareTo(ONLINE_THRESHOLD) <= 0;
    }

    private Duration parseRange(String range) {
        return switch (range) {
            case "6h" -> Duration.ofHours(6);
            case "12h" -> Duration.ofHours(12);
            case "7d" -> Duration.ofDays(7);
            default -> Duration.ofHours(24);
        };
    }
}
