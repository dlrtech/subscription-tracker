package com.subscriptiontracker.backend;

import com.subscriptiontracker.backend.entity.Subscription;
import com.subscriptiontracker.backend.entity.User;
import com.subscriptiontracker.backend.enums.BillingPeriod;
import com.subscriptiontracker.backend.enums.Category;
import com.subscriptiontracker.backend.repository.SubscriptionRepository;
import com.subscriptiontracker.backend.repository.UserRepository;
import com.subscriptiontracker.backend.service.MailService;
import com.subscriptiontracker.backend.service.ReminderService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@SpringBootTest
class ReminderServiceTest {

    private static final LocalDate TODAY = LocalDate.now();

    @Autowired
    private ReminderService reminderService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private SubscriptionRepository subscriptionRepository;
    @MockitoBean
    private MailService mailService;

    private User user(boolean verified, boolean reminders, int days) {
        User user = new User();
        user.setEmail(UUID.randomUUID() + "@example.com");
        user.setName("Test");
        user.setPasswordHash("{noop}x");
        user.setEmailVerified(verified);
        user.setRemindersEnabled(reminders);
        user.setReminderDays(days);
        return userRepository.save(user);
    }

    private Subscription subscription(User user, String name, LocalDate next, boolean active) {
        Subscription s = new Subscription();
        s.setUser(user);
        s.setName(name);
        s.setPrice(new BigDecimal("59.99"));
        s.setCurrency("TRY");
        s.setBillingPeriod(BillingPeriod.MONTHLY);
        s.setCategory(Category.MUSIC);
        s.setNextBillingDate(next);
        s.setBillingAnchorDate(next);
        s.setActive(active);
        return subscriptionRepository.save(s);
    }

    @Test
    void sendsOneMailWithAllPaymentsDueWithinTheUsersWindowAndOnlyOnce() throws Exception {
        User user = user(true, true, 3);
        Subscription soon = subscription(user, "Spotify-" + user.getId(), TODAY.plusDays(2), true);
        Subscription far = subscription(user, "Netflix-" + user.getId(), TODAY.plusDays(10), true);
        Subscription paused = subscription(user, "Paused-" + user.getId(), TODAY.plusDays(1), false);
        when(mailService.send(eq(user.getEmail()), anyString(), anyString())).thenReturn(true);

        reminderService.sendDueReminders();

        verify(mailService, times(1)).send(eq(user.getEmail()), anyString(), contains(soon.getName()));
        assertThat(subscriptionRepository.findById(soon.getId()).orElseThrow().getLastRemindedFor())
                .isEqualTo(TODAY.plusDays(2));
        assertThat(subscriptionRepository.findById(far.getId()).orElseThrow().getLastRemindedFor()).isNull();
        assertThat(subscriptionRepository.findById(paused.getId()).orElseThrow().getLastRemindedFor()).isNull();

        // A second run the same day must not send the same reminder again.
        reminderService.sendDueReminders();
        verify(mailService, times(1)).send(eq(user.getEmail()), anyString(), anyString());
    }

    @Test
    void skipsUnverifiedUsersAndUsersWhoTurnedRemindersOff() throws Exception {
        User unverified = user(false, true, 3);
        User optedOut = user(true, false, 3);
        subscription(unverified, "A", TODAY.plusDays(1), true);
        subscription(optedOut, "B", TODAY.plusDays(1), true);

        reminderService.sendDueReminders();

        verify(mailService, never()).send(eq(unverified.getEmail()), anyString(), anyString());
        verify(mailService, never()).send(eq(optedOut.getEmail()), anyString(), anyString());
    }

    @Test
    void retriesTomorrowWhenDeliveryFails() throws Exception {
        User user = user(true, true, 3);
        Subscription sub = subscription(user, "Retry-" + user.getId(), TODAY.plusDays(1), true);
        when(mailService.send(eq(user.getEmail()), anyString(), anyString())).thenReturn(false);

        reminderService.sendDueReminders();

        assertThat(subscriptionRepository.findById(sub.getId()).orElseThrow().getLastRemindedFor()).isNull();
    }
}
