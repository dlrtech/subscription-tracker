package com.subscriptiontracker.backend.dto;

import com.subscriptiontracker.backend.enums.BillingPeriod;
import com.subscriptiontracker.backend.enums.Category;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SubscriptionRequest(
        @NotBlank(message = "Subscription name cannot be empty")
        @Size(max = 100, message = "Subscription name must be at most 100 characters")
        String name,

        @NotNull(message = "Price is required")
        @Positive(message = "Price must be greater than zero")
        @Digits(integer = 10, fraction = 2, message = "Price must have at most 10 digits and 2 decimals")
        BigDecimal price,

        @Pattern(regexp = "^[A-Za-z]{3}$", message = "Currency must be a 3-letter ISO code, e.g. TRY, USD, EUR")
        String currency,

        @NotNull(message = "Billing period is required")
        BillingPeriod billingPeriod,

        @NotNull(message = "Next billing date is required")
        LocalDate nextBillingDate,

        Category category,

        Boolean active) {
}
