package com.grainguard.backend.alert;

import com.grainguard.backend.threshold.BreachType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AlertRepository extends JpaRepository<Alert, Long> {

    // The core duplicate-prevention check: is there already an ACTIVE alert
    // for this exact silo + breach type? If so, don't create another one.
    Optional<Alert> findBySiloIdAndBreachTypeAndStatus(Long siloId, BreachType breachType, AlertStatus status);

    Page<Alert> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Alert> findByStatusOrderByCreatedAtDesc(AlertStatus status, Pageable pageable);

    Page<Alert> findBySeverityOrderByCreatedAtDesc(AlertSeverity severity, Pageable pageable);

    Page<Alert> findByStatusAndSeverityOrderByCreatedAtDesc(
            AlertStatus status, AlertSeverity severity, Pageable pageable);

    Page<Alert> findBySiloIdOrderByCreatedAtDesc(Long siloId, Pageable pageable);
}
