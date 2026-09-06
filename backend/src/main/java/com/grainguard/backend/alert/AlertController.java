package com.grainguard.backend.alert;

import com.grainguard.backend.alert.dto.AlertResponse;
import com.grainguard.backend.common.response.PagedResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Alerts", description = "Threshold breach alerts")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequiredArgsConstructor
public class AlertController {

    private final AlertService alertService;

    @Operation(summary = "List all alerts (paginated, optional status/severity filter)")
    @GetMapping("/api/v1/alerts")
    public PagedResponse<AlertResponse> getAll(
            @RequestParam(required = false) AlertStatus status,
            @RequestParam(required = false) AlertSeverity severity,
            Pageable pageable
    ) {
        return PagedResponse.from(alertService.getAll(status, severity, pageable));
    }

    @Operation(summary = "List alerts for a specific silo (paginated)")
    @GetMapping("/api/v1/silos/{siloId}/alerts")
    public PagedResponse<AlertResponse> getBySilo(@PathVariable Long siloId, Pageable pageable) {
        return PagedResponse.from(alertService.getBySilo(siloId, pageable));
    }

    @Operation(summary = "Resolve an alert (Admin/Manager only)")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @PatchMapping("/api/v1/alerts/{id}/resolve")
    public AlertResponse resolve(@PathVariable Long id) {
        return alertService.resolve(id);
    }
}
