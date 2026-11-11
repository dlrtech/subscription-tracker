package com.subscriptiontracker.backend.dto;

import com.subscriptiontracker.backend.enums.BillingPeriod;
import com.subscriptiontracker.backend.enums.Category;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SubscriptionRequest(
        @NotBlank(message = "Subscription name cannot be empty")
        @Size(max = 100, message = "Subscription name must be at most 100 characters")
        String name,

        @NotNull(message = "Price is required")
        @Positive(message = "Subscription price must be greater than zero")
        BigDecimal price,

        @NotNull(message = "Billing period is required")
        BillingPeriod billingPeriod,

        LocalDate nextBillingDate,

        Category category,

        Boolean active) {

    /** New subscriptions are active unless explicitly stated otherwise. */
    public boolean isActiveOrDefault() {
        return active == null || active;
    }
}
