package com.subscriptiontracker.backend.service;

import com.subscriptiontracker.backend.config.AuthProperties;
import com.subscriptiontracker.backend.dto.AuthResponse;
import com.subscriptiontracker.backend.dto.LoginRequest;
import com.subscriptiontracker.backend.dto.RegisterRequest;
import com.subscriptiontracker.backend.dto.UserResponse;
import com.subscriptiontracker.backend.entity.User;
import com.subscriptiontracker.backend.enums.TokenType;
import com.subscriptiontracker.backend.exception.ConflictException;
import com.subscriptiontracker.backend.exception.InvalidCredentialsException;
import com.subscriptiontracker.backend.repository.UserRepository;
import com.subscriptiontracker.backend.security.TokenService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class AuthService {

    /** What a successful authentication produces: the JSON body plus the refresh token for the cookie. */
    public record Session(AuthResponse body, String refreshToken) {
    }

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;
    private final UserTokenService userTokens;
    private final AccountMailer mailer;
    private final AuthProperties authProperties;

    /** Compared against when the email is unknown, so failed logins take the same time either way. */
    private final String dummyPasswordHash;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, TokenService tokenService,
                       UserTokenService userTokens, AccountMailer mailer, AuthProperties authProperties) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
        this.userTokens = userTokens;
        this.mailer = mailer;
        this.authProperties = authProperties;
        this.dummyPasswordHash = passwordEncoder.encode("dummy-password-for-timing");
    }

    @Transactional
    public Session register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("An account with this email already exists");
        }

        User user = new User();
        user.setEmail(email);
        user.setName(request.name().trim());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        try {
            user = userRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException e) {
            throw new ConflictException("An account with this email already exists");
        }
        sendVerification(user);
        return session(user);
    }

    @Transactional
    public Session login(LoginRequest request) {
        User user = userRepository.findByEmail(normalizeEmail(request.email())).orElse(null);
        String hash = user != null ? user.getPasswordHash() : dummyPasswordHash;
        boolean matches = passwordEncoder.matches(request.password(), hash);
        if (user == null || !matches) {
            throw new InvalidCredentialsException("Invalid email or password");
        }
        return session(user);
    }

    /** Trades a valid refresh token for a new access token and a new (rotated) refresh token. */
    @Transactional
    public Session refresh(String refreshToken) {
        var token = userTokens.consume(refreshToken, TokenType.REFRESH)
                .orElseThrow(() -> new InvalidCredentialsException("Session expired, please sign in again"));
        User user = userRepository.findById(token.getUserId())
                .orElseThrow(() -> new InvalidCredentialsException("Session expired, please sign in again"));
        return session(user);
    }

    /** Ends the session the refresh token belongs to. Unknown tokens are ignored. */
    @Transactional
    public void logout(String refreshToken) {
        userTokens.consume(refreshToken, TokenType.REFRESH);
    }

    /** Signs every other device out and returns a fresh refresh token for the caller. */
    @Transactional
    public String replaceSessions(Long userId) {
        userTokens.revokeAll(userId, TokenType.REFRESH);
        return userTokens.issue(userId, TokenType.REFRESH, authProperties.refreshExpiration());
    }

    /** Always succeeds, so the response does not reveal whether an address is registered. */
    @Transactional
    public void forgotPassword(String email) {
        userRepository.findByEmail(normalizeEmail(email)).ifPresent(user -> {
            userTokens.revokeAll(user.getId(), TokenType.PASSWORD_RESET);
            String token = userTokens.issue(user.getId(), TokenType.PASSWORD_RESET, authProperties.resetExpiration());
            mailer.sendPasswordReset(user, token);
        });
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        var used = userTokens.consume(token, TokenType.PASSWORD_RESET)
                .orElseThrow(() -> new IllegalArgumentException("This link is invalid or has expired"));
        // Bulk updates clear the persistence context, so do them before touching the entity.
        userTokens.revokeAll(used.getUserId(), TokenType.REFRESH);
        User user = userRepository.findById(used.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("This link is invalid or has expired"));
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        // Receiving the reset e-mail proves the address belongs to the user.
        user.setEmailVerified(true);
    }

    @Transactional
    public void verifyEmail(String token) {
        var used = userTokens.consume(token, TokenType.EMAIL_VERIFICATION)
                .orElseThrow(() -> new IllegalArgumentException("This link is invalid or has expired"));
        User user = userRepository.findById(used.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("This link is invalid or has expired"));
        user.setEmailVerified(true);
    }

    @Transactional
    public void resendVerification(User user) {
        if (user.isEmailVerified()) {
            return;
        }
        userTokens.revokeAll(user.getId(), TokenType.EMAIL_VERIFICATION);
        sendVerification(user);
    }

    private void sendVerification(User user) {
        String token = userTokens.issue(user.getId(), TokenType.EMAIL_VERIFICATION, authProperties.verifyExpiration());
        mailer.sendVerification(user, token);
    }

    private Session session(User user) {
        String refreshToken = userTokens.issue(user.getId(), TokenType.REFRESH, authProperties.refreshExpiration());
        AuthResponse body = AuthResponse.bearer(
                tokenService.createToken(user), tokenService.expiresInSeconds(), UserResponse.from(user));
        return new Session(body, refreshToken);
    }

    static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
