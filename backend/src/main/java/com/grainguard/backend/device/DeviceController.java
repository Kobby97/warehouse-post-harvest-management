package com.grainguard.backend.device;

import com.grainguard.backend.common.response.PagedResponse;
import com.grainguard.backend.device.dto.DeviceRegisterRequest;
import com.grainguard.backend.device.dto.DeviceRegistrationResponse;
import com.grainguard.backend.device.dto.DeviceResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Kept deliberately minimal — register/list/get only, no status-toggle or
 * delete endpoints. With a single physical ESP32 in this project's actual
 * scope, that extra CRUD surface wasn't worth building yet; the real
 * engineering content of this milestone is the authentication mechanism
 * itself (see DeviceApiKeyAuthenticationFilter), not device management UI.
 * Easy to extend later if the project scales to more devices.
 */
@Tag(name = "Devices", description = "ESP32 device registration (user-facing, JWT-protected)")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/api/v1/devices")
@RequiredArgsConstructor
public class DeviceController {

    private final DeviceService deviceService;

    @Operation(summary = "Register a new device — returns its API key ONCE. Save it immediately; it cannot be retrieved again.")
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<DeviceRegistrationResponse> register(@Valid @RequestBody DeviceRegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(deviceService.register(request));
    }

    @Operation(summary = "List all registered devices (paginated)")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @GetMapping
    public PagedResponse<DeviceResponse> getAll(Pageable pageable) {
        return PagedResponse.from(deviceService.getAll(pageable));
    }

    @Operation(summary = "Get a device by id")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @GetMapping("/{id}")
    public DeviceResponse getById(@PathVariable Long id) {
        return deviceService.getById(id);
    }

    @Operation(summary = "Diagnostic endpoint: confirms a device's API key is valid. " +
            "Temporary — superseded by the real sensor-reading endpoint in M5, but useful " +
            "now to prove device authentication works end-to-end before that endpoint exists.")
    @PreAuthorize("hasRole('DEVICE')")
    @GetMapping("/verify-key")
    public ResponseEntity<String> verifyKey() {
        return ResponseEntity.ok("Device API key is valid — authentication successful.");
    }
}
