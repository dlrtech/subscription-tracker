package com.subscriptiontracker.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

import java.time.Duration;

/** Lifetimes of the one-time tokens and the settings of the refresh-token cookie. */
@ConfigurationProperties(prefix = "app.auth")
public record AuthProperties(
        @DefaultValue("P30D") Duration refreshExpiration,
        @DefaultValue("PT1H") Duration resetExpiration,
        @DefaultValue("P2D") Duration verifyExpiration,
        @DefaultValue("true") boolean cookieSecure,
        @DefaultValue("None") String cookieSameSite) {
}
