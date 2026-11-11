package com.subscriptiontracker.backend.dto;

import com.subscriptiontracker.backend.enums.Category;

import java.math.BigDecimal;
import java.util.Map;

/** Spending totals for one currency. Amounts in different currencies are never added together. */
public record SpendingSummaryResponse(
        String currency,
        int activeSubscriptions,
        BigDecimal monthlyTotal,
        BigDecimal yearlyTotal,
        Map<Category, BigDecimal> monthlyByCategory) {
}
