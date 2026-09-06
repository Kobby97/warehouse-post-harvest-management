package com.grainguard.backend.sentrycompat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class SentrySiloResponse {

    private String id;
    private String name;
    private String crop;
    private Double capacityKg;
    private Double weightKg;
    private Double temperature;
    private Double humidity;
    private Double moisture;
    private Double co2;
    private String gateway;
    private Long lastSeen;
    private String image;
}
