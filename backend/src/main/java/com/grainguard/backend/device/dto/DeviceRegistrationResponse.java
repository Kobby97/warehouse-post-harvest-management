package com.grainguard.backend.device.dto;

import com.grainguard.backend.device.DeviceStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

/**
 * Deliberately a separate class from DeviceResponse, not a shared one with
 * a nullable apiKey field — that would make it too easy to accidentally
 * add the field to a future "get device" endpoint and leak it. This DTO
 * only ever exists as the return type of the one registration call.
 */
@Getter
@Builder
@AllArgsConstructor
public class DeviceRegistrationResponse {

    private Long id;
    private String name;
    private String deviceIdentifier;

    // Shown ONLY here, ONLY once. Never stored in plaintext, never
    // retrievable again after this response. If lost, re-register the
    // device (or add a "regenerate key" endpoint later).
    private String apiKey;

    private DeviceStatus status;
    private Long siloId;
    private Instant createdAt;
}
