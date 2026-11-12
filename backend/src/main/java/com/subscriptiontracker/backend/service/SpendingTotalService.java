package com.subscriptiontracker.backend.service;

import com.subscriptiontracker.backend.dto.SpendingSummaryResponse;
import com.subscriptiontracker.backend.dto.TotalSpendingResponse;
import com.subscriptiontracker.backend.enums.Category;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
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
        Map<Category, BigDecimal> byCategory = new EnumMap<>(Category.class);
        List<String> unconverted = new ArrayList<>();

        for (SpendingSummaryResponse summary : summaries) {
            Optional<BigDecimal> m = convert(rates, target, summary.monthlyTotal(), summary.currency());
            Optional<BigDecimal> y = convert(rates, target, summary.yearlyTotal(), summary.currency());
            if (m.isEmpty() || y.isEmpty()) {
                unconverted.add(summary.currency());
                continue;
            }
            monthly = monthly.add(m.get());
            yearly = yearly.add(y.get());
            summary.monthlyByCategory().forEach((category, amount) ->
                    convert(rates, target, amount, summary.currency())
                            .ifPresent(converted -> byCategory.merge(category, converted, BigDecimal::add)));
        }

        LocalDate ratesDate = rates.map(ExchangeRateService.Rates::date).orElse(null);
        return new TotalSpendingResponse(target, monthly, yearly, byCategory, unconverted, ratesDate);
    }

    private static Optional<BigDecimal> convert(Optional<ExchangeRateService.Rates> rates, String target,
                                                BigDecimal amount, String from) {
        if (from.equals(target)) {
            return Optional.of(amount);
        }
        return rates.flatMap(r -> r.toBase(amount, from));
    }
}
