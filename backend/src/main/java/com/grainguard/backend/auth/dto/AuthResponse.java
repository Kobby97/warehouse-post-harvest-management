package com.grainguard.backend.auth.dto;

import com.grainguard.backend.user.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class AuthResponse {

    private String token;
    private long expiresInMs;
    private String fullName;
    private String email;
    private Role role;
}
