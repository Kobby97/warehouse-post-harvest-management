package com.grainguard.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

/**
 * TEMPORARY Milestone M0 security configuration.
 *
 * Spring Security is already on the classpath (needed for JWT auth in M2),
 * which means by default it locks every endpoint behind a generated login
 * form/basic auth. That's not useful yet since we have no users, roles,
 * or JWT flow built.
 *
 * This config disables that default lockdown so the team can verify the
 * app boots, Swagger loads, and /api/v1/ping responds — nothing more.
 *
 * ============================================================
 *  THIS CLASS MUST BE REPLACED IN MILESTONE M2 (JWT Auth).
 *  Do not build real features on top of "permitAll()" security.
 * ============================================================
 */
@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());

        return http.build();
    }
}
