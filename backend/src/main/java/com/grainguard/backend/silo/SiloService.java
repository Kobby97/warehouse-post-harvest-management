package com.grainguard.backend.silo;

import com.grainguard.backend.common.exception.DuplicateResourceException;
import com.grainguard.backend.common.exception.ResourceNotFoundException;
import com.grainguard.backend.silo.dto.SiloRequest;
import com.grainguard.backend.silo.dto.SiloResponse;
import com.grainguard.backend.warehouse.Warehouse;
import com.grainguard.backend.warehouse.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SiloService {

    private final SiloRepository siloRepository;
    private final WarehouseRepository warehouseRepository;

    @Transactional
    public SiloResponse create(SiloRequest request) {
        if (siloRepository.existsByCode(request.getCode())) {
            throw new DuplicateResourceException("A silo with this code already exists");
        }

        Warehouse warehouse = findWarehouseOrThrow(request.getWarehouseId());
        Silo silo = SiloMapper.toEntity(request, warehouse);
        siloRepository.save(silo);
        return SiloMapper.toResponse(silo);
    }

    public SiloResponse getById(Long id) {
        return SiloMapper.toResponse(findEntityOrThrow(id));
    }

    public Page<SiloResponse> getAll(Pageable pageable) {
        return siloRepository.findAll(pageable).map(SiloMapper::toResponse);
    }

    public Page<SiloResponse> getByWarehouse(Long warehouseId, Pageable pageable) {
        // Confirm the warehouse actually exists so a bad/mistyped id returns
        // a clear 404 instead of a silently empty page.
        findWarehouseOrThrow(warehouseId);
        return siloRepository.findByWarehouseId(warehouseId, pageable).map(SiloMapper::toResponse);
    }

    @Transactional
    public SiloResponse update(Long id, SiloRequest request) {
        Silo silo = findEntityOrThrow(id);

        boolean codeChanged = !silo.getCode().equalsIgnoreCase(request.getCode());
        if (codeChanged && siloRepository.existsByCode(request.getCode())) {
            throw new DuplicateResourceException("A silo with this code already exists");
        }

        Warehouse warehouse = findWarehouseOrThrow(request.getWarehouseId());
        SiloMapper.updateEntity(silo, request, warehouse);
        return SiloMapper.toResponse(silo);
    }

    @Transactional
    public void delete(Long id) {
        // If devices still reference this silo, ON DELETE RESTRICT throws
        // DataIntegrityViolationException, turned into a clean 409 by
        // GlobalExceptionHandler.
        Silo silo = findEntityOrThrow(id);
        siloRepository.delete(silo);
    }

    private Silo findEntityOrThrow(Long id) {
        return siloRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Silo not found with id: " + id));
    }

    private Warehouse findWarehouseOrThrow(Long warehouseId) {
        return warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found with id: " + warehouseId));
    }
}
