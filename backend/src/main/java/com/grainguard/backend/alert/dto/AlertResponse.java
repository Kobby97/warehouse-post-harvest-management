package com.grainguard.backend.alert.dto;

import com.grainguard.backend.alert.AlertSeverity;
import com.grainguard.backend.alert.AlertStatus;
import com.grainguard.backend.threshold.BreachType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
@AllArgsConstructor
public class AlertResponse {

    private Long id;
    private Long siloId;
    private String siloCode;
    private BreachType breachType;
    private AlertSeverity severity;
    private AlertStatus status;
    private String message;
    private Instant resolvedAt;
    private Instant createdAt;
}
