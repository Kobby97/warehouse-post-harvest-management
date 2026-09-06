package com.grainguard.backend.sensorreading;

import com.grainguard.backend.device.Device;
import com.grainguard.backend.sensorreading.dto.SensorReadingResponse;
import com.grainguard.backend.silo.Silo;

public final class SensorReadingMapper {

    private SensorReadingMapper() {
    }

    public static SensorReading toEntity(
            Double temperatureCelsius, Double humidityPercent, Double distanceCm,
            Double fillPercentage, Device device, Silo silo) {
        return SensorReading.builder()
                .temperatureCelsius(temperatureCelsius)
                .humidityPercent(humidityPercent)
                .distanceCm(distanceCm)
                .fillPercentage(fillPercentage)
                .device(device)
                .silo(silo)
                .build();
    }

    public static SensorReadingResponse toResponse(SensorReading reading) {
        return SensorReadingResponse.builder()
                .id(reading.getId())
                .siloId(reading.getSilo().getId())
                .siloCode(reading.getSilo().getCode())
                .deviceId(reading.getDevice().getId())
                .deviceName(reading.getDevice().getName())
                .temperatureCelsius(reading.getTemperatureCelsius())
                .humidityPercent(reading.getHumidityPercent())
                .distanceCm(reading.getDistanceCm())
                .fillPercentage(reading.getFillPercentage())
                .createdAt(reading.getCreatedAt())
                .build();
    }
}
