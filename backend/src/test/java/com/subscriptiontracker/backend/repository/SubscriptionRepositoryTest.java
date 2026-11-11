package com.subscriptiontracker.backend.repository;

import com.subscriptiontracker.backend.entity.Subscription;
import com.subscriptiontracker.backend.entity.User;
import com.subscriptiontracker.backend.enums.BillingPeriod;
import com.subscriptiontracker.backend.enums.Category;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class SubscriptionRepositoryTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 11, 11);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    private User saveUser() {
        User user = new User();
        user.setEmail(UUID.randomUUID() + "@example.com");
        user.setName("Test");
        user.setPasswordHash("{noop}x");
        return userRepository.save(user);
    }

    private Subscription save(User user, String name, boolean active, LocalDate next) {
        Subscription s = new Subscription();
        s.setUser(user);
        s.setName(name);
        s.setPrice(BigDecimal.TEN);
        s.setCurrency("TRY");
        s.setBillingPeriod(BillingPeriod.MONTHLY);
        s.setCategory(Category.OTHER);
        s.setNextBillingDate(next);
        s.setBillingAnchorDate(next);
        s.setActive(active);
        return subscriptionRepository.save(s);
    }

    @Test
    void queriesAreScopedToTheUser() {
        User alice = saveUser();
        User bob = saveUser();
        Subscription netflix = save(alice, "Netflix", true, TODAY.plusDays(3));
        save(alice, "Spotify", false, TODAY.plusDays(1));
        Subscription icloud = save(bob, "iCloud", true, TODAY.plusDays(2));

        assertThat(subscriptionRepository.findByUserIdOrderByNextBillingDateAscIdAsc(alice.getId()))
                .extracting(Subscription::getName).containsExactly("Spotify", "Netflix");
        assertThat(subscriptionRepository.findByUserIdAndActiveTrue(alice.getId()))
                .extracting(Subscription::getName).containsExactly("Netflix");
        assertThat(subscriptionRepository.findByIdAndUserId(netflix.getId(), alice.getId())).isPresent();
        assertThat(subscriptionRepository.findByIdAndUserId(icloud.getId(), alice.getId())).isEmpty();
    }

    @Test
    void upcomingQueryUsesInclusiveRangeAndOnlyActive() {
        User user = saveUser();
        save(user, "Today", true, TODAY);
        save(user, "In7", true, TODAY.plusDays(7));
        save(user, "In8", true, TODAY.plusDays(8));
        save(user, "Inactive", false, TODAY.plusDays(1));

        assertThat(subscriptionRepository
                .findByUserIdAndActiveTrueAndNextBillingDateBetweenOrderByNextBillingDateAscIdAsc(
                        user.getId(), TODAY, TODAY.plusDays(7)))
                .extracting(Subscription::getName).containsExactly("Today", "In7");
    }

    @Test
    void deleteAllByUserIdRemovesOnlyThatUsersRows() {
        User alice = saveUser();
        User bob = saveUser();
        save(alice, "A", true, TODAY);
        save(bob, "B", true, TODAY);

        subscriptionRepository.deleteAllByUserId(alice.getId());

        assertThat(subscriptionRepository.findByUserIdAndActiveTrue(alice.getId())).isEmpty();
        assertThat(subscriptionRepository.findByUserIdAndActiveTrue(bob.getId())).hasSize(1);
    }
}
