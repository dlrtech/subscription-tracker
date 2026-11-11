package com.subscriptiontracker.backend.dto;

import com.subscriptiontracker.backend.entity.Subscription;
import com.subscriptiontracker.backend.enums.BillingPeriod;
import com.subscriptiontracker.backend.enums.Category;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SubscriptionResponse(
        Long id,
        String name,
        BigDecimal price,
        BillingPeriod billingPeriod,
        LocalDate nextBillingDate,
        Category category,
        boolean active,
        Long userId) {

    public static SubscriptionResponse from(Subscription subscription) {
        return new SubscriptionResponse(
                subscription.getId(),
                subscription.getName(),
                subscription.getPrice(),
                subscription.getBillingPeriod(),
                subscription.getNextBillingDate(),
                subscription.getCategory(),
                subscription.isActive(),
                subscription.getUser() != null ? subscription.getUser().getId() : null);
    }
}
