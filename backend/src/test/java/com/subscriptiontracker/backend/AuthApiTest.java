package com.subscriptiontracker.backend;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthApiTest extends ApiTestSupport {

    private org.springframework.test.web.servlet.ResultActions login(String email, String password) throws Exception {
        return mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"email":"%s","password":"%s"}
                        """.formatted(email, password)));
    }

    @Test
    void registerReturnsTokenAndNormalizedUser() throws Exception {
        String email = uniqueEmail();
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"  %s ","password":"%s","name":" Dilara "}
                                """.formatted(email.toUpperCase(), PASSWORD)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.expiresIn").value(3600))
                .andExpect(jsonPath("$.user.email").value(email))
                .andExpect(jsonPath("$.user.name").value("Dilara"))
                .andExpect(jsonPath("$.user.passwordHash").doesNotExist());
    }

    @Test
    void registerRejectsDuplicateEmail() throws Exception {
        String email = uniqueEmail();
        registerAndGetToken(email);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"%s","name":"Again"}
                                """.formatted(email, PASSWORD)))
                .andExpect(status().isConflict());
    }

    @Test
    void registerValidatesInput() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"not-an-email","password":"short","name":""}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.email").exists())
                .andExpect(jsonPath("$.errors.password").exists())
                .andExpect(jsonPath("$.errors.name").exists());
    }

    @Test
    void loginSucceedsWithCorrectPasswordOnly() throws Exception {
        String email = uniqueEmail();
        registerAndGetToken(email);

        login(email, PASSWORD).andExpect(status().isOk()).andExpect(jsonPath("$.accessToken").isNotEmpty());
        login(email, "wrong-password").andExpect(status().isUnauthorized());
        login(uniqueEmail(), PASSWORD).andExpect(status().isUnauthorized());
    }

    @Test
    void protectedEndpointsRequireValidToken() throws Exception {
        mockMvc.perform(get("/api/users/me")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/subscriptions")).andExpect(status().isUnauthorized());
        mockMvc.perform(authorized(get("/api/users/me"), "not.a.valid.token")).andExpect(status().isUnauthorized());
    }

    @Test
    void userCanManageOwnProfile() throws Exception {
        String email = uniqueEmail();
        String token = registerAndGetToken(email);

        mockMvc.perform(authorized(get("/api/users/me"), token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email));

        mockMvc.perform(json(put("/api/users/me"), token, "{\"name\":\"New Name\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("New Name"));
    }

    @Test
    void changePasswordRequiresCurrentPassword() throws Exception {
        String email = uniqueEmail();
        String token = registerAndGetToken(email);

        mockMvc.perform(json(put("/api/users/me/password"), token, """
                        {"currentPassword":"wrong-password","newPassword":"another-password"}
                        """))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(json(put("/api/users/me/password"), token, """
                        {"currentPassword":"%s","newPassword":"another-password"}
                        """.formatted(PASSWORD)))
                .andExpect(status().isNoContent());

        login(email, PASSWORD).andExpect(status().isUnauthorized());
        login(email, "another-password").andExpect(status().isOk());
    }

    @Test
    void deleteAccountRemovesUserAndSubscriptions() throws Exception {
        String email = uniqueEmail();
        String token = registerAndGetToken(email);
        mockMvc.perform(json(post("/api/subscriptions"), token, """
                        {"name":"Netflix","price":10,"billingPeriod":"MONTHLY","nextBillingDate":"2099-01-01"}
                        """))
                .andExpect(status().isCreated());

        mockMvc.perform(authorized(delete("/api/users/me"), token)).andExpect(status().isNoContent());

        mockMvc.perform(authorized(get("/api/users/me"), token)).andExpect(status().isNotFound());
        login(email, PASSWORD).andExpect(status().isUnauthorized());
    }
}
