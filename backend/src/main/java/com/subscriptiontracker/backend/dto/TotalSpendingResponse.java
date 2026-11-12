package com.subscriptiontracker.backend.dto;

import com.subscriptiontracker.backend.enums.Category;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * All active subscriptions converted into one currency. Currencies whose rate is unavailable are left
 * out of the totals and listed in {@code unconvertedCurrencies}.
 */
public record TotalSpendingResponse(
        String currency,
        BigDecimal monthlyTotal,
        BigDecimal yearlyTotal,
        Map<Category, BigDecimal> monthlyByCategory,
        List<String> unconvertedCurrencies,
        LocalDate ratesDate) {
}
