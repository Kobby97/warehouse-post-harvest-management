package com.grainguard.backend.device;

import com.grainguard.backend.device.dto.DeviceRegisterRequest;
import com.grainguard.backend.device.dto.DeviceRegistrationResponse;
import com.grainguard.backend.device.dto.DeviceResponse;
import com.grainguard.backend.silo.Silo;

public final class DeviceMapper {

    private DeviceMapper() {
    }

    public static Device toEntity(DeviceRegisterRequest request, Silo silo) {
        return Device.builder()
                .name(request.getName())
                .deviceIdentifier(request.getDeviceIdentifier())
                .silo(silo)
                .status(DeviceStatus.ACTIVE)
                .build();
    }

    // Reads device.getSilo().getCode() — a LAZY relation, so this must only
    // be called from within a transactional context (see DeviceService).
    public static DeviceResponse toResponse(Device device) {
        return DeviceResponse.builder()
                .id(device.getId())
                .name(device.getName())
                .deviceIdentifier(device.getDeviceIdentifier())
                .status(device.getStatus())
                .siloId(device.getSilo().getId())
                .siloCode(device.getSilo().getCode())
                .lastSeenAt(device.getLastSeenAt())
                .createdAt(device.getCreatedAt())
                .build();
    }

    public static DeviceRegistrationResponse toRegistrationResponse(Device device, String rawApiKey) {
        return DeviceRegistrationResponse.builder()
                .id(device.getId())
                .name(device.getName())
                .deviceIdentifier(device.getDeviceIdentifier())
                .apiKey(rawApiKey)
                .status(device.getStatus())
                .siloId(device.getSilo().getId())
                .createdAt(device.getCreatedAt())
                .build();
    }
}
