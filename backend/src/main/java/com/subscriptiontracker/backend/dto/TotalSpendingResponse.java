package com.subscriptiontracker.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * All active subscriptions converted into one currency. Currencies whose rate is unavailable are left
 * out of the totals and listed in {@code unconvertedCurrencies}.
 */
public record TotalSpendingResponse(
        String currency,
        BigDecimal monthlyTotal,
        BigDecimal yearlyTotal,
        List<String> unconvertedCurrencies,
        LocalDate ratesDate) {
}
