package com.subscriptiontracker.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

import java.time.Duration;

/** Per-client request limit for the sensitive authentication endpoints. */
@ConfigurationProperties(prefix = "app.rate-limit")
public record RateLimitProperties(
        @DefaultValue("true") boolean enabled,
        @DefaultValue("10") int maxRequests,
        @DefaultValue("PT1M") Duration window) {
}
