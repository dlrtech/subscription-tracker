package com.subscriptiontracker.backend.service;

import com.subscriptiontracker.backend.entity.Subscription;
import com.subscriptiontracker.backend.enums.BillingPeriod;
import com.subscriptiontracker.backend.repository.SubscriptionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SubscriptionServiceTest {

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @InjectMocks
    private SubscriptionService subscriptionService;

    private static Subscription subscription(String price, BillingPeriod period, boolean active) {
        Subscription s = new Subscription();
        s.setName("Test");
        s.setPrice(new BigDecimal(price));
        s.setBillingPeriod(period);
        s.setActive(active);
        return s;
    }

    @Test
    void monthlyTotal_convertsEveryBillingPeriod() {
        when(subscriptionRepository.findAll()).thenReturn(List.of(
                subscription("100", BillingPeriod.MONTHLY, true),
                subscription("120", BillingPeriod.YEARLY, true),
                subscription("10", BillingPeriod.WEEKLY, true)));

        // 100 + 120/12 + 10*52/12 = 100 + 10.00 + 43.33
        assertThat(subscriptionService.calculateMonthlyTotal()).isEqualByComparingTo("153.33");
    }

    @Test
    void yearlyTotal_convertsEveryBillingPeriod() {
        when(subscriptionRepository.findAll()).thenReturn(List.of(
                subscription("100", BillingPeriod.MONTHLY, true),
                subscription("120", BillingPeriod.YEARLY, true),
                subscription("10", BillingPeriod.WEEKLY, true)));

        // 1200 + 120 + 520
        assertThat(subscriptionService.calculateYearlyTotal()).isEqualByComparingTo("1840");
    }

    @Test
    void totals_ignoreInactiveSubscriptions() {
        when(subscriptionRepository.findAll()).thenReturn(List.of(
                subscription("100", BillingPeriod.MONTHLY, false),
                subscription("50", BillingPeriod.MONTHLY, true)));

        assertThat(subscriptionService.calculateMonthlyTotal()).isEqualByComparingTo("50");
        assertThat(subscriptionService.calculateYearlyTotal()).isEqualByComparingTo("600");
    }

    @Test
    void totals_areZeroWhenNoSubscriptions() {
        when(subscriptionRepository.findAll()).thenReturn(List.of());

        assertThat(subscriptionService.calculateMonthlyTotal()).isEqualByComparingTo("0");
        assertThat(subscriptionService.calculateYearlyTotal()).isEqualByComparingTo("0");
    }

    @Test
    void create_rejectsBlankName() {
        Subscription s = subscription("10", BillingPeriod.MONTHLY, true);
        s.setName(" ");

        assertThatThrownBy(() -> subscriptionService.createSubscription(s))
                .isInstanceOf(IllegalArgumentException.class);
        verify(subscriptionRepository, never()).save(any());
    }

    @Test
    void create_rejectsNonPositivePrice() {
        Subscription s = subscription("0", BillingPeriod.MONTHLY, true);

        assertThatThrownBy(() -> subscriptionService.createSubscription(s))
                .isInstanceOf(IllegalArgumentException.class);
        verify(subscriptionRepository, never()).save(any());
    }
}
