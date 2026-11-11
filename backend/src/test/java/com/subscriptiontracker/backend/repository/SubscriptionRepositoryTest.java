package com.subscriptiontracker.backend.repository;

import com.subscriptiontracker.backend.entity.Subscription;
import com.subscriptiontracker.backend.entity.User;
import com.subscriptiontracker.backend.enums.BillingPeriod;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class SubscriptionRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    private User saveUser(String name) {
        User user = new User();
        user.setName(name);
        return userRepository.save(user);
    }

    private void saveSubscription(User user, String name, boolean active) {
        Subscription s = new Subscription();
        s.setUser(user);
        s.setName(name);
        s.setPrice(BigDecimal.TEN);
        s.setBillingPeriod(BillingPeriod.MONTHLY);
        s.setActive(active);
        subscriptionRepository.save(s);
    }

    @Test
    void findsOnlyTheGivenUsersSubscriptions() {
        User alice = saveUser("Alice");
        User bob = saveUser("Bob");
        saveSubscription(alice, "Netflix", true);
        saveSubscription(alice, "Spotify", false);
        saveSubscription(bob, "iCloud", true);

        assertThat(subscriptionRepository.findByUserId(alice.getId()))
                .extracting(Subscription::getName)
                .containsExactlyInAnyOrder("Netflix", "Spotify");

        assertThat(subscriptionRepository.findByUserIdAndActiveTrue(alice.getId()))
                .extracting(Subscription::getName)
                .containsExactly("Netflix");
    }
}
