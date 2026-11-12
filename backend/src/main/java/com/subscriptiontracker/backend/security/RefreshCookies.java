package com.subscriptiontracker.backend.security;

import com.subscriptiontracker.backend.config.AuthProperties;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

/** Builds and reads the HttpOnly cookie carrying the refresh token, so scripts never see it. */
@Component
public class RefreshCookies {

    public static final String NAME = "st_refresh";
    private static final String PATH = "/api/auth";

    private final AuthProperties properties;

    public RefreshCookies(AuthProperties properties) {
        this.properties = properties;
    }

    /** The Set-Cookie header value that stores the token. */
    public String create(String token) {
        return build(token, properties.refreshExpiration());
    }

    /** The Set-Cookie header value that removes the cookie. */
    public String clear() {
        return build("", Duration.ZERO);
    }

    public static String read(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (NAME.equals(cookie.getName()) && !cookie.getValue().isBlank()) {
                return cookie.getValue();
            }
        }
        return null;
    }

    private String build(String value, Duration maxAge) {
        return ResponseCookie.from(NAME, value)
                .httpOnly(true)
                .secure(properties.cookieSecure())
                .sameSite(properties.cookieSameSite())
                .path(PATH)
                .maxAge(maxAge)
                .build()
                .toString();
    }
}
