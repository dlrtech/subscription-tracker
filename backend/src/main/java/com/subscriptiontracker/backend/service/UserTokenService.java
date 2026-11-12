package com.subscriptiontracker.backend.service;

import com.subscriptiontracker.backend.entity.UserToken;
import com.subscriptiontracker.backend.enums.TokenType;
import com.subscriptiontracker.backend.repository.UserTokenRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;

/** Issues and consumes single-use random tokens; the database only ever sees their hashes. */
@Service
public class UserTokenService {

    private final UserTokenRepository repository;
    private final Clock clock;
    private final SecureRandom random = new SecureRandom();

    public UserTokenService(UserTokenRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    /** Creates a token and returns its secret value (shown to the user once, never stored). */
    @Transactional
    public String issue(Long userId, TokenType type, Duration lifetime) {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        Instant now = clock.instant();
        repository.save(new UserToken(userId, type, hash(raw), now.plus(lifetime), now));
        return raw;
    }

    /** Uses the token up. Returns it only if it exists, matches the type, is unexpired and was unused. */
    @Transactional
    public Optional<UserToken> consume(String raw, TokenType type) {
        if (raw == null || raw.isBlank()) {
            return Optional.empty();
        }
        Instant now = clock.instant();
        return repository.findByTokenHashAndType(hash(raw), type)
                .filter(token -> token.getUsedAt() == null && token.getExpiresAt().isAfter(now))
                .filter(token -> repository.markUsed(token.getId(), now) == 1);
    }

    @Transactional
    public void revokeAll(Long userId, TokenType type) {
        repository.revokeAll(userId, type, clock.instant());
    }

    @Scheduled(cron = "${app.tokens.cleanup-cron:0 30 3 * * *}")
    @Transactional
    public void purgeExpired() {
        repository.deleteExpiredBefore(clock.instant().minus(Duration.ofDays(1)));
    }

    private static String hash(String raw) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
