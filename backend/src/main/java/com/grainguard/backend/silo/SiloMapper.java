package com.grainguard.backend.silo;

import com.grainguard.backend.silo.dto.SiloRequest;
import com.grainguard.backend.silo.dto.SiloResponse;
import com.grainguard.backend.warehouse.Warehouse;

public final class SiloMapper {

    private SiloMapper() {
    }

    public static Silo toEntity(SiloRequest request, Warehouse warehouse) {
        return Silo.builder()
                .code(request.getCode())
                .grainType(request.getGrainType())
                .capacityKg(request.getCapacityKg())
                .heightCm(request.getHeightCm())
                .warehouse(warehouse)
                .build();
    }

    public static void updateEntity(Silo silo, SiloRequest request, Warehouse warehouse) {
        silo.setCode(request.getCode());
        silo.setGrainType(request.getGrainType());
        silo.setCapacityKg(request.getCapacityKg());
        silo.setHeightCm(request.getHeightCm());
        silo.setWarehouse(warehouse);
    }

    public static SiloResponse toResponse(Silo silo) {
        return SiloResponse.builder()
                .id(silo.getId())
                .code(silo.getCode())
                .grainType(silo.getGrainType())
                .capacityKg(silo.getCapacityKg())
                .heightCm(silo.getHeightCm())
                .warehouseId(silo.getWarehouse().getId())
                .warehouseName(silo.getWarehouse().getName())
                .createdAt(silo.getCreatedAt())
                .updatedAt(silo.getUpdatedAt())
                .build();
    }
}
