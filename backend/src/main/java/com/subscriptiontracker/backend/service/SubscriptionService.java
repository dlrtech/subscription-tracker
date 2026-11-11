package com.subscriptiontracker.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.subscriptiontracker.backend.dto.SpendingSummaryResponse;
import com.subscriptiontracker.backend.dto.SubscriptionRequest;
import com.subscriptiontracker.backend.entity.Subscription;
import com.subscriptiontracker.backend.enums.Category;
import com.subscriptiontracker.backend.exception.ResourceNotFoundException;
import com.subscriptiontracker.backend.repository.SubscriptionRepository;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.util.EnumMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
public class SubscriptionService {

    private static final Logger log = LoggerFactory.getLogger(SubscriptionService.class);

    private final SubscriptionRepository subscriptionRepository;
    private final UserService userService;
    private final Clock clock;
    private final String defaultCurrency;

    public SubscriptionService(SubscriptionRepository subscriptionRepository,
                               UserService userService,
                               Clock clock,
                               @Value("${app.default-currency:TRY}") String defaultCurrency) {
        this.subscriptionRepository = subscriptionRepository;
        this.userService = userService;
        this.clock = clock;
        this.defaultCurrency = defaultCurrency.toUpperCase(Locale.ROOT);
    }

    @Transactional
    public Subscription create(Long userId, SubscriptionRequest request) {
        Subscription subscription = new Subscription();
        subscription.setUser(userService.getUserById(userId));
        subscription.setBillingAnchorDate(request.nextBillingDate());
        apply(subscription, request);
        return subscriptionRepository.save(subscription);
    }

    @Transactional(readOnly = true)
    public List<Subscription> list(Long userId, Boolean active) {
        return active == null
                ? subscriptionRepository.findByUserIdOrderByNextBillingDateAscIdAsc(userId)
                : subscriptionRepository.findByUserIdAndActiveOrderByNextBillingDateAscIdAsc(userId, active);
    }

    @Transactional(readOnly = true)
    public Subscription get(Long userId, Long id) {
        // Another user's subscription is reported as missing so ids cannot be probed.
        return subscriptionRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found"));
    }

    @Transactional
    public Subscription update(Long userId, Long id, SubscriptionRequest request) {
        Subscription subscription = get(userId, id);
        // Keep the original anchor unless the user picked a different billing date or cycle.
        if (!request.nextBillingDate().equals(subscription.getNextBillingDate())
                || request.billingPeriod() != subscription.getBillingPeriod()) {
            subscription.setBillingAnchorDate(request.nextBillingDate());
        }
        apply(subscription, request);
        return subscription;
    }

    @Transactional
    public void delete(Long userId, Long id) {
        subscriptionRepository.delete(get(userId, id));
    }

    @Transactional(readOnly = true)
    public List<Subscription> upcoming(Long userId, int days) {
        LocalDate today = LocalDate.now(clock);
        return subscriptionRepository
                .findByUserIdAndActiveTrueAndNextBillingDateBetweenOrderByNextBillingDateAscIdAsc(
                        userId, today, today.plusDays(days));
    }

    @Transactional(readOnly = true)
    public List<SpendingSummaryResponse> summary(Long userId) {
        Map<String, List<Subscription>> byCurrency = subscriptionRepository.findByUserIdAndActiveTrue(userId).stream()
                .collect(Collectors.groupingBy(Subscription::getCurrency, TreeMap::new, Collectors.toList()));

        return byCurrency.entrySet().stream()
                .map(entry -> summarize(entry.getKey(), entry.getValue()))
                .toList();
    }

    /** Moves every passed billing date to its next occurrence. Returns the number of updated rows. */
    @Transactional
    public int advanceBillingDates() {
        LocalDate today = LocalDate.now(clock);
        List<Subscription> overdue = subscriptionRepository.findByNextBillingDateBefore(today);
        overdue.forEach(s -> s.setNextBillingDate(
                BillingCalculator.nextBillingDate(s.getBillingAnchorDate(), s.getBillingPeriod(), today)));
        if (!overdue.isEmpty()) {
            log.info("Advanced next billing date of {} subscription(s)", overdue.size());
        }
        return overdue.size();
    }

    private SpendingSummaryResponse summarize(String currency, List<Subscription> subscriptions) {
        BigDecimal monthly = BigDecimal.ZERO.setScale(2);
        BigDecimal yearly = BigDecimal.ZERO.setScale(2);
        Map<Category, BigDecimal> byCategory = new EnumMap<>(Category.class);

        for (Subscription s : subscriptions) {
            BigDecimal monthlyCost = BillingCalculator.monthlyCost(s.getPrice(), s.getBillingPeriod());
            monthly = monthly.add(monthlyCost);
            yearly = yearly.add(BillingCalculator.yearlyCost(s.getPrice(), s.getBillingPeriod()));
            byCategory.merge(s.getCategory(), monthlyCost, BigDecimal::add);
        }
        return new SpendingSummaryResponse(currency, subscriptions.size(), monthly, yearly, byCategory);
    }

    private void apply(Subscription subscription, SubscriptionRequest request) {
        subscription.setName(request.name().trim());
        subscription.setPrice(request.price());
        subscription.setCurrency(request.currency() == null
                ? defaultCurrency
                : request.currency().toUpperCase(Locale.ROOT));
        subscription.setBillingPeriod(request.billingPeriod());
        subscription.setCategory(request.category() == null ? Category.OTHER : request.category());
        subscription.setActive(request.active() == null || request.active());
        subscription.setNextBillingDate(BillingCalculator.nextBillingDate(
                subscription.getBillingAnchorDate(), request.billingPeriod(), LocalDate.now(clock)));
    }
}
