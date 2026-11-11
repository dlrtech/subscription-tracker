package com.subscriptiontracker.backend.service;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Keeps next billing dates current: once at startup (covers downtime) and then every night. */
@Component
public class BillingDateScheduler {

    private final SubscriptionService subscriptionService;

    public BillingDateScheduler(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onStartup() {
        subscriptionService.advanceBillingDates();
    }

    @Scheduled(cron = "${app.billing.update-cron:0 5 0 * * *}")
    public void nightly() {
        subscriptionService.advanceBillingDates();
    }
}
