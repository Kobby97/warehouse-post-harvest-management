package com.grainguard.backend.alert;

import com.grainguard.backend.alert.dto.AlertResponse;
import com.grainguard.backend.common.exception.ResourceNotFoundException;
import com.grainguard.backend.sensorreading.SensorReading;
import com.grainguard.backend.silo.Silo;
import com.grainguard.backend.threshold.BreachType;
import com.grainguard.backend.threshold.ThresholdEvaluationResult;
import com.grainguard.backend.ventilation.VentilationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AlertService {

    // Temperature is the primary spoilage/mold driver for grain storage —
    // see project decision log. Humidity breaches are WARNING severity.
    private static final Set<BreachType> CRITICAL_BREACHES = Set.of(
            BreachType.HIGH_TEMPERATURE, BreachType.LOW_TEMPERATURE);

    private final AlertRepository alertRepository;
    private final VentilationService ventilationService;

    @Transactional
    public void handleEvaluation(Silo silo, SensorReading reading, ThresholdEvaluationResult evaluation) {
        for (BreachType breachType : evaluation.getBreaches()) {
            handleBreach(silo, reading, breachType);
        }
    }

    private void handleBreach(Silo silo, SensorReading reading, BreachType breachType) {
        // The core duplicate-prevention rule: if this exact silo already has
        // an ACTIVE alert for this exact breach type, don't create another
        // one just because a new reading re-confirms the same ongoing
        // condition. Without this check, a silo stuck above its temperature
        // cap would generate a fresh alert on every single reading — this
        // is the one thing in the whole M6/M7 pair worth testing carefully.
        Optional<Alert> existingActive = alertRepository
                .findBySiloIdAndBreachTypeAndStatus(silo.getId(), breachType, AlertStatus.ACTIVE);

        if (existingActive.isPresent()) {
            return;
        }

        AlertSeverity severity = CRITICAL_BREACHES.contains(breachType)
                ? AlertSeverity.CRITICAL
                : AlertSeverity.WARNING;

        Alert alert = Alert.builder()
                .silo(silo)
                .reading(reading)
                .breachType(breachType)
                .severity(severity)
                .status(AlertStatus.ACTIVE)
                .message(buildMessage(breachType, reading))
                .build();

        alertRepository.save(alert);

        if (severity == AlertSeverity.CRITICAL) {
            ventilationService.logAutomatedAction(alert);
        }
    }

    private String buildMessage(BreachType breachType, SensorReading reading) {
        return switch (breachType) {
            case HIGH_TEMPERATURE -> String.format(
                    "Temperature %.1f°C exceeds the configured maximum", reading.getTemperatureCelsius());
            case LOW_TEMPERATURE -> String.format(
                    "Temperature %.1f°C is below the configured minimum", reading.getTemperatureCelsius());
            case HIGH_HUMIDITY -> String.format(
                    "Humidity %.1f%% exceeds the configured maximum", reading.getHumidityPercent());
            case LOW_HUMIDITY -> String.format(
                    "Humidity %.1f%% is below the configured minimum", reading.getHumidityPercent());
        };
    }

    public Page<AlertResponse> getAll(AlertStatus status, AlertSeverity severity, Pageable pageable) {
        Page<Alert> page;
        if (status != null && severity != null) {
            page = alertRepository.findByStatusAndSeverityOrderByCreatedAtDesc(status, severity, pageable);
        } else if (status != null) {
            page = alertRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
        } else if (severity != null) {
            page = alertRepository.findBySeverityOrderByCreatedAtDesc(severity, pageable);
        } else {
            page = alertRepository.findAllByOrderByCreatedAtDesc(pageable);
        }
        return page.map(AlertMapper::toResponse);
    }

    public Page<AlertResponse> getBySilo(Long siloId, Pageable pageable) {
        return alertRepository.findBySiloIdOrderByCreatedAtDesc(siloId, pageable)
                .map(AlertMapper::toResponse);
    }

    @Transactional
    public AlertResponse resolve(Long id) {
        Alert alert = alertRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Alert not found with id: " + id));

        if (alert.getStatus() == AlertStatus.RESOLVED) {
            throw new IllegalArgumentException("Alert is already resolved");
        }

        alert.setStatus(AlertStatus.RESOLVED);
        alert.setResolvedAt(Instant.now());
        return AlertMapper.toResponse(alert);
    }
}
