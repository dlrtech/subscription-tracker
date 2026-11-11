package com.subscriptiontracker.backend.dto;

import com.subscriptiontracker.backend.entity.Subscription;
import com.subscriptiontracker.backend.enums.BillingPeriod;
import com.subscriptiontracker.backend.enums.Category;
import com.subscriptiontracker.backend.service.BillingCalculator;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record SubscriptionResponse(
        Long id,
        String name,
        BigDecimal price,
        String currency,
        BillingPeriod billingPeriod,
        Category category,
        LocalDate nextBillingDate,
        boolean active,
        BigDecimal monthlyCost,
        Instant createdAt,
        Instant updatedAt) {

    public static SubscriptionResponse from(Subscription s) {
        return new SubscriptionResponse(
                s.getId(),
                s.getName(),
                s.getPrice(),
                s.getCurrency(),
                s.getBillingPeriod(),
                s.getCategory(),
                s.getNextBillingDate(),
                s.isActive(),
                BillingCalculator.monthlyCost(s.getPrice(), s.getBillingPeriod()),
                s.getCreatedAt(),
                s.getUpdatedAt());
    }
}
