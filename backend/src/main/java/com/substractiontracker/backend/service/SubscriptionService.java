package com.substractiontracker.backend.service;

import com.substractiontracker.backend.entity.Subscription;
import com.substractiontracker.backend.repository.SubscriptionRepository;
import org.springframework.stereotype.Service;

import java.util.List;

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
}