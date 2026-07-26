package com.grainguard.backend.silo;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SiloRepository extends JpaRepository<Silo, Long> {

    boolean existsByCode(String code);

    Page<Silo> findByWarehouseId(Long warehouseId, Pageable pageable);
}
