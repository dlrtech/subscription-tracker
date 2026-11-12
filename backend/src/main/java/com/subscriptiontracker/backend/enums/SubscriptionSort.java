package com.subscriptiontracker.backend.enums;

import java.util.Locale;

/** Sortable fields of the subscription list; maps the public API value to the entity property. */
public enum SubscriptionSort {
    DATE("nextBillingDate"),
    NAME("name"),
    PRICE("price");

    private final String property;

    SubscriptionSort(String property) {
        this.property = property;
    }

    public String property() {
        return property;
    }

    public static SubscriptionSort parse(String value) {
        if (value == null || value.isBlank()) {
            return DATE;
        }
        try {
            return valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("sort must be one of: date, name, price");
        }
    }
}
