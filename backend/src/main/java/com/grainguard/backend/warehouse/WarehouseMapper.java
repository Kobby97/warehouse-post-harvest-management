package com.grainguard.backend.warehouse;

import com.grainguard.backend.warehouse.dto.WarehouseRequest;
import com.grainguard.backend.warehouse.dto.WarehouseResponse;

/**
 * Plain static mapper methods rather than MapStruct — for a project this
 * size, hand-written mapping is a few extra lines but stays fully
 * transparent and debuggable, with no annotation-processing step to
 * troubleshoot when something goes wrong.
 */
public final class WarehouseMapper {

    private WarehouseMapper() {
    }

    public static Warehouse toEntity(WarehouseRequest request) {
        return Warehouse.builder()
                .name(request.getName())
                .location(request.getLocation())
                .description(request.getDescription())
                .build();
    }

    public static void updateEntity(Warehouse warehouse, WarehouseRequest request) {
        warehouse.setName(request.getName());
        warehouse.setLocation(request.getLocation());
        warehouse.setDescription(request.getDescription());
    }

    public static WarehouseResponse toResponse(Warehouse warehouse) {
        return WarehouseResponse.builder()
                .id(warehouse.getId())
                .name(warehouse.getName())
                .location(warehouse.getLocation())
                .description(warehouse.getDescription())
                .createdAt(warehouse.getCreatedAt())
                .updatedAt(warehouse.getUpdatedAt())
                .build();
    }
}
