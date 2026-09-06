package com.grainguard.backend.sensorreading.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
@AllArgsConstructor
public class SensorReadingResponse {

    private Long id;
    private Long siloId;
    private String siloCode;
    private Long deviceId;
    private String deviceName;
    private Double temperatureCelsius;
    private Double humidityPercent;
    private Double distanceCm;
    private Double fillPercentage;
    private Instant createdAt;
}
