package com.grainguard.backend.threshold;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ThresholdRepository extends JpaRepository<Threshold, Long> {

    Optional<Threshold> findBySiloId(Long siloId);

    boolean existsBySiloId(Long siloId);
}
