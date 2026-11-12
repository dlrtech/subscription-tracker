package com.subscriptiontracker.backend.repository;

import com.subscriptiontracker.backend.entity.UserToken;
import com.subscriptiontracker.backend.enums.TokenType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.Optional;

public interface UserTokenRepository extends JpaRepository<UserToken, Long> {

    Optional<UserToken> findByTokenHashAndType(String tokenHash, TokenType type);

    /** Marks a token used; returns 0 if somebody else already used it (makes consumption atomic). */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update UserToken t set t.usedAt = :now where t.id = :id and t.usedAt is null")
    int markUsed(Long id, Instant now);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update UserToken t set t.usedAt = :now where t.userId = :userId and t.type = :type and t.usedAt is null")
    int revokeAll(Long userId, TokenType type, Instant now);

    @Modifying
    @Query("delete from UserToken t where t.expiresAt < :cutoff")
    int deleteExpiredBefore(Instant cutoff);
}
