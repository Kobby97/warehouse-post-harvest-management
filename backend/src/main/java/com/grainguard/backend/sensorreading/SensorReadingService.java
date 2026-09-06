package com.grainguard.backend.sensorreading;

import com.grainguard.backend.alert.AlertService;
import com.grainguard.backend.common.exception.ResourceNotFoundException;
import com.grainguard.backend.device.Device;
import com.grainguard.backend.device.DeviceRepository;
import com.grainguard.backend.sensorreading.dto.SensorReadingIngestRequest;
import com.grainguard.backend.sensorreading.dto.SensorReadingResponse;
import com.grainguard.backend.silo.Silo;
import com.grainguard.backend.silo.SiloRepository;
import com.grainguard.backend.threshold.ThresholdEvaluationResult;
import com.grainguard.backend.threshold.ThresholdEvaluationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SensorReadingService {

    private final SensorReadingRepository sensorReadingRepository;
    private final SiloRepository siloRepository;
    private final DeviceRepository deviceRepository;
    private final FillLevelCalculator fillLevelCalculator;
    private final ThresholdEvaluationService thresholdEvaluationService;
    private final AlertService alertService;

    @Transactional
    public SensorReadingResponse ingest(SensorReadingIngestRequest request, Device authenticatedDevice) {
        // Re-fetch within this transaction — the device object from the
        // API-key filter comes from an already-closed session, so its lazy
        // `silo` relation can't be read directly.
        Device device = deviceRepository.findById(authenticatedDevice.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Device not found with id: " + authenticatedDevice.getId()));

        Silo silo = device.getSilo();

        double fillPercentage = fillLevelCalculator.calculateFillPercentage(
                request.getDistanceCm(), silo.getHeightCm());

        SensorReading reading = SensorReadingMapper.toEntity(
                request.getTemperatureCelsius(),
                request.getHumidityPercent(),
                request.getDistanceCm(),
                fillPercentage,
                device,
                silo
        );

        sensorReadingRepository.save(reading);

        // M6: check against this silo's configured threshold (if any).
        // M7: turn any breach into a real, deduplicated Alert (and, for
        // CRITICAL breaches, a logged VentilationAction).
        ThresholdEvaluationResult evaluation = thresholdEvaluationService.evaluate(
                silo.getId(), request.getTemperatureCelsius(), request.getHumidityPercent());

        alertService.handleEvaluation(silo, reading, evaluation);

        return SensorReadingMapper.toResponse(reading);
    }

    public Page<SensorReadingResponse> getBySilo(Long siloId, Pageable pageable) {
        if (!siloRepository.existsById(siloId)) {
            throw new ResourceNotFoundException("Silo not found with id: " + siloId);
        }

        return sensorReadingRepository.findBySiloIdOrderByCreatedAtDesc(siloId, pageable)
                .map(SensorReadingMapper::toResponse);
    }
}
