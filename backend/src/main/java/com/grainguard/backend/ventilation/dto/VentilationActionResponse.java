package com.grainguard.backend.ventilation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
@AllArgsConstructor
public class VentilationActionResponse {

    private Long id;
    private Long siloId;
    private String siloCode;
    private Long alertId;
    private String description;
    private Instant createdAt;
}
