package com.grainguard.backend.threshold;

import lombok.Getter;

import java.util.List;

@Getter
public class ThresholdEvaluationResult {

    private final List<BreachType> breaches;

    public ThresholdEvaluationResult(List<BreachType> breaches) {
        this.breaches = breaches;
    }

    public boolean isBreached() {
        return !breaches.isEmpty();
    }
}
