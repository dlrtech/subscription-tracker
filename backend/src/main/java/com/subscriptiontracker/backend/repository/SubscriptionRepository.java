package com.subscriptiontracker.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.subscriptiontracker.backend.entity.Subscription;

import java.util.List;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    List<Subscription> findByUserId(Long userId);

    List<Subscription> findByUserIdAndActiveTrue(Long userId);
}
