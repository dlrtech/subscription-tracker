package com.subscriptiontracker.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.subscriptiontracker.backend.enums.BillingPeriod;
import com.subscriptiontracker.backend.enums.Category;

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

    public Long getId() {
    return id;
}

public String getName() {
    return name;
}

public void setName(String name) {
    this.name = name;
}

public BigDecimal getPrice() {
    return price;
}

public void setPrice(BigDecimal price) {
    this.price = price;
}

public BillingPeriod getBillingPeriod() {
    return billingPeriod;
}

public void setBillingPeriod(BillingPeriod billingPeriod) {
    this.billingPeriod = billingPeriod;
}

public LocalDate getNextBillingDate() {
    return nextBillingDate;
}

public void setNextBillingDate(LocalDate nextBillingDate) {
    this.nextBillingDate = nextBillingDate;
}

public Category getCategory() {
    return category;
}

public void setCategory(Category category) {
    this.category = category;
}

public boolean isActive() {
    return active;
}

public void setActive(boolean active) {
    this.active = active;
}

public User getUser() {
    return user;
}

public void setUser(User user) {
    this.user = user;
}
}