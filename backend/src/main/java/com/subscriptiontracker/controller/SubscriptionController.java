package com.subscriptiontracker.controller;

import org.springframework.web.bind.annotation.*;

import com.subscriptiontracker.backend.entity.Subscription;
import com.subscriptiontracker.backend.service.SubscriptionService;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/subscriptions")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    public SubscriptionController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @PostMapping
    public Subscription createSubscription(@RequestBody Subscription subscription) {
        return subscriptionService.createSubscription(subscription);
    }

    @GetMapping
    public List<Subscription> getAllSubscriptions() {
        return subscriptionService.getAllSubscriptions();
    }

    @GetMapping("/{id}")
    public Subscription getSubscriptionById(@PathVariable Long id) {
        return subscriptionService.getSubscriptionById(id);
    }

    @PutMapping("/{id}")
    public Subscription updateSubscription(
            @PathVariable Long id,
            @RequestBody Subscription subscription) {

        return subscriptionService.updateSubscription(id, subscription);
    }

    @DeleteMapping("/{id}")
    public void deleteSubscription(@PathVariable Long id) {
        subscriptionService.deleteSubscription(id);
    }

    @GetMapping("/total/monthly")
    public BigDecimal getMonthlyTotal() {
        return subscriptionService.calculateMonthlyTotal();
    }

    @GetMapping("/total/yearly")
    public BigDecimal getYearlyTotal() {
        return subscriptionService.calculateYearlyTotal();
    }
}