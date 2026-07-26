package com.grainguard.backend.silo;

import com.grainguard.backend.common.response.PagedResponse;
import com.grainguard.backend.silo.dto.SiloRequest;
import com.grainguard.backend.silo.dto.SiloResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * Same role policy as WarehouseController: any authenticated user reads,
 * ADMIN/MANAGER write, ADMIN-only deletes.
 *
 * Two base paths live in this one controller deliberately — /api/v1/silos
 * for silo-centric operations, and /api/v1/warehouses/{id}/silos for the
 * "silos belonging to this warehouse" listing — since both are genuinely
 * about the same resource (Silo), just accessed two different ways.
 */
@Tag(name = "Silos", description = "Silo management")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequiredArgsConstructor
public class SiloController {

    private final SiloService siloService;

    @Operation(summary = "Create a silo")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @PostMapping("/api/v1/silos")
    public ResponseEntity<SiloResponse> create(@Valid @RequestBody SiloRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(siloService.create(request));
    }

    @Operation(summary = "List all silos (paginated)")
    @GetMapping("/api/v1/silos")
    public PagedResponse<SiloResponse> getAll(Pageable pageable) {
        return PagedResponse.from(siloService.getAll(pageable));
    }

    @Operation(summary = "Get a silo by id")
    @GetMapping("/api/v1/silos/{id}")
    public SiloResponse getById(@PathVariable Long id) {
        return siloService.getById(id);
    }

    @Operation(summary = "List silos belonging to a specific warehouse (paginated)")
    @GetMapping("/api/v1/warehouses/{warehouseId}/silos")
    public PagedResponse<SiloResponse> getByWarehouse(@PathVariable Long warehouseId, Pageable pageable) {
        return PagedResponse.from(siloService.getByWarehouse(warehouseId, pageable));
    }

    @Operation(summary = "Update a silo")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @PutMapping("/api/v1/silos/{id}")
    public SiloResponse update(@PathVariable Long id, @Valid @RequestBody SiloRequest request) {
        return siloService.update(id, request);
    }

    @Operation(summary = "Delete a silo")
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/api/v1/silos/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        siloService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
