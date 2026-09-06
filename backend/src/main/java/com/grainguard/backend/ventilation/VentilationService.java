package com.grainguard.backend.ventilation;

import com.grainguard.backend.alert.Alert;
import com.grainguard.backend.ventilation.dto.VentilationActionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class VentilationService {

    private final VentilationActionRepository ventilationActionRepository;

    @Transactional
    public void logAutomatedAction(Alert alert) {
        VentilationAction action = VentilationAction.builder()
                .alert(alert)
                .silo(alert.getSilo())
                .description("Critical " + alert.getBreachType() + " breach on silo " +
                        alert.getSilo().getCode() + " — automated ventilation response logged.")
                .build();

        ventilationActionRepository.save(action);
    }

    public Page<VentilationActionResponse> getAll(Pageable pageable) {
        return ventilationActionRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(VentilationActionMapper::toResponse);
    }

    public Page<VentilationActionResponse> getBySilo(Long siloId, Pageable pageable) {
        return ventilationActionRepository.findBySiloIdOrderByCreatedAtDesc(siloId, pageable)
                .map(VentilationActionMapper::toResponse);
    }
}
