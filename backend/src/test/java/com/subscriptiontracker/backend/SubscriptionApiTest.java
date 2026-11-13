package com.subscriptiontracker.backend;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class SubscriptionApiTest extends ApiTestSupport {

    private static final LocalDate TODAY = LocalDate.now();

    private Integer create(String token, String body) throws Exception {
        String response = mockMvc.perform(json(post("/api/subscriptions"), token, body))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(response, "$.id");
    }

    private static String sub(String name, String price, String period, LocalDate next) {
        return """
                {"name":"%s","price":%s,"billingPeriod":"%s","nextBillingDate":"%s"}
                """.formatted(name, price, period, next);
    }

    @Test
    void crudLifecycle() throws Exception {
        String token = registerAndGetToken();
        LocalDate next = TODAY.plusDays(10);

        Integer id = create(token, """
                {"name":"Netflix","price":149.99,"currency":"try","billingPeriod":"MONTHLY",
                 "nextBillingDate":"%s","category":"ENTERTAINMENT"}
                """.formatted(next));

        mockMvc.perform(authorized(get("/api/subscriptions/" + id), token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Netflix"))
                .andExpect(jsonPath("$.currency").value("TRY"))
                .andExpect(jsonPath("$.active").value(true))
                .andExpect(jsonPath("$.monthlyCost").value(149.99))
                .andExpect(jsonPath("$.nextBillingDate").value(next.toString()));

        mockMvc.perform(json(put("/api/subscriptions/" + id), token, """
                        {"name":"Netflix Premium","price":229.99,"billingPeriod":"MONTHLY",
                         "nextBillingDate":"%s","category":"ENTERTAINMENT","active":false}
                        """.formatted(next)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Netflix Premium"))
                .andExpect(jsonPath("$.active").value(false));

        mockMvc.perform(authorized(get("/api/subscriptions?active=false"), token))
                .andExpect(jsonPath("$", hasSize(1)));
        mockMvc.perform(authorized(get("/api/subscriptions?active=true"), token))
                .andExpect(jsonPath("$", hasSize(0)));

        mockMvc.perform(authorized(delete("/api/subscriptions/" + id), token)).andExpect(status().isNoContent());
        mockMvc.perform(authorized(get("/api/subscriptions/" + id), token)).andExpect(status().isNotFound());
    }

    @Test
    void pastBillingDateIsMovedToNextOccurrenceOnCreate() throws Exception {
        String token = registerAndGetToken();
        LocalDate anchor = TODAY.minusMonths(2).minusDays(1);

        Integer id = create(token, sub("Gym", "300", "MONTHLY", anchor));

        String next = JsonPath.read(mockMvc.perform(authorized(get("/api/subscriptions/" + id), token))
                .andReturn().getResponse().getContentAsString(), "$.nextBillingDate");
        LocalDate nextDate = LocalDate.parse(next);
        org.assertj.core.api.Assertions.assertThat(nextDate).isAfterOrEqualTo(TODAY);
        org.assertj.core.api.Assertions.assertThat(nextDate).isBefore(TODAY.plusMonths(1).plusDays(1));
    }

    @Test
    void usersCannotSeeOrModifyEachOthersSubscriptions() throws Exception {
        String alice = registerAndGetToken();
        String bob = registerAndGetToken();
        Integer aliceSub = create(alice, sub("Netflix", "10", "MONTHLY", TODAY.plusDays(1)));

        mockMvc.perform(authorized(get("/api/subscriptions"), bob)).andExpect(jsonPath("$", hasSize(0)));
        mockMvc.perform(authorized(get("/api/subscriptions/" + aliceSub), bob)).andExpect(status().isNotFound());
        mockMvc.perform(json(put("/api/subscriptions/" + aliceSub), bob, sub("Hacked", "1", "MONTHLY", TODAY)))
                .andExpect(status().isNotFound());
        mockMvc.perform(authorized(delete("/api/subscriptions/" + aliceSub), bob)).andExpect(status().isNotFound());

        mockMvc.perform(authorized(get("/api/subscriptions/" + aliceSub), alice))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Netflix"));
    }

    @Test
    void upcomingListsActivePaymentsWithinRangeInDateOrder() throws Exception {
        String token = registerAndGetToken();
        create(token, sub("In5", "10", "MONTHLY", TODAY.plusDays(5)));
        create(token, sub("Today", "10", "MONTHLY", TODAY));
        create(token, sub("In20", "10", "MONTHLY", TODAY.plusDays(20)));
        create(token, """
                {"name":"Paused","price":10,"billingPeriod":"MONTHLY","nextBillingDate":"%s","active":false}
                """.formatted(TODAY.plusDays(1)));

        mockMvc.perform(authorized(get("/api/subscriptions/upcoming"), token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].name").value("Today"))
                .andExpect(jsonPath("$[1].name").value("In5"));

        mockMvc.perform(authorized(get("/api/subscriptions/upcoming?days=30"), token))
                .andExpect(jsonPath("$", hasSize(3)));

        mockMvc.perform(authorized(get("/api/subscriptions/upcoming?days=-1"), token))
                .andExpect(status().isBadRequest());
        mockMvc.perform(authorized(get("/api/subscriptions/upcoming?days=abc"), token))
                .andExpect(status().isBadRequest());
    }

    @Test
    void summaryTotalsPerCurrency() throws Exception {
        String token = registerAndGetToken();
        create(token, """
                {"name":"Netflix","price":100,"billingPeriod":"MONTHLY","nextBillingDate":"%s","category":"ENTERTAINMENT"}
                """.formatted(TODAY));
        create(token, sub("Domain", "120", "YEARLY", TODAY));
        create(token, sub("Coach", "10", "WEEKLY", TODAY));
        create(token, """
                {"name":"GitHub","price":4,"currency":"USD","billingPeriod":"MONTHLY","nextBillingDate":"%s","category":"SOFTWARE"}
                """.formatted(TODAY));

        mockMvc.perform(authorized(get("/api/subscriptions/summary"), token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].currency").value("TRY"))
                .andExpect(jsonPath("$[0].activeSubscriptions").value(3))
                .andExpect(jsonPath("$[0].monthlyTotal").value(153.33))
                .andExpect(jsonPath("$[0].yearlyTotal").value(1840.00))
                .andExpect(jsonPath("$[0].monthlyByCategory.ENTERTAINMENT").value(100.00))
                .andExpect(jsonPath("$[0].monthlyByCategory.OTHER").value(53.33))
                .andExpect(jsonPath("$[1].currency").value("USD"))
                .andExpect(jsonPath("$[1].monthlyTotal").value(4.00));
    }

    @Test
    void invalidRequestsAreRejected() throws Exception {
        String token = registerAndGetToken();

        mockMvc.perform(json(post("/api/subscriptions"), token, """
                        {"name":"","price":-5,"currency":"TL"}
                        """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.name").exists())
                .andExpect(jsonPath("$.errors.price").exists())
                .andExpect(jsonPath("$.errors.currency").exists())
                .andExpect(jsonPath("$.errors.billingPeriod").exists())
                .andExpect(jsonPath("$.errors.nextBillingDate").exists());

        mockMvc.perform(json(post("/api/subscriptions"), token, sub("X", "10", "DAILY", TODAY)))
                .andExpect(status().isBadRequest());

        mockMvc.perform(json(post("/api/subscriptions"), token, "{not json"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(authorized(get("/api/subscriptions/abc"), token))
                .andExpect(status().isBadRequest());
    }

    @Test
    void corsPreflightIsAllowedForConfiguredOrigin() throws Exception {
        mockMvc.perform(options("/api/subscriptions")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "Authorization,Content-Type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
    }

    @Test
    void healthIsPublicButApiDocsAreNotExposedByDefault() throws Exception {
        mockMvc.perform(get("/actuator/health")).andExpect(status().isOk());
        // The documentation lists every endpoint, so it must stay off unless API_DOCS_ENABLED is set.
        mockMvc.perform(get("/v3/api-docs")).andExpect(status().isNotFound());
        mockMvc.perform(get("/swagger-ui/index.html")).andExpect(status().isNotFound());
    }
}
