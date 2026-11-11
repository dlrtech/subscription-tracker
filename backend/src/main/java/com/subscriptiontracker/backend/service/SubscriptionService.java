package com.subscriptiontracker.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.subscriptiontracker.backend.dto.SubscriptionRequest;
import com.subscriptiontracker.backend.entity.Subscription;
import com.subscriptiontracker.backend.entity.User;
import com.subscriptiontracker.backend.enums.BillingPeriod;
import com.subscriptiontracker.backend.exception.ResourceNotFoundException;
import com.subscriptiontracker.backend.repository.SubscriptionRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class SubscriptionService {

    private static final BigDecimal WEEKS_PER_YEAR = BigDecimal.valueOf(52);
    private static final BigDecimal MONTHS_PER_YEAR = BigDecimal.valueOf(12);

    private final SubscriptionRepository subscriptionRepository;
    private final UserService userService;

    public SubscriptionService(SubscriptionRepository subscriptionRepository, UserService userService) {
        this.subscriptionRepository = subscriptionRepository;
        this.userService = userService;
    }

    @Transactional
    public Subscription createSubscription(Long userId, SubscriptionRequest request) {
        User user = userService.getUserById(userId);

        Subscription subscription = new Subscription();
        subscription.setUser(user);
        apply(subscription, request);

        return subscriptionRepository.save(subscription);
    }

    @Transactional(readOnly = true)
    public List<Subscription> getSubscriptionsForUser(Long userId) {
        ensureUserExists(userId);
        return subscriptionRepository.findByUserId(userId);
    }

    @Transactional(readOnly = true)
    public Subscription getSubscriptionById(Long id) {
        return subscriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found"));
    }

    @Transactional
    public Subscription updateSubscription(Long id, SubscriptionRequest request) {
        Subscription subscription = getSubscriptionById(id);
        apply(subscription, request);
        return subscriptionRepository.save(subscription);
    }

    @Transactional
    public void deleteSubscription(Long id) {
        if (!subscriptionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Subscription not found");
        }
        subscriptionRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public BigDecimal calculateMonthlyTotal(Long userId) {
        ensureUserExists(userId);
        return subscriptionRepository.findByUserIdAndActiveTrue(userId).stream()
                .map(this::toMonthly)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
    }

    @Transactional(readOnly = true)
    public BigDecimal calculateYearlyTotal(Long userId) {
        ensureUserExists(userId);
        return subscriptionRepository.findByUserIdAndActiveTrue(userId).stream()
                .map(this::toYearly)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private void apply(Subscription subscription, SubscriptionRequest request) {
        subscription.setName(request.name().trim());
        subscription.setPrice(request.price());
        subscription.setBillingPeriod(request.billingPeriod());
        subscription.setNextBillingDate(request.nextBillingDate());
        subscription.setCategory(request.category());
        subscription.setActive(request.isActiveOrDefault());
    }

    private void ensureUserExists(Long userId) {
        userService.getUserById(userId);
    }

    private BigDecimal toYearly(Subscription subscription) {
        BigDecimal price = subscription.getPrice();
        return switch (subscription.getBillingPeriod()) {
            case WEEKLY -> price.multiply(WEEKS_PER_YEAR);
            case MONTHLY -> price.multiply(MONTHS_PER_YEAR);
            case YEARLY -> price;
        };
    }

    private BigDecimal toMonthly(Subscription subscription) {
        if (subscription.getBillingPeriod() == BillingPeriod.MONTHLY) {
            return subscription.getPrice();
        }
        return toYearly(subscription).divide(MONTHS_PER_YEAR, 2, RoundingMode.HALF_UP);
    }
}
