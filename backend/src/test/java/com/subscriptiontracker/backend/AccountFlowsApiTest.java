package com.subscriptiontracker.backend;

import com.jayway.jsonpath.JsonPath;
import com.subscriptiontracker.backend.service.MailService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MvcResult;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Email verification, password reset, refresh-token sessions and reminder settings. */
class AccountFlowsApiTest extends ApiTestSupport {

    private static final Pattern TOKEN = Pattern.compile("token=([\\w-]+)");

    @MockitoBean
    private MailService mailService;

    private String register(String email) throws Exception {
        return mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"%s","name":"Test User"}
                                """.formatted(email, PASSWORD)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
    }

    /** Waits for the (asynchronous) mail to the address and returns the token inside its link. */
    private String tokenSentTo(String email) {
        ArgumentCaptor<String> body = ArgumentCaptor.forClass(String.class);
        verify(mailService, timeout(3000).atLeastOnce()).sendAsync(eq(email), anyString(), body.capture());
        Matcher matcher = TOKEN.matcher(body.getValue());
        if (!matcher.find()) {
            throw new AssertionError("No token link in mail: " + body.getValue());
        }
        return matcher.group(1);
    }

    private MvcResult login(String email, String password) throws Exception {
        return mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"%s"}
                                """.formatted(email, password)))
                .andReturn();
    }

    private static Cookie refreshCookie(MvcResult result) {
        Cookie cookie = result.getResponse().getCookie("st_refresh");
        if (cookie == null || cookie.getValue().isEmpty()) {
            throw new AssertionError("No refresh cookie set");
        }
        return cookie;
    }

    // --- Email verification -------------------------------------------------------------------------------

    @Test
    void newAccountIsUnverifiedUntilTheMailedLinkIsUsed() throws Exception {
        String email = uniqueEmail();
        String token = JsonPath.read(register(email), "$.accessToken");
        String verifyToken = tokenSentTo(email);

        mockMvc.perform(authorized(get("/api/users/me"), token))
                .andExpect(jsonPath("$.emailVerified").value(false));

        mockMvc.perform(post("/api/auth/verify-email").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"%s\"}".formatted(verifyToken)))
                .andExpect(status().isNoContent());

        mockMvc.perform(authorized(get("/api/users/me"), token))
                .andExpect(jsonPath("$.emailVerified").value(true));

        // The link works only once.
        mockMvc.perform(post("/api/auth/verify-email").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"%s\"}".formatted(verifyToken)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void invalidVerificationTokenIsRejected() throws Exception {
        mockMvc.perform(post("/api/auth/verify-email").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"does-not-exist\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void verificationMailCanBeRequestedAgainUntilVerified() throws Exception {
        String email = uniqueEmail();
        String token = JsonPath.read(register(email), "$.accessToken");
        String first = tokenSentTo(email);

        mockMvc.perform(authorized(post("/api/users/me/resend-verification"), token))
                .andExpect(status().isNoContent());

        // The old link is replaced by the new one.
        mockMvc.perform(post("/api/auth/verify-email").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"%s\"}".formatted(first)))
                .andExpect(status().isBadRequest());
    }

    // --- Password reset -----------------------------------------------------------------------------------

    @Test
    void passwordCanBeResetWithTheMailedLinkOnce() throws Exception {
        String email = uniqueEmail();
        register(email);
        org.mockito.Mockito.reset(mailService);

        mockMvc.perform(post("/api/auth/forgot-password").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"%s\"}".formatted(email)))
                .andExpect(status().isNoContent());
        String resetToken = tokenSentTo(email);

        mockMvc.perform(post("/api/auth/reset-password").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"%s\",\"newPassword\":\"brand-new-password\"}".formatted(resetToken)))
                .andExpect(status().isNoContent());

        org.assertj.core.api.Assertions.assertThat(login(email, PASSWORD).getResponse().getStatus()).isEqualTo(401);
        org.assertj.core.api.Assertions.assertThat(login(email, "brand-new-password").getResponse().getStatus())
                .isEqualTo(200);

        mockMvc.perform(post("/api/auth/reset-password").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"%s\",\"newPassword\":\"yet-another-password\"}".formatted(resetToken)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void forgotPasswordDoesNotRevealWhetherTheAddressExists() throws Exception {
        mockMvc.perform(post("/api/auth/forgot-password").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"%s\"}".formatted(uniqueEmail())))
                .andExpect(status().isNoContent());
        verify(mailService, never()).sendAsync(anyString(), anyString(), anyString());
    }

    @Test
    void resetRejectsWeakPasswords() throws Exception {
        mockMvc.perform(post("/api/auth/reset-password").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"x\",\"newPassword\":\"short\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.newPassword").exists());
    }

    // --- Refresh tokens -----------------------------------------------------------------------------------

    @Test
    void loginSetsAnHttpOnlyRefreshCookieAndRefreshRotatesIt() throws Exception {
        String email = uniqueEmail();
        register(email);

        MvcResult login = login(email, PASSWORD);
        Cookie first = refreshCookie(login);
        org.assertj.core.api.Assertions.assertThat(first.isHttpOnly()).isTrue();
        org.assertj.core.api.Assertions.assertThat(first.getPath()).isEqualTo("/api/auth");
        org.assertj.core.api.Assertions.assertThat(login.getResponse().getContentAsString())
                .doesNotContain(first.getValue());

        MvcResult refreshed = mockMvc.perform(post("/api/auth/refresh")
                        .header("X-Requested-With", "subtracker").cookie(first))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value(email))
                .andReturn();
        Cookie second = refreshCookie(refreshed);
        org.assertj.core.api.Assertions.assertThat(second.getValue()).isNotEqualTo(first.getValue());

        // The used refresh token cannot be replayed; the cookie is cleared.
        mockMvc.perform(post("/api/auth/refresh").header("X-Requested-With", "subtracker").cookie(first))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("Set-Cookie", containsString("Max-Age=0")));

        mockMvc.perform(post("/api/auth/refresh").header("X-Requested-With", "subtracker").cookie(second))
                .andExpect(status().isOk());
    }

    @Test
    void refreshRequiresCookieAndCustomHeader() throws Exception {
        mockMvc.perform(post("/api/auth/refresh").header("X-Requested-With", "subtracker"))
                .andExpect(status().isUnauthorized());

        String email = uniqueEmail();
        register(email);
        Cookie cookie = refreshCookie(login(email, PASSWORD));
        mockMvc.perform(post("/api/auth/refresh").cookie(cookie)).andExpect(status().isBadRequest());
    }

    @Test
    void logoutRevokesTheRefreshToken() throws Exception {
        String email = uniqueEmail();
        register(email);
        Cookie cookie = refreshCookie(login(email, PASSWORD));

        mockMvc.perform(post("/api/auth/logout").header("X-Requested-With", "subtracker").cookie(cookie))
                .andExpect(status().isNoContent())
                .andExpect(header().string("Set-Cookie", containsString("Max-Age=0")));

        mockMvc.perform(post("/api/auth/refresh").header("X-Requested-With", "subtracker").cookie(cookie))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void changingThePasswordSignsOtherSessionsOut() throws Exception {
        String email = uniqueEmail();
        String access = JsonPath.read(register(email), "$.accessToken");
        Cookie otherDevice = refreshCookie(login(email, PASSWORD));

        MvcResult change = mockMvc.perform(json(put("/api/users/me/password"), access, """
                        {"currentPassword":"%s","newPassword":"another-password"}
                        """.formatted(PASSWORD)))
                .andExpect(status().isNoContent())
                .andReturn();

        mockMvc.perform(post("/api/auth/refresh").header("X-Requested-With", "subtracker").cookie(otherDevice))
                .andExpect(status().isUnauthorized());
        // The device that changed the password stays signed in.
        mockMvc.perform(post("/api/auth/refresh").header("X-Requested-With", "subtracker")
                        .cookie(refreshCookie(change)))
                .andExpect(status().isOk());
    }

    // --- Reminder settings --------------------------------------------------------------------------------

    @Test
    void reminderSettingsCanBeUpdatedIndependentlyOfTheName() throws Exception {
        String token = registerAndGetToken();

        mockMvc.perform(authorized(get("/api/users/me"), token))
                .andExpect(jsonPath("$.remindersEnabled").value(true))
                .andExpect(jsonPath("$.reminderDays").value(3));

        mockMvc.perform(json(put("/api/users/me"), token, "{\"remindersEnabled\":false,\"reminderDays\":7}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.remindersEnabled").value(false))
                .andExpect(jsonPath("$.reminderDays").value(7))
                .andExpect(jsonPath("$.name").value("Test User"));

        mockMvc.perform(authorized(get("/api/users/me"), token))
                .andExpect(jsonPath("$.preferredCurrency").value("TRY"));
        mockMvc.perform(json(put("/api/users/me"), token, "{\"preferredCurrency\":\"usd\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.preferredCurrency").value("USD"))
                .andExpect(jsonPath("$.reminderDays").value(7));
        mockMvc.perform(json(put("/api/users/me"), token, "{\"preferredCurrency\":\"DOLLAR\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.preferredCurrency").exists());

        mockMvc.perform(json(put("/api/users/me"), token, "{\"reminderDays\":30}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.reminderDays").exists());
        mockMvc.perform(json(put("/api/users/me"), token, "{\"name\":\"   \"}"))
                .andExpect(status().isBadRequest());
    }
}
