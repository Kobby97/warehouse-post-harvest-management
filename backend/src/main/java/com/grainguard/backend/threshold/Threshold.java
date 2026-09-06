package com.grainguard.backend.threshold;

import com.grainguard.backend.common.BaseEntity;
import com.grainguard.backend.silo.Silo;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(callSuper = true, exclude = "silo")
@Entity
@Table(name = "thresholds")
public class Threshold extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "silo_id", nullable = false, unique = true)
    private Silo silo;

    @Column(name = "min_temperature_celsius", nullable = false)
    private Double minTemperatureCelsius;

    @Column(name = "max_temperature_celsius", nullable = false)
    private Double maxTemperatureCelsius;

    @Column(name = "min_humidity_percent", nullable = false)
    private Double minHumidityPercent;

    @Column(name = "max_humidity_percent", nullable = false)
    private Double maxHumidityPercent;
}
