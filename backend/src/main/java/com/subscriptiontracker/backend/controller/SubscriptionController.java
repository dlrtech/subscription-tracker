package com.subscriptiontracker.backend.controller;

import com.subscriptiontracker.backend.dto.SpendingSummaryResponse;
import com.subscriptiontracker.backend.dto.SubscriptionRequest;
import com.subscriptiontracker.backend.dto.SubscriptionResponse;
import com.subscriptiontracker.backend.dto.TotalSpendingResponse;
import com.subscriptiontracker.backend.entity.Subscription;
import com.subscriptiontracker.backend.enums.SubscriptionSort;
import com.subscriptiontracker.backend.service.SpendingTotalService;
import com.subscriptiontracker.backend.service.SubscriptionService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Locale;

import static com.subscriptiontracker.backend.security.TokenService.userId;

@RestController
@RequestMapping("/api/subscriptions")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    private final SpendingTotalService spendingTotalService;

    public SubscriptionController(SubscriptionService subscriptionService, SpendingTotalService spendingTotalService) {
        this.subscriptionService = subscriptionService;
        this.spendingTotalService = spendingTotalService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SubscriptionResponse create(@AuthenticationPrincipal Jwt jwt,
                                       @Valid @RequestBody SubscriptionRequest request) {
        return SubscriptionResponse.from(subscriptionService.create(userId(jwt), request));
    }

    /**
     * Lists the caller's subscriptions. Optional filters: {@code active}, {@code q} (name search);
     * {@code sort} is date (default), name or price with {@code order} asc (default) or desc.
     * The total number of matches is returned in the {@code X-Total-Count} header.
     */
    @GetMapping
    public ResponseEntity<List<SubscriptionResponse>> list(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) @Size(max = 100, message = "q must be at most 100 characters") String q,
            @RequestParam(defaultValue = "date") String sort,
            @RequestParam(defaultValue = "asc") String order,
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "page must be at least 0") int page,
            @RequestParam(defaultValue = "100")
            @Min(value = 1, message = "size must be at least 1")
            @Max(value = 200, message = "size must be at most 200") int size) {
        boolean descending = switch (order.toLowerCase(Locale.ROOT)) {
            case "asc" -> false;
            case "desc" -> true;
            default -> throw new IllegalArgumentException("order must be asc or desc");
        };
        Page<Subscription> result = subscriptionService.search(
                userId(jwt), active, q, SubscriptionSort.parse(sort), descending, page, size);
        return ResponseEntity.ok()
                .header("X-Total-Count", String.valueOf(result.getTotalElements()))
                .body(result.getContent().stream().map(SubscriptionResponse::from).toList());
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

    /** Everything converted into one currency using daily reference exchange rates. */
    @GetMapping("/summary/total")
    public TotalSpendingResponse total(@AuthenticationPrincipal Jwt jwt,
                                       @RequestParam(defaultValue = "TRY")
                                       @Pattern(regexp = "[A-Za-z]{3}", message = "currency must be a 3-letter code")
                                       String currency) {
        return spendingTotalService.total(userId(jwt), currency);
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
