package com.subscriptiontracker.backend.controller;

import com.subscriptiontracker.backend.dto.AuthResponse;
import com.subscriptiontracker.backend.dto.ForgotPasswordRequest;
import com.subscriptiontracker.backend.dto.LoginRequest;
import com.subscriptiontracker.backend.dto.RegisterRequest;
import com.subscriptiontracker.backend.dto.ResetPasswordRequest;
import com.subscriptiontracker.backend.dto.VerifyEmailRequest;
import com.subscriptiontracker.backend.exception.InvalidCredentialsException;
import com.subscriptiontracker.backend.security.RefreshCookies;
import com.subscriptiontracker.backend.service.AuthService;
import com.subscriptiontracker.backend.service.AuthService.Session;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@SecurityRequirements
public class AuthController {

    private final AuthService authService;
    private final RefreshCookies cookies;

    public AuthController(AuthService authService, RefreshCookies cookies) {
        this.authService = authService;
        this.cookies = cookies;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return withSession(HttpStatus.CREATED, authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return withSession(HttpStatus.OK, authService.login(request));
    }

    /**
     * Issues a new access token from the refresh cookie. The custom header forces a CORS preflight, so
     * other websites cannot trigger this call with the user's cookie.
     */
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(HttpServletRequest request,
                                                @RequestHeader(value = "X-Requested-With", required = false) String marker) {
        if (marker == null) {
            throw new IllegalArgumentException("X-Requested-With header is required");
        }
        try {
            return withSession(HttpStatus.OK, authService.refresh(RefreshCookies.read(request)));
        } catch (InvalidCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .header(HttpHeaders.SET_COOKIE, cookies.clear())
                    .body(null);
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request,
                                       @RequestHeader(value = "X-Requested-With", required = false) String marker) {
        if (marker == null) {
            throw new IllegalArgumentException("X-Requested-With header is required");
        }
        authService.logout(RefreshCookies.read(request));
        return ResponseEntity.noContent().header(HttpHeaders.SET_COOKIE, cookies.clear()).build();
    }

    @PostMapping("/forgot-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request.email());
    }

    @PostMapping("/reset-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.token(), request.newPassword());
    }

    @PostMapping("/verify-email")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        authService.verifyEmail(request.token());
    }

    private ResponseEntity<AuthResponse> withSession(HttpStatus status, Session session) {
        return ResponseEntity.status(status)
                .header(HttpHeaders.SET_COOKIE, cookies.create(session.refreshToken()))
                .body(session.body());
    }
}
