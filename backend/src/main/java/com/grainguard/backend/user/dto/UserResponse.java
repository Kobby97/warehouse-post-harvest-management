package com.grainguard.backend.user.dto;

import com.grainguard.backend.user.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
@AllArgsConstructor
public class UserResponse {

    private Long id;
    private String fullName;
    private String email;
    private Role role;
    private boolean enabled;
    private Instant createdAt;
}
