package com.subscriptiontracker.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import com.subscriptiontracker.backend.entity.Subscription;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    List<Subscription> findByUserIdOrderByNextBillingDateAscIdAsc(Long userId);

    List<Subscription> findByUserIdAndActiveOrderByNextBillingDateAscIdAsc(Long userId, boolean active);

    List<Subscription> findByUserIdAndActiveTrue(Long userId);

    List<Subscription> findByUserIdAndActiveTrueAndNextBillingDateBetweenOrderByNextBillingDateAscIdAsc(
            Long userId, LocalDate from, LocalDate to);

    Optional<Subscription> findByIdAndUserId(Long id, Long userId);

    List<Subscription> findByNextBillingDateBefore(LocalDate date);

    @Modifying
    @Query("delete from Subscription s where s.user.id = :userId")
    void deleteAllByUserId(Long userId);
}
