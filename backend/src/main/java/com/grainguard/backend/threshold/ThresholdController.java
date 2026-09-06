package com.grainguard.backend.threshold;

import com.grainguard.backend.threshold.dto.ThresholdRequest;
import com.grainguard.backend.threshold.dto.ThresholdResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Thresholds", description = "Per-silo safe operating range configuration")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/api/v1/silos/{siloId}/thresholds")
@RequiredArgsConstructor
public class ThresholdController {

    private final ThresholdService thresholdService;

    @Operation(summary = "Get the configured threshold for a silo")
    @GetMapping
    public ThresholdResponse getBySilo(@PathVariable Long siloId) {
        return thresholdService.getBySilo(siloId);
    }

    @Operation(summary = "Create or update the threshold for a silo (Admin/Manager only)")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @PutMapping
    public ThresholdResponse upsert(@PathVariable Long siloId, @Valid @RequestBody ThresholdRequest request) {
        return thresholdService.upsert(siloId, request);
    }
}
