package com.grainguard.backend.sensorreading;

import org.springframework.stereotype.Component;

/**
 * fillPercentage = (siloHeightCm - distanceCm) / siloHeightCm * 100
 * Clamped to [0, 100] to absorb sensor noise at the extremes.
 */
@Component
public class FillLevelCalculator {

    public double calculateFillPercentage(double distanceCm, double siloHeightCm) {
        double fillHeightCm = siloHeightCm - distanceCm;
        double rawPercentage = (fillHeightCm / siloHeightCm) * 100.0;
        return Math.max(0.0, Math.min(100.0, rawPercentage));
    }
}
