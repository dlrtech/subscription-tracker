package com.subscriptiontracker.backend.security;

import com.subscriptiontracker.backend.config.RateLimitProperties;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Fixed-window limiter (per client address and endpoint) that slows down password guessing and
 * e-mail flooding. State is in memory, so it is per instance - enough for a single-instance deployment.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Set<String> LIMITED_PATHS = Set.of(
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/forgot-password",
            "/api/auth/reset-password",
            "/api/auth/verify-email",
            "/api/users/me/resend-verification");

    private record Window(long startedAtMillis, int count) {
    }

    private final RateLimitProperties properties;
    private final Clock clock;
    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    public RateLimitFilter(RateLimitProperties properties, Clock clock) {
        this.properties = properties;
        this.clock = clock;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !properties.enabled()
                || !HttpMethod.POST.matches(request.getMethod())
                || !LIMITED_PATHS.contains(request.getRequestURI());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        long now = clock.millis();
        long windowMillis = properties.window().toMillis();
        evictExpired(now, windowMillis);

        String key = request.getRemoteAddr() + "|" + request.getRequestURI();
        Window window = windows.merge(key, new Window(now, 1),
                (old, fresh) -> now - old.startedAtMillis() >= windowMillis
                        ? fresh
                        : new Window(old.startedAtMillis(), old.count() + 1));

        if (window.count() > properties.maxRequests()) {
            long retryAfter = Math.max(1, (window.startedAtMillis() + windowMillis - now + 999) / 1000);
            response.setStatus(429);
            response.setHeader("Retry-After", String.valueOf(retryAfter));
            response.setContentType("application/problem+json");
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.getWriter().write("{\"status\":429,\"detail\":\"Too many requests, please try again later\"}");
            return;
        }
        chain.doFilter(request, response);
    }

    private void evictExpired(long now, long windowMillis) {
        if (windows.size() > 10_000) {
            windows.values().removeIf(w -> now - w.startedAtMillis() >= windowMillis);
        }
    }
}
