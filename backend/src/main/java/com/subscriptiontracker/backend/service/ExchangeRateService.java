package com.subscriptiontracker.backend.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.net.http.HttpClient;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Looks up daily reference exchange rates (default: the free Frankfurter API, European Central Bank data).
 * No user data is sent - only the currency code. Rates are cached; if the service is down the last known
 * rates are used, and without any the caller gets an empty result.
 */
@Service
public class ExchangeRateService {

    /** Units of each currency that equal one unit of the {@code base} currency. */
    public record Rates(String base, LocalDate date, Map<String, BigDecimal> perBaseUnit) {

        /** Converts an amount in {@code currency} into the base currency, or empty if the rate is unknown. */
        public Optional<BigDecimal> toBase(BigDecimal amount, String currency) {
            if (currency.equals(base)) {
                return Optional.of(amount);
            }
            BigDecimal rate = perBaseUnit.get(currency);
            if (rate == null || rate.signum() <= 0) {
                return Optional.empty();
            }
            return Optional.of(amount.divide(rate, 2, java.math.RoundingMode.HALF_UP));
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record ApiResponse(String date, Map<String, BigDecimal> rates) {
    }

    private record Cached(Rates rates, Instant fetchedAt) {
    }

    private static final Logger log = LoggerFactory.getLogger(ExchangeRateService.class);

    private final RestClient client;
    private final String url;
    private final Duration ttl;
    private final Clock clock;
    private final Map<String, Cached> cache = new ConcurrentHashMap<>();

    public ExchangeRateService(@Value("${app.exchange.url:https://api.frankfurter.dev/v1/latest}") String url,
                               @Value("${app.exchange.cache-ttl:PT6H}") Duration ttl,
                               Clock clock) {
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build());
        factory.setReadTimeout(Duration.ofSeconds(4));
        this.client = RestClient.builder().requestFactory(factory).build();
        this.url = url;
        this.ttl = ttl;
        this.clock = clock;
    }

    public Optional<Rates> ratesFor(String base) {
        Cached cached = cache.get(base);
        Instant now = clock.instant();
        if (cached != null && cached.fetchedAt().plus(ttl).isAfter(now)) {
            return Optional.of(cached.rates());
        }
        try {
            ApiResponse response = client.get().uri(url + "?base={base}", base).retrieve().body(ApiResponse.class);
            if (response == null || response.rates() == null || response.date() == null) {
                throw new IllegalStateException("Unexpected exchange rate response");
            }
            Rates rates = new Rates(base, LocalDate.parse(response.date()), Map.copyOf(response.rates()));
            cache.put(base, new Cached(rates, now));
            return Optional.of(rates);
        } catch (RuntimeException e) {
            log.warn("Could not load exchange rates for {}: {}", base, e.getMessage());
            return Optional.ofNullable(cached).map(Cached::rates);
        }
    }
}
