package com.subscriptiontracker.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.subscriptiontracker.backend.entity.Subscription;


public interface SubscriptionRepository
        extends JpaRepository<Subscription, Long> {
}
