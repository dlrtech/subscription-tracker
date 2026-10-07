package com.subscriptiontracker.backend.service;

import org.springframework.stereotype.Service;

import com.subscriptiontracker.backend.entity.Subscription;
import com.subscriptiontracker.backend.enums.BillingPeriod;
import com.subscriptiontracker.backend.repository.SubscriptionRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;

    public SubscriptionService(SubscriptionRepository subscriptionRepository) {
        this.subscriptionRepository = subscriptionRepository;
    }

    public Subscription createSubscription(Subscription subscription) {

        if (subscription.getName() == null || subscription.getName().isBlank()) {
            throw new IllegalArgumentException("Subscription name cannot be empty");
        }

        if (subscription.getPrice() == null || subscription.getPrice().signum() <= 0) {
            throw new IllegalArgumentException("Subscription price must be greater than zero");
        }

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

    Subscription existingSubscription = subscriptionRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Subscription not found"));

    if (updatedSubscription.getName() == null || updatedSubscription.getName().isBlank()) {
        throw new IllegalArgumentException("Subscription name cannot be empty");
    }

    if (updatedSubscription.getPrice() == null ||
            updatedSubscription.getPrice().signum() <= 0) {
        throw new IllegalArgumentException("Subscription price must be greater than zero");
    }

    existingSubscription.setName(updatedSubscription.getName());
    existingSubscription.setPrice(updatedSubscription.getPrice());
    existingSubscription.setBillingPeriod(updatedSubscription.getBillingPeriod());
    existingSubscription.setNextBillingDate(updatedSubscription.getNextBillingDate());
    existingSubscription.setCategory(updatedSubscription.getCategory());
    existingSubscription.setActive(updatedSubscription.isActive());

    return subscriptionRepository.save(existingSubscription);
}
public BigDecimal calculateMonthlyTotal() {

    List<Subscription> subscriptions = subscriptionRepository.findAll();

    BigDecimal total = BigDecimal.ZERO;

    for (Subscription subscription : subscriptions) {

        if (!subscription.isActive()) {
            continue;
        }

        if (subscription.getBillingPeriod() == BillingPeriod.MONTHLY) {
            total = total.add(subscription.getPrice());
        }

        if (subscription.getBillingPeriod() == BillingPeriod.YEARLY) {
            BigDecimal monthlyPrice =
                    subscription.getPrice().divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP);

            total = total.add(monthlyPrice);
        }
    }

    return total;
}
public BigDecimal calculateYearlyTotal() {

    List<Subscription> subscriptions = subscriptionRepository.findAll();

    BigDecimal total = BigDecimal.ZERO;

    for (Subscription subscription : subscriptions) {

        if (!subscription.isActive()) {
            continue;
        }

        if (subscription.getBillingPeriod() == BillingPeriod.MONTHLY) {
            BigDecimal yearlyPrice =
                    subscription.getPrice().multiply(BigDecimal.valueOf(12));

            total = total.add(yearlyPrice);
        }

        if (subscription.getBillingPeriod() == BillingPeriod.YEARLY) {
            total = total.add(subscription.getPrice());
        }
    }

    return total;
}
}