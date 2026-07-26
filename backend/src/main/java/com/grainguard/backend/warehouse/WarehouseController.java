package com.grainguard.backend.warehouse;

import com.grainguard.backend.common.response.PagedResponse;
import com.grainguard.backend.warehouse.dto.WarehouseRequest;
import com.grainguard.backend.warehouse.dto.WarehouseResponse;
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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Role policy (deliberate, not per-warehouse ownership — see project docs):
 * - Any authenticated user (incl. VIEWER) can read.
 * - ADMIN or MANAGER can create/update.
 * - Only ADMIN can delete — the most destructive action gets the tightest
 *   restriction, and it's also the operation most likely to hit the
 *   ON DELETE RESTRICT constraint if silos still exist underneath it.
 */
@Tag(name = "Warehouses", description = "Warehouse management")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/api/v1/warehouses")
@RequiredArgsConstructor
public class WarehouseController {

    private final WarehouseService warehouseService;

    @Operation(summary = "Create a warehouse")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @PostMapping
    public ResponseEntity<WarehouseResponse> create(@Valid @RequestBody WarehouseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(warehouseService.create(request));
    }

    @Operation(summary = "List all warehouses (paginated)")
    @GetMapping
    public PagedResponse<WarehouseResponse> getAll(Pageable pageable) {
        return PagedResponse.from(warehouseService.getAll(pageable));
    }

    @Operation(summary = "Get a warehouse by id")
    @GetMapping("/{id}")
    public WarehouseResponse getById(@PathVariable Long id) {
        return warehouseService.getById(id);
    }

    @Operation(summary = "Update a warehouse")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @PutMapping("/{id}")
    public WarehouseResponse update(@PathVariable Long id, @Valid @RequestBody WarehouseRequest request) {
        return warehouseService.update(id, request);
    }

    @Operation(summary = "Delete a warehouse")
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        warehouseService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
