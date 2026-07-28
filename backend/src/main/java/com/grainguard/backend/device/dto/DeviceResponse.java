package com.grainguard.backend.device.dto;

import com.grainguard.backend.device.DeviceStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
@AllArgsConstructor
public class DeviceResponse {

    private Long id;
    private String name;
    private String deviceIdentifier;
    private DeviceStatus status;
    private Long siloId;
    private String siloCode;
    private Instant lastSeenAt;
    private Instant createdAt;
}
