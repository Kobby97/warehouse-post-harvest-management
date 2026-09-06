package com.grainguard.backend.threshold;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ThresholdEvaluationService {

    private final ThresholdRepository thresholdRepository;

    public ThresholdEvaluationResult evaluate(Long siloId, double temperatureCelsius, double humidityPercent) {
        Optional<Threshold> thresholdOpt = thresholdRepository.findBySiloId(siloId);

        if (thresholdOpt.isEmpty()) {
            // No threshold configured yet for this silo — deliberately not
            // an error. The reading is still stored regardless (see
            // SensorReadingService); it simply isn't checked against
            // anything until a threshold exists for that silo.
            return new ThresholdEvaluationResult(List.of());
        }

        Threshold threshold = thresholdOpt.get();
        List<BreachType> breaches = new ArrayList<>();

        if (temperatureCelsius > threshold.getMaxTemperatureCelsius()) {
            breaches.add(BreachType.HIGH_TEMPERATURE);
        } else if (temperatureCelsius < threshold.getMinTemperatureCelsius()) {
            breaches.add(BreachType.LOW_TEMPERATURE);
        }

        if (humidityPercent > threshold.getMaxHumidityPercent()) {
            breaches.add(BreachType.HIGH_HUMIDITY);
        } else if (humidityPercent < threshold.getMinHumidityPercent()) {
            breaches.add(BreachType.LOW_HUMIDITY);
        }

        return new ThresholdEvaluationResult(breaches);
    }
}
