package com.subscriptiontracker.backend.service;

import com.subscriptiontracker.backend.dto.AuthResponse;
import com.subscriptiontracker.backend.dto.LoginRequest;
import com.subscriptiontracker.backend.dto.RegisterRequest;
import com.subscriptiontracker.backend.dto.UserResponse;
import com.subscriptiontracker.backend.entity.User;
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

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    /** Compared against when the email is unknown, so failed logins take the same time either way. */
    private final String dummyPasswordHash;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, TokenService tokenService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
        this.dummyPasswordHash = passwordEncoder.encode("dummy-password-for-timing");
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
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
        return authResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(normalizeEmail(request.email())).orElse(null);
        String hash = user != null ? user.getPasswordHash() : dummyPasswordHash;
        boolean matches = passwordEncoder.matches(request.password(), hash);
        if (user == null || !matches) {
            throw new InvalidCredentialsException("Invalid email or password");
        }
        return authResponse(user);
    }

    private AuthResponse authResponse(User user) {
        return AuthResponse.bearer(tokenService.createToken(user), tokenService.expiresInSeconds(), UserResponse.from(user));
    }

    static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
