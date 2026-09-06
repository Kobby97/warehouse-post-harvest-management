package com.grainguard.backend.ventilation;

import com.grainguard.backend.ventilation.dto.VentilationActionResponse;

public final class VentilationActionMapper {

    private VentilationActionMapper() {
    }

    public static VentilationActionResponse toResponse(VentilationAction action) {
        return VentilationActionResponse.builder()
                .id(action.getId())
                .siloId(action.getSilo().getId())
                .siloCode(action.getSilo().getCode())
                .alertId(action.getAlert().getId())
                .description(action.getDescription())
                .createdAt(action.getCreatedAt())
                .build();
    }
}
