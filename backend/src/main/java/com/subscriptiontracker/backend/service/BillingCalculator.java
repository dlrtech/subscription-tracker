package com.subscriptiontracker.backend.service;

import com.subscriptiontracker.backend.enums.BillingPeriod;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/** Pure billing arithmetic: cost conversion between periods and next payment dates. */
public final class BillingCalculator {

    private static final BigDecimal WEEKS_PER_YEAR = BigDecimal.valueOf(52);
    private static final BigDecimal MONTHS_PER_YEAR = BigDecimal.valueOf(12);

    private BillingCalculator() {
    }

    public static BigDecimal yearlyCost(BigDecimal price, BillingPeriod period) {
        BigDecimal yearly = switch (period) {
            case WEEKLY -> price.multiply(WEEKS_PER_YEAR);
            case MONTHLY -> price.multiply(MONTHS_PER_YEAR);
            case YEARLY -> price;
        };
        return yearly.setScale(2, RoundingMode.HALF_UP);
    }

    public static BigDecimal monthlyCost(BigDecimal price, BillingPeriod period) {
        if (period == BillingPeriod.MONTHLY) {
            return price.setScale(2, RoundingMode.HALF_UP);
        }
        return yearlyCost(price, period).divide(MONTHS_PER_YEAR, 2, RoundingMode.HALF_UP);
    }

    /**
     * The first billing date on or after {@code today}, counting whole periods from {@code anchor}.
     * Counting from the anchor (instead of stepping from the previous date) keeps month-end dates
     * stable: an anchor of 31 Jan yields 28/29 Feb, then 31 Mar.
     */
    public static LocalDate nextBillingDate(LocalDate anchor, BillingPeriod period, LocalDate today) {
        if (!anchor.isBefore(today)) {
            return anchor;
        }
        ChronoUnit unit = switch (period) {
            case WEEKLY -> ChronoUnit.WEEKS;
            case MONTHLY -> ChronoUnit.MONTHS;
            case YEARLY -> ChronoUnit.YEARS;
        };
        long periods = unit.between(anchor, today);
        LocalDate candidate = anchor.plus(periods, unit);
        while (candidate.isBefore(today)) {
            periods++;
            candidate = anchor.plus(periods, unit);
        }
        return candidate;
    }
}
