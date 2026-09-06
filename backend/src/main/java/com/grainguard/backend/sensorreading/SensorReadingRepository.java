package com.grainguard.backend.sensorreading;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface SensorReadingRepository extends JpaRepository<SensorReading, Long> {

    Page<SensorReading> findBySiloIdOrderByCreatedAtDesc(Long siloId, Pageable pageable);

    Optional<SensorReading> findFirstBySiloIdOrderByCreatedAtDesc(Long siloId);

    List<SensorReading> findBySiloIdAndCreatedAtAfterOrderByCreatedAtAsc(Long siloId, Instant after);
}
