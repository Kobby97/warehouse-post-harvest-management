package com.grainguard.backend.device.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DeviceRegisterRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 120, message = "Name must be at most 120 characters")
    private String name;

    @NotBlank(message = "Device identifier is required")
    @Size(max = 100, message = "Device identifier must be at most 100 characters")
    private String deviceIdentifier;

    @NotNull(message = "Silo id is required")
    private Long siloId;
}
