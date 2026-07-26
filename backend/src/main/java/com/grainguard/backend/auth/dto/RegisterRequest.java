package com.grainguard.backend.auth.dto;

import com.grainguard.backend.user.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be a valid email address")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    // Role is caller-supplied at registration deliberately, for capstone
    // simplicity — there's no existing Admin yet to create the very first
    // account any other way. In a stricter production setup, this would
    // default to VIEWER, with ADMIN/MANAGER accounts only creatable by an
    // existing Admin via a separate, protected endpoint. Worth naming as a
    // documented simplification in your project report.
    @NotNull(message = "Role is required")
    private Role role;
}
