package com.subscriptiontracker.backend;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@TestPropertySource(properties = "app.rate-limit.max-requests=3")
class RateLimitApiTest extends ApiTestSupport {

    private org.springframework.test.web.servlet.ResultActions login(String email) throws Exception {
        return mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"%s\",\"password\":\"wrong-password\"}".formatted(email)));
    }

    @Test
    void repeatedLoginAttemptsAreThrottled() throws Exception {
        String email = uniqueEmail();
        for (int i = 0; i < 3; i++) {
            login(email).andExpect(status().isUnauthorized());
        }
        login(email).andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"));
    }

    @Test
    void otherEndpointsAreNotAffected() throws Exception {
        for (int i = 0; i < 6; i++) {
            mockMvc.perform(post("/api/auth/refresh").header("X-Requested-With", "subtracker"))
                    .andExpect(status().isUnauthorized());
        }
    }
}
