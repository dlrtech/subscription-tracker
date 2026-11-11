package com.subscriptiontracker.backend.service;

import org.springframework.stereotype.Service;

import com.subscriptiontracker.backend.entity.Subscription;
import com.subscriptiontracker.backend.enums.BillingPeriod;
import com.subscriptiontracker.backend.repository.SubscriptionRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class SubscriptionService {

    private static final BigDecimal WEEKS_PER_YEAR = BigDecimal.valueOf(52);
    private static final BigDecimal MONTHS_PER_YEAR = BigDecimal.valueOf(12);

    private final SubscriptionRepository subscriptionRepository;

    public SubscriptionService(SubscriptionRepository subscriptionRepository) {
        this.subscriptionRepository = subscriptionRepository;
    }

    public Subscription createSubscription(Subscription subscription) {
        validate(subscription);
        return subscriptionRepository.save(subscription);
    }

    public List<Subscription> getAllSubscriptions() {
        return subscriptionRepository.findAll();
    }

    public Subscription getSubscriptionById(Long id) {
        return subscriptionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found"));
    }

    public void deleteSubscription(Long id) {
        if (!subscriptionRepository.existsById(id)) {
            throw new IllegalArgumentException("Subscription not found");
        }
        subscriptionRepository.deleteById(id);
    }

    public Subscription updateSubscription(Long id, Subscription updatedSubscription) {
        Subscription existingSubscription = getSubscriptionById(id);
        validate(updatedSubscription);

        existingSubscription.setName(updatedSubscription.getName());
        existingSubscription.setPrice(updatedSubscription.getPrice());
        existingSubscription.setBillingPeriod(updatedSubscription.getBillingPeriod());
        existingSubscription.setNextBillingDate(updatedSubscription.getNextBillingDate());
        existingSubscription.setCategory(updatedSubscription.getCategory());
        existingSubscription.setActive(updatedSubscription.isActive());

        return subscriptionRepository.save(existingSubscription);
    }

    public BigDecimal calculateMonthlyTotal() {
        return subscriptionRepository.findAll().stream()
                .filter(Subscription::isActive)
                .map(this::toMonthly)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public BigDecimal calculateYearlyTotal() {
        return subscriptionRepository.findAll().stream()
                .filter(Subscription::isActive)
                .map(this::toYearly)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
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

    private void validate(Subscription subscription) {
        if (subscription.getName() == null || subscription.getName().isBlank()) {
            throw new IllegalArgumentException("Subscription name cannot be empty");
        }
        if (subscription.getPrice() == null || subscription.getPrice().signum() <= 0) {
            throw new IllegalArgumentException("Subscription price must be greater than zero");
        }
        if (subscription.getBillingPeriod() == null) {
            throw new IllegalArgumentException("Billing period is required");
        }
    }
}
