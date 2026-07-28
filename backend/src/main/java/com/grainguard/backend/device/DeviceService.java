package com.grainguard.backend.device;

import com.grainguard.backend.common.exception.DuplicateResourceException;
import com.grainguard.backend.common.exception.ResourceNotFoundException;
import com.grainguard.backend.device.dto.DeviceRegisterRequest;
import com.grainguard.backend.device.dto.DeviceRegistrationResponse;
import com.grainguard.backend.device.dto.DeviceResponse;
import com.grainguard.backend.security.ApiKeyHasher;
import com.grainguard.backend.silo.Silo;
import com.grainguard.backend.silo.SiloRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Base64;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DeviceService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int API_KEY_BYTES = 32; // 256 bits of entropy

    private final DeviceRepository deviceRepository;
    private final SiloRepository siloRepository;
    private final ApiKeyHasher apiKeyHasher;

    @Transactional
    public DeviceRegistrationResponse register(DeviceRegisterRequest request) {
        if (deviceRepository.existsByDeviceIdentifier(request.getDeviceIdentifier())) {
            throw new DuplicateResourceException("A device with this identifier is already registered");
        }

        Silo silo = siloRepository.findById(request.getSiloId())
                .orElseThrow(() -> new ResourceNotFoundException("Silo not found with id: " + request.getSiloId()));

        String rawApiKey = generateRawApiKey();

        Device device = DeviceMapper.toEntity(request, silo);
        device.setApiKeyHash(apiKeyHasher.hash(rawApiKey));
        deviceRepository.save(device);

        return DeviceMapper.toRegistrationResponse(device, rawApiKey);
    }

    public DeviceResponse getById(Long id) {
        return DeviceMapper.toResponse(findEntityOrThrow(id));
    }

    public Page<DeviceResponse> getAll(Pageable pageable) {
        return deviceRepository.findAll(pageable).map(DeviceMapper::toResponse);
    }

    private Device findEntityOrThrow(Long id) {
        return deviceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Device not found with id: " + id));
    }

    private String generateRawApiKey() {
        byte[] randomBytes = new byte[API_KEY_BYTES];
        SECURE_RANDOM.nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }
}
