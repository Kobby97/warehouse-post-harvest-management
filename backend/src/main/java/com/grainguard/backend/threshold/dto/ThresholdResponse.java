package com.grainguard.backend.threshold.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
@AllArgsConstructor
public class ThresholdResponse {

    private Long id;
    private Long siloId;
    private String siloCode;
    private Double minTemperatureCelsius;
    private Double maxTemperatureCelsius;
    private Double minHumidityPercent;
    private Double maxHumidityPercent;
    private Instant createdAt;
    private Instant updatedAt;
}
