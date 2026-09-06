package com.grainguard.backend.sensorreading;

import com.grainguard.backend.common.BaseEntity;
import com.grainguard.backend.device.Device;
import com.grainguard.backend.silo.Silo;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

/**
 * References both the reporting Device and the Silo directly (a
 * deliberate denormalization) — a reading is a snapshot of "this silo's
 * condition at this moment," and should stay correct even if a device is
 * later reassigned to a different silo.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(callSuper = true, exclude = {"device", "silo"})
@Entity
@Table(name = "sensor_readings")
public class SensorReading extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id", nullable = false)
    private Device device;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "silo_id", nullable = false)
    private Silo silo;

    @Column(name = "temperature_celsius", nullable = false)
    private Double temperatureCelsius;

    @Column(name = "humidity_percent", nullable = false)
    private Double humidityPercent;

    // Raw distance from the ultrasonic sensor to the grain surface, exactly
    // as reported by the ESP32 — no calculation applied on-device.
    @Column(name = "distance_cm", nullable = false)
    private Double distanceCm;

    // Calculated server-side at ingestion time (see FillLevelCalculator)
    // and stored, not recomputed on every read.
    @Column(name = "fill_percentage", nullable = false)
    private Double fillPercentage;
}
