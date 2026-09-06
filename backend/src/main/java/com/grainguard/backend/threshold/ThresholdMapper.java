package com.grainguard.backend.threshold;

import com.grainguard.backend.threshold.dto.ThresholdRequest;
import com.grainguard.backend.threshold.dto.ThresholdResponse;

public final class ThresholdMapper {

    private ThresholdMapper() {
    }

    public static void updateEntity(Threshold threshold, ThresholdRequest request) {
        threshold.setMinTemperatureCelsius(request.getMinTemperatureCelsius());
        threshold.setMaxTemperatureCelsius(request.getMaxTemperatureCelsius());
        threshold.setMinHumidityPercent(request.getMinHumidityPercent());
        threshold.setMaxHumidityPercent(request.getMaxHumidityPercent());
    }

    public static ThresholdResponse toResponse(Threshold threshold) {
        return ThresholdResponse.builder()
                .id(threshold.getId())
                .siloId(threshold.getSilo().getId())
                .siloCode(threshold.getSilo().getCode())
                .minTemperatureCelsius(threshold.getMinTemperatureCelsius())
                .maxTemperatureCelsius(threshold.getMaxTemperatureCelsius())
                .minHumidityPercent(threshold.getMinHumidityPercent())
                .maxHumidityPercent(threshold.getMaxHumidityPercent())
                .createdAt(threshold.getCreatedAt())
                .updatedAt(threshold.getUpdatedAt())
                .build();
    }
}
