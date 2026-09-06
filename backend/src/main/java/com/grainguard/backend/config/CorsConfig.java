package com.grainguard.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Without this, a browser-based frontend running on a different origin
 * gets silently blocked by the browser's same-origin policy, even though
 * the exact same request works fine from Postman or curl.
 *
 * Uses origin PATTERNS (not a fixed list) because the frontend may be
 * served several different ways during development/demo: Python's
 * http.server (usually :5173 or :8000), VS Code's Live Server (:5500),
 * or a LAN IP if presenting across two machines on the same Wi-Fi/hotspot
 * (matches the "192.168.x.x" example already used in the frontend's own
 * README for reaching this backend). Still scoped to local/private
 * network patterns only — not a public wildcard.
 *
 * Tighten this to a fixed real URL once there's an actual deployment.
 */
@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of(
                "http://localhost:*",
                "http://127.0.0.1:*",
                "http://192.168.*.*:*"
        ));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
