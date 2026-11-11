package com.subscriptiontracker.backend.service;

import com.subscriptiontracker.backend.dto.SubscriptionRequest;
import com.subscriptiontracker.backend.entity.Subscription;
import com.subscriptiontracker.backend.entity.User;
import com.subscriptiontracker.backend.enums.BillingPeriod;
import com.subscriptiontracker.backend.enums.Category;
import com.subscriptiontracker.backend.exception.ResourceNotFoundException;
import com.subscriptiontracker.backend.repository.SubscriptionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SubscriptionServiceTest {

    private static final Long USER_ID = 1L;

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Mock
    private UserService userService;

    @InjectMocks
    private SubscriptionService subscriptionService;

    private static Subscription subscription(String price, BillingPeriod period) {
        Subscription s = new Subscription();
        s.setName("Test");
        s.setPrice(new BigDecimal(price));
        s.setBillingPeriod(period);
        s.setActive(true);
        return s;
    }

    @Test
    void monthlyTotal_convertsEveryBillingPeriod() {
        when(subscriptionRepository.findByUserIdAndActiveTrue(USER_ID)).thenReturn(List.of(
                subscription("100", BillingPeriod.MONTHLY),
                subscription("120", BillingPeriod.YEARLY),
                subscription("10", BillingPeriod.WEEKLY)));

        // 100 + 120/12 + 10*52/12 = 100 + 10.00 + 43.33
        assertThat(subscriptionService.calculateMonthlyTotal(USER_ID)).isEqualByComparingTo("153.33");
    }

    @Test
    void yearlyTotal_convertsEveryBillingPeriod() {
        when(subscriptionRepository.findByUserIdAndActiveTrue(USER_ID)).thenReturn(List.of(
                subscription("100", BillingPeriod.MONTHLY),
                subscription("120", BillingPeriod.YEARLY),
                subscription("10", BillingPeriod.WEEKLY)));

        // 1200 + 120 + 520
        assertThat(subscriptionService.calculateYearlyTotal(USER_ID)).isEqualByComparingTo("1840");
    }

    @Test
    void totals_areZeroWhenNoActiveSubscriptions() {
        when(subscriptionRepository.findByUserIdAndActiveTrue(USER_ID)).thenReturn(List.of());

        assertThat(subscriptionService.calculateMonthlyTotal(USER_ID)).isEqualByComparingTo("0");
        assertThat(subscriptionService.calculateYearlyTotal(USER_ID)).isEqualByComparingTo("0");
    }

    @Test
    void totals_failForUnknownUser() {
        when(userService.getUserById(99L)).thenThrow(new ResourceNotFoundException("User not found"));

        assertThatThrownBy(() -> subscriptionService.calculateMonthlyTotal(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void create_assignsUserAndDefaultsToActive() {
        User user = new User();
        when(userService.getUserById(USER_ID)).thenReturn(user);
        when(subscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SubscriptionRequest request = new SubscriptionRequest(
                "  Netflix ", new BigDecimal("15.99"), BillingPeriod.MONTHLY,
                LocalDate.of(2026, 12, 1), Category.ENTERTAINMENT, null);

        Subscription saved = subscriptionService.createSubscription(USER_ID, request);

        assertThat(saved.getUser()).isSameAs(user);
        assertThat(saved.getName()).isEqualTo("Netflix");
        assertThat(saved.isActive()).isTrue();
        assertThat(saved.getCategory()).isEqualTo(Category.ENTERTAINMENT);
    }

    @Test
    void create_failsForUnknownUser() {
        when(userService.getUserById(99L)).thenThrow(new ResourceNotFoundException("User not found"));

        SubscriptionRequest request = new SubscriptionRequest(
                "Netflix", BigDecimal.TEN, BillingPeriod.MONTHLY, null, null, null);

        assertThatThrownBy(() -> subscriptionService.createSubscription(99L, request))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(subscriptionRepository, never()).save(any());
    }

    @Test
    void update_copiesAllFields() {
        Subscription existing = subscription("10", BillingPeriod.MONTHLY);
        when(subscriptionRepository.findById(5L)).thenReturn(Optional.of(existing));
        when(subscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SubscriptionRequest request = new SubscriptionRequest(
                "Spotify", new BigDecimal("99"), BillingPeriod.YEARLY,
                LocalDate.of(2027, 1, 1), Category.MUSIC, false);

        Subscription updated = subscriptionService.updateSubscription(5L, request);

        assertThat(updated.getName()).isEqualTo("Spotify");
        assertThat(updated.getPrice()).isEqualByComparingTo("99");
        assertThat(updated.getBillingPeriod()).isEqualTo(BillingPeriod.YEARLY);
        assertThat(updated.getNextBillingDate()).isEqualTo(LocalDate.of(2027, 1, 1));
        assertThat(updated.getCategory()).isEqualTo(Category.MUSIC);
        assertThat(updated.isActive()).isFalse();
    }

    @Test
    void getById_throwsNotFound() {
        when(subscriptionRepository.findById(5L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> subscriptionService.getSubscriptionById(5L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void delete_throwsNotFound() {
        when(subscriptionRepository.existsById(5L)).thenReturn(false);

        assertThatThrownBy(() -> subscriptionService.deleteSubscription(5L))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(subscriptionRepository, never()).deleteById(any());
    }
}
