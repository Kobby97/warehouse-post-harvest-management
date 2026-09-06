package com.grainguard.backend.alert;

import com.grainguard.backend.alert.dto.AlertResponse;

public final class AlertMapper {

    private AlertMapper() {
    }

    public static AlertResponse toResponse(Alert alert) {
        return AlertResponse.builder()
                .id(alert.getId())
                .siloId(alert.getSilo().getId())
                .siloCode(alert.getSilo().getCode())
                .breachType(alert.getBreachType())
                .severity(alert.getSeverity())
                .status(alert.getStatus())
                .message(alert.getMessage())
                .resolvedAt(alert.getResolvedAt())
                .createdAt(alert.getCreatedAt())
                .build();
    }
}
