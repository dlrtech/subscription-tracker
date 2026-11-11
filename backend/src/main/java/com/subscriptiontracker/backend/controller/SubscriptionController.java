package com.subscriptiontracker.backend.controller;

import com.subscriptiontracker.backend.dto.SpendingSummaryResponse;
import com.subscriptiontracker.backend.dto.SubscriptionRequest;
import com.subscriptiontracker.backend.dto.SubscriptionResponse;
import com.subscriptiontracker.backend.service.SubscriptionService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static com.subscriptiontracker.backend.security.TokenService.userId;

@RestController
@RequestMapping("/api/subscriptions")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    public SubscriptionController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SubscriptionResponse create(@AuthenticationPrincipal Jwt jwt,
                                       @Valid @RequestBody SubscriptionRequest request) {
        return SubscriptionResponse.from(subscriptionService.create(userId(jwt), request));
    }

    /** Lists the caller's subscriptions ordered by next billing date; optionally filtered by status. */
    @GetMapping
    public List<SubscriptionResponse> list(@AuthenticationPrincipal Jwt jwt,
                                           @RequestParam(required = false) Boolean active) {
        return subscriptionService.list(userId(jwt), active).stream()
                .map(SubscriptionResponse::from)
                .toList();
    }

    /** Active subscriptions due between today and {@code days} days from now. */
    @GetMapping("/upcoming")
    public List<SubscriptionResponse> upcoming(@AuthenticationPrincipal Jwt jwt,
                                               @RequestParam(defaultValue = "7")
                                               @Min(value = 0, message = "days must be at least 0")
                                               @Max(value = 366, message = "days must be at most 366")
                                               int days) {
        return subscriptionService.upcoming(userId(jwt), days).stream()
                .map(SubscriptionResponse::from)
                .toList();
    }

    /** Monthly and yearly spending per currency, with a per-category monthly breakdown. */
    @GetMapping("/summary")
    public List<SpendingSummaryResponse> summary(@AuthenticationPrincipal Jwt jwt) {
        return subscriptionService.summary(userId(jwt));
    }

    @GetMapping("/{id}")
    public SubscriptionResponse get(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return SubscriptionResponse.from(subscriptionService.get(userId(jwt), id));
    }

    @PutMapping("/{id}")
    public SubscriptionResponse update(@AuthenticationPrincipal Jwt jwt,
                                       @PathVariable Long id,
                                       @Valid @RequestBody SubscriptionRequest request) {
        return SubscriptionResponse.from(subscriptionService.update(userId(jwt), id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        subscriptionService.delete(userId(jwt), id);
    }
}
