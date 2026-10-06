package com.subscriptiontracker.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;


@Entity
public class Subscription {
    @Id
    @GeneratedValue
    private Long id;

    private String name;
    private BigDecimal price;
    private BillingPeriod billingPeriod;
    private LocalDate nextBillingDate;
    private Category category;
    private boolean active;
    private User user;
}