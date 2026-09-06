package com.grainguard.backend.threshold.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ThresholdRequest {

    @NotNull(message = "Minimum temperature is required")
    private Double minTemperatureCelsius;

    @NotNull(message = "Maximum temperature is required")
    private Double maxTemperatureCelsius;

    @NotNull(message = "Minimum humidity is required")
    private Double minHumidityPercent;

    @NotNull(message = "Maximum humidity is required")
    private Double maxHumidityPercent;
}
