package com.grainguard.backend.threshold;

import com.grainguard.backend.common.exception.ResourceNotFoundException;
import com.grainguard.backend.silo.Silo;
import com.grainguard.backend.silo.SiloRepository;
import com.grainguard.backend.threshold.dto.ThresholdRequest;
import com.grainguard.backend.threshold.dto.ThresholdResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ThresholdService {

    private final ThresholdRepository thresholdRepository;
    private final SiloRepository siloRepository;

    public ThresholdResponse getBySilo(Long siloId) {
        Threshold threshold = thresholdRepository.findBySiloId(siloId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No threshold configured yet for silo id: " + siloId));
        return ThresholdMapper.toResponse(threshold);
    }

    @Transactional
    public ThresholdResponse upsert(Long siloId, ThresholdRequest request) {
        validateRange(request);

        Silo silo = siloRepository.findById(siloId)
                .orElseThrow(() -> new ResourceNotFoundException("Silo not found with id: " + siloId));

        Threshold threshold = thresholdRepository.findBySiloId(siloId)
                .orElseGet(() -> Threshold.builder().silo(silo).build());

        ThresholdMapper.updateEntity(threshold, request);
        thresholdRepository.save(threshold);

        return ThresholdMapper.toResponse(threshold);
    }

    private void validateRange(ThresholdRequest request) {
        // Cross-field checks like this don't fit cleanly into Bean
        // Validation annotations, so they're enforced here instead.
        // IllegalArgumentException is mapped to a clean 400 by
        // GlobalExceptionHandler.
        if (request.getMinTemperatureCelsius() >= request.getMaxTemperatureCelsius()) {
            throw new IllegalArgumentException("minTemperatureCelsius must be less than maxTemperatureCelsius");
        }
        if (request.getMinHumidityPercent() >= request.getMaxHumidityPercent()) {
            throw new IllegalArgumentException("minHumidityPercent must be less than maxHumidityPercent");
        }
    }
}
