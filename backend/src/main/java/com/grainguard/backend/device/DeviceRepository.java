package com.grainguard.backend.device;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DeviceRepository extends JpaRepository<Device, Long> {

    boolean existsByDeviceIdentifier(String deviceIdentifier);

    Optional<Device> findByDeviceIdentifier(String deviceIdentifier);

    Optional<Device> findByApiKeyHash(String apiKeyHash);
}
