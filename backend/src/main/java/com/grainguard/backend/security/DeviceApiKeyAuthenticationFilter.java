package com.grainguard.backend.security;

import com.grainguard.backend.device.Device;
import com.grainguard.backend.device.DeviceRepository;
import com.grainguard.backend.device.DeviceStatus;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Authenticates ESP32 devices via a static API key in the X-API-Key header —
 * a separate mechanism from user JWT auth (JwtAuthenticationFilter), since
 * devices aren't users and shouldn't go through login/password/refresh flows.
 *
 * Deliberately one filter checking a distinct header, rather than a second
 * full SecurityFilterChain — simpler to reason about at this project's
 * scale, while still keeping device and user auth cleanly separate. Both
 * filters run on every request; each only acts when its own header is
 * present, so they don't interfere with each other.
 */
@Component
@RequiredArgsConstructor
public class DeviceApiKeyAuthenticationFilter extends OncePerRequestFilter {

    private static final String API_KEY_HEADER = "X-API-Key";

    private final DeviceRepository deviceRepository;
    private final ApiKeyHasher apiKeyHasher;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        String apiKey = request.getHeader(API_KEY_HEADER);

        if (apiKey == null || apiKey.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        String hash = apiKeyHasher.hash(apiKey);
        Optional<Device> deviceOpt = deviceRepository.findByApiKeyHash(hash);

        if (deviceOpt.isPresent() && SecurityContextHolder.getContext().getAuthentication() == null) {
            Device device = deviceOpt.get();

            if (device.getStatus() == DeviceStatus.ACTIVE) {
                device.setLastSeenAt(Instant.now());
                deviceRepository.save(device);

                var authToken = new UsernamePasswordAuthenticationToken(
                        device, null, List.of(new SimpleGrantedAuthority("ROLE_DEVICE")));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
            // If the device is INACTIVE, we deliberately do NOT authenticate —
            // the request falls through unauthenticated, resulting in a clean
            // 401. This is what makes deactivating a device actually work:
            // its key stops being accepted immediately, no separate revocation
            // list needed.
        }

        filterChain.doFilter(request, response);
    }
}
