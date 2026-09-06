package com.grainguard.backend.sensorreading.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SensorReadingIngestRequest {

    @NotNull(message = "Temperature is required")
    @DecimalMin(value = "-40.0", message = "Temperature below DHT22 sensor range (-40°C)")
    @DecimalMax(value = "80.0", message = "Temperature above DHT22 sensor range (80°C)")
    private Double temperatureCelsius;

    @NotNull(message = "Humidity is required")
    @DecimalMin(value = "0.0", message = "Humidity cannot be negative")
    @DecimalMax(value = "100.0", message = "Humidity cannot exceed 100%")
    private Double humidityPercent;

    @NotNull(message = "Distance is required")
    @DecimalMin(value = "0.0", message = "Distance cannot be negative")
    @DecimalMax(value = "450.0", message = "Distance above HC-SR04 practical sensor range (450cm)")
    private Double distanceCm;
}
