package com.substractiontracker.backend.repository;

import com.substractiontracker.backend.entity.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;


public interface SubscriptionRepository
        extends JpaRepository<Subscription, Long> {
}
