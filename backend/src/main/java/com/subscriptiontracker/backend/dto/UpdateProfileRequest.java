package com.subscriptiontracker.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Partial update: only the fields that are present are changed. */
public record UpdateProfileRequest(
        @Size(min = 1, max = 100, message = "Name must be between 1 and 100 characters")
        String name,

        Boolean remindersEnabled,

        @Min(value = 1, message = "Reminder days must be at least 1")
        @Max(value = 14, message = "Reminder days must be at most 14")
        Integer reminderDays,

        @Pattern(regexp = "[A-Za-z]{3}", message = "Currency must be a 3-letter code")
        String preferredCurrency) {
}
