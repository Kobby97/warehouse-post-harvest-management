package com.grainguard.backend.common;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/**
 * Milestone M0 sanity-check endpoint.
 * Confirms the application context starts and is reachable before
 * any real domain logic (auth, warehouses, silos, etc.) is built.
 * Safe to remove once real endpoints exist, or keep as a lightweight
 * public liveness check alongside /actuator/health.
 */
@Tag(name = "Ping", description = "Basic liveness check for local setup verification")
@RestController
public class PingController {

    @GetMapping("/api/v1/ping")
    public Map<String, Object> ping() {
        return Map.of(
                "status", "UP",
                "service", "grainguard-backend",
                "timestamp", Instant.now().toString()
        );
    }
}
