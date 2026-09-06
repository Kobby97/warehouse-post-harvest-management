package com.grainguard.backend.alert;

import com.grainguard.backend.common.BaseEntity;
import com.grainguard.backend.sensorreading.SensorReading;
import com.grainguard.backend.silo.Silo;
import com.grainguard.backend.threshold.BreachType;
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
 * Severity policy: temperature breaches (HIGH/LOW_TEMPERATURE) are CRITICAL
 * — temperature is the primary driver of mold/spoilage risk for this
 * project's grain storage use case. Humidity breaches are WARNING. Only
 * CRITICAL alerts trigger a logged VentilationAction (see AlertService).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(callSuper = true, exclude = {"silo", "reading"})
@Entity
@Table(name = "alerts")
public class Alert extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "silo_id", nullable = false)
    private Silo silo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reading_id", nullable = false)
    private SensorReading reading;

    @Enumerated(EnumType.STRING)
    @Column(name = "breach_type", nullable = false, length = 30)
    private BreachType breachType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AlertSeverity severity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private AlertStatus status = AlertStatus.ACTIVE;

    @Column(nullable = false, length = 255)
    private String message;

    @Column(name = "resolved_at")
    private Instant resolvedAt;
}
