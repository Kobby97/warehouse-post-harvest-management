package com.grainguard.backend.warehouse.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
@AllArgsConstructor
public class WarehouseResponse {

    private Long id;
    private String name;
    private String location;
    private String description;
    private Instant createdAt;
    private Instant updatedAt;
}
