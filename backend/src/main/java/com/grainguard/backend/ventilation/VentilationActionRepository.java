package com.grainguard.backend.ventilation;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VentilationActionRepository extends JpaRepository<VentilationAction, Long> {

    Page<VentilationAction> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<VentilationAction> findBySiloIdOrderByCreatedAtDesc(Long siloId, Pageable pageable);
}
