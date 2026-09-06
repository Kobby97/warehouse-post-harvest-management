package com.grainguard.backend.sensorreading;

import com.grainguard.backend.common.response.PagedResponse;
import com.grainguard.backend.device.Device;
import com.grainguard.backend.sensorreading.dto.SensorReadingIngestRequest;
import com.grainguard.backend.sensorreading.dto.SensorReadingResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Sensor Readings", description = "Device ingestion + reading history")
@RestController
@RequiredArgsConstructor
public class SensorReadingController {

    private final SensorReadingService sensorReadingService;

    @Operation(summary = "Submit a sensor reading (device-authenticated via X-API-Key header)")
    @PreAuthorize("hasRole('DEVICE')")
    @PostMapping("/api/v1/devices/readings")
    public ResponseEntity<SensorReadingResponse> ingest(
            @Valid @RequestBody SensorReadingIngestRequest request,
            @AuthenticationPrincipal Device reportingDevice
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                sensorReadingService.ingest(request, reportingDevice));
    }

    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get reading history for a silo, most recent first (paginated)")
    @GetMapping("/api/v1/silos/{siloId}/readings")
    public PagedResponse<SensorReadingResponse> getBySilo(@PathVariable Long siloId, Pageable pageable) {
        return PagedResponse.from(sensorReadingService.getBySilo(siloId, pageable));
    }
}
