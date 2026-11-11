package com.subscriptiontracker.backend.service;

import com.subscriptiontracker.backend.enums.BillingPeriod;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static com.subscriptiontracker.backend.enums.BillingPeriod.MONTHLY;
import static com.subscriptiontracker.backend.enums.BillingPeriod.WEEKLY;
import static com.subscriptiontracker.backend.enums.BillingPeriod.YEARLY;
import static com.subscriptiontracker.backend.service.BillingCalculator.monthlyCost;
import static com.subscriptiontracker.backend.service.BillingCalculator.nextBillingDate;
import static com.subscriptiontracker.backend.service.BillingCalculator.yearlyCost;
import static org.assertj.core.api.Assertions.assertThat;

class BillingCalculatorTest {

    private static LocalDate date(String iso) {
        return LocalDate.parse(iso);
    }

    @Test
    void convertsCostsBetweenPeriods() {
        assertThat(monthlyCost(new BigDecimal("100"), MONTHLY)).isEqualByComparingTo("100.00");
        assertThat(monthlyCost(new BigDecimal("120"), YEARLY)).isEqualByComparingTo("10.00");
        assertThat(monthlyCost(new BigDecimal("10"), WEEKLY)).isEqualByComparingTo("43.33");

        assertThat(yearlyCost(new BigDecimal("100"), MONTHLY)).isEqualByComparingTo("1200.00");
        assertThat(yearlyCost(new BigDecimal("120"), YEARLY)).isEqualByComparingTo("120.00");
        assertThat(yearlyCost(new BigDecimal("10"), WEEKLY)).isEqualByComparingTo("520.00");
    }

    @Test
    void costsAlwaysHaveTwoDecimals() {
        assertThat(monthlyCost(new BigDecimal("9"), MONTHLY).scale()).isEqualTo(2);
        assertThat(yearlyCost(new BigDecimal("9"), YEARLY).scale()).isEqualTo(2);
    }

    @Test
    void futureOrTodayDatesAreKept() {
        LocalDate today = date("2026-11-11");
        assertThat(nextBillingDate(today, MONTHLY, today)).isEqualTo(today);
        assertThat(nextBillingDate(date("2026-12-01"), MONTHLY, today)).isEqualTo(date("2026-12-01"));
    }

    @Test
    void pastDatesMoveToNextOccurrence() {
        LocalDate today = date("2026-11-11");
        assertThat(nextBillingDate(date("2026-10-05"), MONTHLY, today)).isEqualTo(date("2026-12-05"));
        assertThat(nextBillingDate(date("2026-10-11"), MONTHLY, today)).isEqualTo(date("2026-11-11"));
        assertThat(nextBillingDate(date("2024-03-01"), YEARLY, today)).isEqualTo(date("2027-03-01"));
        // 2026-11-04 is a Wednesday; the next Wednesday on/after 11 Nov is 11 Nov itself.
        assertThat(nextBillingDate(date("2026-11-04"), WEEKLY, today)).isEqualTo(date("2026-11-11"));
        assertThat(nextBillingDate(date("2026-11-05"), WEEKLY, today)).isEqualTo(date("2026-11-12"));
    }

    @Test
    void monthEndAnchorDoesNotDrift() {
        LocalDate anchor = date("2026-01-31");
        assertThat(nextBillingDate(anchor, MONTHLY, date("2026-02-01"))).isEqualTo(date("2026-02-28"));
        assertThat(nextBillingDate(anchor, MONTHLY, date("2026-03-01"))).isEqualTo(date("2026-03-31"));
        assertThat(nextBillingDate(anchor, MONTHLY, date("2026-04-15"))).isEqualTo(date("2026-04-30"));
    }

    @Test
    void leapDayYearlySubscriptionFallsBackToFebruary28() {
        assertThat(nextBillingDate(date("2024-02-29"), BillingPeriod.YEARLY, date("2026-01-01")))
                .isEqualTo(date("2026-02-28"));
        assertThat(nextBillingDate(date("2024-02-29"), BillingPeriod.YEARLY, date("2027-12-01")))
                .isEqualTo(date("2028-02-29"));
    }
}
