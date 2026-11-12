package com.subscriptiontracker.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import com.subscriptiontracker.backend.entity.Subscription;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long>, JpaSpecificationExecutor<Subscription> {

    List<Subscription> findByUserIdOrderByNextBillingDateAscIdAsc(Long userId);

    List<Subscription> findByUserIdAndActiveOrderByNextBillingDateAscIdAsc(Long userId, boolean active);

    List<Subscription> findByUserIdAndActiveTrue(Long userId);

    List<Subscription> findByUserIdAndActiveTrueAndNextBillingDateBetweenOrderByNextBillingDateAscIdAsc(
            Long userId, LocalDate from, LocalDate to);

    Optional<Subscription> findByIdAndUserId(Long id, Long userId);

    List<Subscription> findByNextBillingDateBefore(LocalDate date);

    /** Active subscriptions of verified users with reminders on, due soon and not yet announced. */
    @Query("""
            select s from Subscription s join fetch s.user u
            where s.active = true and u.emailVerified = true and u.remindersEnabled = true
              and s.nextBillingDate >= :from and s.nextBillingDate <= :to
              and (s.lastRemindedFor is null or s.lastRemindedFor <> s.nextBillingDate)
            order by u.id, s.nextBillingDate, s.id
            """)
    List<Subscription> findReminderCandidates(LocalDate from, LocalDate to);

    @Modifying
    @Query("delete from Subscription s where s.user.id = :userId")
    void deleteAllByUserId(Long userId);
}
