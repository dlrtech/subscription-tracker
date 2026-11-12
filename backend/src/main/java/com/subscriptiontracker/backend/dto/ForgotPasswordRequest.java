package com.subscriptiontracker.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ForgotPasswordRequest(
        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        String email) {

    public ForgotPasswordRequest {
        email = email == null ? null : email.trim();
    }
}
