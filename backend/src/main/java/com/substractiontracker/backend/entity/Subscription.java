package com.substractiontracker.backend.entity;

import com.substractiontracker.backend.enums.BillingPeriod;
import com.substractiontracker.backend.enums.Category;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
public class Subscription {

    @Id
    @GeneratedValue
    private Long id;

    private String name;

    private BigDecimal price;

    @Enumerated(EnumType.STRING)
    private BillingPeriod billingPeriod;

    private LocalDate nextBillingDate;

    @Enumerated(EnumType.STRING)
    private Category category;

    private boolean active;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
}