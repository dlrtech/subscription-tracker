package com.subscriptiontracker.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserRequest(
        @NotBlank(message = "User name cannot be empty")
        @Size(max = 100, message = "User name must be at most 100 characters")
        String name) {
}
