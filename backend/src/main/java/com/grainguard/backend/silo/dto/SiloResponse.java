package com.grainguard.backend.silo.dto;

import com.grainguard.backend.silo.GrainType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
@AllArgsConstructor
public class SiloResponse {

    private Long id;
    private String code;
    private GrainType grainType;
    private Double capacityKg;
    private Long warehouseId;
    private String warehouseName;
    private Instant createdAt;
    private Instant updatedAt;
}
