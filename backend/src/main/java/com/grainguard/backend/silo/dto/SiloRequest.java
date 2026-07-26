package com.grainguard.backend.silo.dto;

import com.grainguard.backend.silo.GrainType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SiloRequest {

    @NotBlank(message = "Code is required")
    @Size(max = 50, message = "Code must be at most 50 characters")
    private String code;

    @NotNull(message = "Grain type is required")
    private GrainType grainType;

    @NotNull(message = "Capacity is required")
    @Positive(message = "Capacity must be greater than zero")
    private Double capacityKg;

    @NotNull(message = "Warehouse id is required")
    private Long warehouseId;
}
