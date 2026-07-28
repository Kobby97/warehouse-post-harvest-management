package com.grainguard.backend.security;

import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

/**
 * SHA-256, not BCrypt, deliberately. BCrypt's slow, salted design exists to
 * defend low-entropy human passwords against brute-forcing — it's the wrong
 * tool here. API keys are already 256-bit random secrets (see
 * DeviceService.generateRawApiKey()), so brute-forcing is infeasible
 * regardless of hash speed, and a fast deterministic hash is what lets us
 * look a device up directly by its hash on every request without a
 * performance cost. This mirrors how API keys are handled by Stripe,
 * GitHub, and most real-world API providers.
 */
@Component
public class ApiKeyHasher {

    public String hash(String rawKey) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(rawKey.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            // SHA-256 is a mandatory JDK algorithm — this can't actually happen.
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }
}
