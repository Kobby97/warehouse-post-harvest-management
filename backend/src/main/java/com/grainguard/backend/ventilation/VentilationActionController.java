package com.grainguard.backend.ventilation;

import com.grainguard.backend.common.response.PagedResponse;
import com.grainguard.backend.ventilation.dto.VentilationActionResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Ventilation Actions", description = "Logged automated responses to critical alerts (not real hardware control)")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequiredArgsConstructor
public class VentilationActionController {

    private final VentilationService ventilationService;

    @Operation(summary = "List all ventilation actions (paginated)")
    @GetMapping("/api/v1/ventilation-actions")
    public PagedResponse<VentilationActionResponse> getAll(Pageable pageable) {
        return PagedResponse.from(ventilationService.getAll(pageable));
    }

    @Operation(summary = "List ventilation actions for a specific silo (paginated)")
    @GetMapping("/api/v1/silos/{siloId}/ventilation-actions")
    public PagedResponse<VentilationActionResponse> getBySilo(@PathVariable Long siloId, Pageable pageable) {
        return PagedResponse.from(ventilationService.getBySilo(siloId, pageable));
    }
}
