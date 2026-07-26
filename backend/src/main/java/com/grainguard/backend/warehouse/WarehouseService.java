package com.grainguard.backend.warehouse;

import com.grainguard.backend.common.exception.DuplicateResourceException;
import com.grainguard.backend.common.exception.ResourceNotFoundException;
import com.grainguard.backend.warehouse.dto.WarehouseRequest;
import com.grainguard.backend.warehouse.dto.WarehouseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WarehouseService {

    private final WarehouseRepository warehouseRepository;

    @Transactional
    public WarehouseResponse create(WarehouseRequest request) {
        if (warehouseRepository.existsByName(request.getName())) {
            throw new DuplicateResourceException("A warehouse with this name already exists");
        }

        Warehouse warehouse = WarehouseMapper.toEntity(request);
        warehouseRepository.save(warehouse);
        return WarehouseMapper.toResponse(warehouse);
    }

    public WarehouseResponse getById(Long id) {
        return WarehouseMapper.toResponse(findEntityOrThrow(id));
    }

    public Page<WarehouseResponse> getAll(Pageable pageable) {
        return warehouseRepository.findAll(pageable).map(WarehouseMapper::toResponse);
    }

    @Transactional
    public WarehouseResponse update(Long id, WarehouseRequest request) {
        Warehouse warehouse = findEntityOrThrow(id);

        boolean nameChanged = !warehouse.getName().equalsIgnoreCase(request.getName());
        if (nameChanged && warehouseRepository.existsByName(request.getName())) {
            throw new DuplicateResourceException("A warehouse with this name already exists");
        }

        WarehouseMapper.updateEntity(warehouse, request);
        return WarehouseMapper.toResponse(warehouse);
    }

    @Transactional
    public void delete(Long id) {
        // If silos still reference this warehouse, the ON DELETE RESTRICT
        // foreign key will cause this to throw DataIntegrityViolationException,
        // which GlobalExceptionHandler turns into a clean 409 response.
        Warehouse warehouse = findEntityOrThrow(id);
        warehouseRepository.delete(warehouse);
    }

    private Warehouse findEntityOrThrow(Long id) {
        return warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found with id: " + id));
    }
}
