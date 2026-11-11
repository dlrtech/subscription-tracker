package com.subscriptiontracker.backend.controller;

import com.subscriptiontracker.backend.entity.Subscription;
import com.subscriptiontracker.backend.enums.BillingPeriod;
import com.subscriptiontracker.backend.exception.ResourceNotFoundException;
import com.subscriptiontracker.backend.service.SubscriptionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SubscriptionController.class)
class SubscriptionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SubscriptionService subscriptionService;

    @Test
    void create_returns201WithBody() throws Exception {
        Subscription saved = new Subscription();
        saved.setName("Netflix");
        saved.setPrice(new BigDecimal("15.99"));
        saved.setBillingPeriod(BillingPeriod.MONTHLY);
        saved.setActive(true);
        when(subscriptionService.createSubscription(eq(1L), any())).thenReturn(saved);

        mockMvc.perform(post("/api/users/1/subscriptions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Netflix","price":15.99,"billingPeriod":"MONTHLY"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Netflix"))
                .andExpect(jsonPath("$.billingPeriod").value("MONTHLY"))
                .andExpect(jsonPath("$.active").value(true));
    }

    @Test
    void create_returns400WhenInvalid() throws Exception {
        mockMvc.perform(post("/api/users/1/subscriptions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"","price":-5}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.name").exists())
                .andExpect(jsonPath("$.errors.price").exists())
                .andExpect(jsonPath("$.errors.billingPeriod").exists());

        verify(subscriptionService, never()).createSubscription(any(), any());
    }

    @Test
    void create_returns400ForUnknownEnumValue() throws Exception {
        mockMvc.perform(post("/api/users/1/subscriptions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Netflix","price":10,"billingPeriod":"DAILY"}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getById_returns404WhenMissing() throws Exception {
        when(subscriptionService.getSubscriptionById(42L))
                .thenThrow(new ResourceNotFoundException("Subscription not found"));

        mockMvc.perform(get("/api/subscriptions/42"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value("Subscription not found"));
    }

    @Test
    void monthlyTotal_returnsAmount() throws Exception {
        when(subscriptionService.calculateMonthlyTotal(1L)).thenReturn(new BigDecimal("153.33"));

        mockMvc.perform(get("/api/users/1/subscriptions/total/monthly"))
                .andExpect(status().isOk())
                .andExpect(content().string("153.33"));
    }
}
