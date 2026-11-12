package com.subscriptiontracker.backend.controller;

import com.subscriptiontracker.backend.dto.ChangePasswordRequest;
import com.subscriptiontracker.backend.dto.UpdateProfileRequest;
import com.subscriptiontracker.backend.dto.UserResponse;
import com.subscriptiontracker.backend.security.RefreshCookies;
import com.subscriptiontracker.backend.service.AuthService;
import com.subscriptiontracker.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import static com.subscriptiontracker.backend.security.TokenService.userId;

@RestController
@RequestMapping("/api/users/me")
public class UserController {

    private final UserService userService;
    private final AuthService authService;
    private final RefreshCookies cookies;

    public UserController(UserService userService, AuthService authService, RefreshCookies cookies) {
        this.userService = userService;
        this.authService = authService;
        this.cookies = cookies;
    }

    @GetMapping
    public UserResponse me(@AuthenticationPrincipal Jwt jwt) {
        return UserResponse.from(userService.getUserById(userId(jwt)));
    }

    @PutMapping
    public UserResponse updateProfile(@AuthenticationPrincipal Jwt jwt,
                                      @Valid @RequestBody UpdateProfileRequest request) {
        return UserResponse.from(userService.updateProfile(userId(jwt), request));
    }

    /** Changes the password and signs all other devices out; this device keeps a fresh session. */
    @PutMapping("/password")
    public ResponseEntity<Void> changePassword(@AuthenticationPrincipal Jwt jwt,
                                               @Valid @RequestBody ChangePasswordRequest request) {
        Long id = userId(jwt);
        userService.changePassword(id, request);
        String refreshToken = authService.replaceSessions(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT)
                .header(HttpHeaders.SET_COOKIE, cookies.create(refreshToken))
                .build();
    }

    @PostMapping("/resend-verification")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resendVerification(@AuthenticationPrincipal Jwt jwt) {
        authService.resendVerification(userService.getUserById(userId(jwt)));
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAccount(@AuthenticationPrincipal Jwt jwt) {
        userService.deleteAccount(userId(jwt));
    }
}
