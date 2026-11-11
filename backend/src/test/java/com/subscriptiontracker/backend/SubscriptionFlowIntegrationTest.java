package com.subscriptiontracker.backend;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SubscriptionFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private String create(String url, String json) throws Exception {
        return mockMvc.perform(
                        post(url)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(json))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
    }

    @Test
    void userCanTrackSubscriptionsAndSeeTotals() throws Exception {
        String userJson = create("/api/users", "{\"name\":\"Dilara\"}");
        Integer userId = JsonPath.read(userJson, "$.id");
        String base = "/api/users/" + userId + "/subscriptions";

        create(base, "{\"name\":\"Netflix\",\"price\":100,\"billingPeriod\":\"MONTHLY\",\"category\":\"ENTERTAINMENT\"}");
        create(base, "{\"name\":\"Domain\",\"price\":120,\"billingPeriod\":\"YEARLY\",\"category\":\"INTERNET\"}");
        create(base, "{\"name\":\"Gym app\",\"price\":10,\"billingPeriod\":\"WEEKLY\"}");
        String inactive = create(base, "{\"name\":\"Old\",\"price\":999,\"billingPeriod\":\"MONTHLY\",\"active\":false}");

        mockMvc.perform(get(base))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(4));

        mockMvc.perform(get(base + "/total/monthly"))
                .andExpect(status().isOk())
                .andExpect(content().string("153.33"));

        mockMvc.perform(get(base + "/total/yearly"))
                .andExpect(status().isOk())
                .andExpect(content().string("1840.00"));

        Integer inactiveId = JsonPath.read(inactive, "$.id");
        mockMvc.perform(delete("/api/subscriptions/" + inactiveId))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/subscriptions/" + inactiveId))
                .andExpect(status().isNotFound());
    }

    @Test
    void creatingSubscriptionForUnknownUserReturns404() throws Exception {
        mockMvc.perform(post("/api/users/999999/subscriptions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Netflix\",\"price\":10,\"billingPeriod\":\"MONTHLY\"}"))
                .andExpect(status().isNotFound());
    }
}
