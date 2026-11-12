package com.subscriptiontracker.backend;

import com.subscriptiontracker.backend.service.ExchangeRateService;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Listing (search, filter, sort, paging) and the cross-currency total. */
class SubscriptionSearchApiTest extends ApiTestSupport {

    @MockitoBean
    private ExchangeRateService exchangeRates;

    private void add(String token, String name, String price, String currency, boolean active) throws Exception {
        mockMvc.perform(json(post("/api/subscriptions"), token, """
                        {"name":"%s","price":%s,"currency":"%s","billingPeriod":"MONTHLY",
                         "nextBillingDate":"%s","active":%s}
                        """.formatted(name, price, currency, LocalDate.now().plusDays(20), active)))
                .andExpect(status().isCreated());
    }

    @Test
    void searchFilterSortAndPaging() throws Exception {
        String token = registerAndGetToken();
        add(token, "Netflix", "100", "TRY", true);
        add(token, "Spotify", "50", "TRY", true);
        add(token, "Spotify Family", "80", "TRY", false);
        add(token, "100% Sure_Gym", "30", "TRY", true);

        mockMvc.perform(authorized(get("/api/subscriptions").param("q", "SPOT").param("sort", "name"), token))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Total-Count", "2"))
                .andExpect(jsonPath("$[*].name").value(contains("Spotify", "Spotify Family")));

        mockMvc.perform(authorized(get("/api/subscriptions").param("active", "false"), token))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("Spotify Family"));

        mockMvc.perform(authorized(get("/api/subscriptions").param("sort", "price").param("order", "desc"), token))
                .andExpect(jsonPath("$[*].name").value(contains("Netflix", "Spotify Family", "Spotify", "100% Sure_Gym")));

        // Wildcards typed by the user are matched literally.
        mockMvc.perform(authorized(get("/api/subscriptions").param("q", "100%"), token))
                .andExpect(header().string("X-Total-Count", "1"))
                .andExpect(jsonPath("$[0].name").value("100% Sure_Gym"));
        mockMvc.perform(authorized(get("/api/subscriptions").param("q", "%"), token))
                .andExpect(header().string("X-Total-Count", "1"));

        mockMvc.perform(authorized(get("/api/subscriptions").param("size", "2").param("page", "1")
                        .param("sort", "name"), token))
                .andExpect(header().string("X-Total-Count", "4"))
                .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    void listingOnlyReturnsTheCallersSubscriptions() throws Exception {
        String mine = registerAndGetToken();
        String other = registerAndGetToken();
        add(other, "Secret", "10", "TRY", true);

        mockMvc.perform(authorized(get("/api/subscriptions").param("q", "Secret"), mine))
                .andExpect(header().string("X-Total-Count", "0"))
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void invalidListParametersAreRejected() throws Exception {
        String token = registerAndGetToken();
        mockMvc.perform(authorized(get("/api/subscriptions").param("sort", "color"), token))
                .andExpect(status().isBadRequest());
        mockMvc.perform(authorized(get("/api/subscriptions").param("order", "sideways"), token))
                .andExpect(status().isBadRequest());
        mockMvc.perform(authorized(get("/api/subscriptions").param("size", "1000"), token))
                .andExpect(status().isBadRequest());
    }

    @Test
    void totalConvertsAllCurrenciesIntoTheTarget() throws Exception {
        String token = registerAndGetToken();
        add(token, "Netflix", "100", "TRY", true);
        add(token, "Spotify", "10", "USD", true);
        add(token, "Mystery", "5", "XYZ", true);

        // 1 TRY = 0.025 USD  ->  10 USD = 400 TRY
        when(exchangeRates.ratesFor("TRY")).thenReturn(Optional.of(new ExchangeRateService.Rates(
                "TRY", LocalDate.of(2026, 11, 12), Map.of("USD", new BigDecimal("0.025")))));

        mockMvc.perform(authorized(get("/api/subscriptions/summary/total").param("currency", "try"), token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currency").value("TRY"))
                .andExpect(jsonPath("$.monthlyTotal").value(500.0))
                .andExpect(jsonPath("$.yearlyTotal").value(6000.0))
                // Subscriptions were created without a category, so they land in OTHER; amounts are converted too.
                .andExpect(jsonPath("$.monthlyByCategory.OTHER").value(500.0))
                .andExpect(jsonPath("$.unconvertedCurrencies[0]").value("XYZ"))
                .andExpect(jsonPath("$.ratesDate").value("2026-11-12"));
    }

    @Test
    void totalStillWorksWhenRatesAreUnavailable() throws Exception {
        String token = registerAndGetToken();
        add(token, "Netflix", "100", "TRY", true);
        add(token, "Spotify", "10", "USD", true);
        when(exchangeRates.ratesFor(anyString())).thenReturn(Optional.empty());

        mockMvc.perform(authorized(get("/api/subscriptions/summary/total").param("currency", "TRY"), token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.monthlyTotal").value(100.0))
                .andExpect(jsonPath("$.unconvertedCurrencies[0]").value("USD"))
                .andExpect(jsonPath("$.ratesDate").doesNotExist());
    }

    @Test
    void totalRejectsInvalidCurrency() throws Exception {
        mockMvc.perform(authorized(get("/api/subscriptions/summary/total").param("currency", "TURKISH"),
                        registerAndGetToken()))
                .andExpect(status().isBadRequest());
    }
}
