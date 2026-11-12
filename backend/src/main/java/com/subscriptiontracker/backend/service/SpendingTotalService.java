package com.subscriptiontracker.backend.service;

import com.subscriptiontracker.backend.dto.SpendingSummaryResponse;
import com.subscriptiontracker.backend.dto.TotalSpendingResponse;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

/** Adds up spending across currencies by converting everything into one target currency. */
@Service
public class SpendingTotalService {

    private final SubscriptionService subscriptionService;
    private final ExchangeRateService exchangeRates;

    public SpendingTotalService(SubscriptionService subscriptionService, ExchangeRateService exchangeRates) {
        this.subscriptionService = subscriptionService;
        this.exchangeRates = exchangeRates;
    }

    public TotalSpendingResponse total(Long userId, String currency) {
        String target = currency.toUpperCase(Locale.ROOT);
        List<SpendingSummaryResponse> summaries = subscriptionService.summary(userId);

        boolean needsRates = summaries.stream().anyMatch(s -> !s.currency().equals(target));
        Optional<ExchangeRateService.Rates> rates =
                needsRates ? exchangeRates.ratesFor(target) : Optional.empty();

        BigDecimal monthly = BigDecimal.ZERO.setScale(2);
        BigDecimal yearly = BigDecimal.ZERO.setScale(2);
        List<String> unconverted = new ArrayList<>();

        for (SpendingSummaryResponse summary : summaries) {
            Optional<BigDecimal> m;
            Optional<BigDecimal> y;
            if (summary.currency().equals(target)) {
                m = Optional.of(summary.monthlyTotal());
                y = Optional.of(summary.yearlyTotal());
            } else {
                m = rates.flatMap(r -> r.toBase(summary.monthlyTotal(), summary.currency()));
                y = rates.flatMap(r -> r.toBase(summary.yearlyTotal(), summary.currency()));
            }
            if (m.isPresent() && y.isPresent()) {
                monthly = monthly.add(m.get());
                yearly = yearly.add(y.get());
            } else {
                unconverted.add(summary.currency());
            }
        }

        LocalDate ratesDate = rates.map(ExchangeRateService.Rates::date).orElse(null);
        return new TotalSpendingResponse(target, monthly, yearly, unconverted, ratesDate);
    }
}
