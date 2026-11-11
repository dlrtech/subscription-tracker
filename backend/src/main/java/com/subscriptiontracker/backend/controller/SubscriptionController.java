package com.subscriptiontracker.backend.controller;

import com.subscriptiontracker.backend.dto.SubscriptionRequest;
import com.subscriptiontracker.backend.dto.SubscriptionResponse;
import com.subscriptiontracker.backend.service.SubscriptionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    public SubscriptionController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @PostMapping("/users/{userId}/subscriptions")
    @ResponseStatus(HttpStatus.CREATED)
    public SubscriptionResponse createSubscription(
            @PathVariable Long userId,
            @Valid @RequestBody SubscriptionRequest request) {
        return SubscriptionResponse.from(subscriptionService.createSubscription(userId, request));
    }

    @GetMapping("/users/{userId}/subscriptions")
    public List<SubscriptionResponse> getSubscriptionsForUser(@PathVariable Long userId) {
        return subscriptionService.getSubscriptionsForUser(userId).stream()
                .map(SubscriptionResponse::from)
                .toList();
    }

    @GetMapping("/users/{userId}/subscriptions/total/monthly")
    public BigDecimal getMonthlyTotal(@PathVariable Long userId) {
        return subscriptionService.calculateMonthlyTotal(userId);
    }

    @GetMapping("/users/{userId}/subscriptions/total/yearly")
    public BigDecimal getYearlyTotal(@PathVariable Long userId) {
        return subscriptionService.calculateYearlyTotal(userId);
    }

    @GetMapping("/subscriptions/{id}")
    public SubscriptionResponse getSubscriptionById(@PathVariable Long id) {
        return SubscriptionResponse.from(subscriptionService.getSubscriptionById(id));
    }

    @PutMapping("/subscriptions/{id}")
    public SubscriptionResponse updateSubscription(
            @PathVariable Long id,
            @Valid @RequestBody SubscriptionRequest request) {
        return SubscriptionResponse.from(subscriptionService.updateSubscription(id, request));
    }

    @DeleteMapping("/subscriptions/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteSubscription(@PathVariable Long id) {
        subscriptionService.deleteSubscription(id);
    }
}
