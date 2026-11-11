package com.subscriptiontracker.backend.service;

import com.subscriptiontracker.backend.dto.SpendingSummaryResponse;
import com.subscriptiontracker.backend.dto.SubscriptionRequest;
import com.subscriptiontracker.backend.entity.Subscription;
import com.subscriptiontracker.backend.entity.User;
import com.subscriptiontracker.backend.enums.BillingPeriod;
import com.subscriptiontracker.backend.enums.Category;
import com.subscriptiontracker.backend.exception.ResourceNotFoundException;
import com.subscriptiontracker.backend.repository.SubscriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SubscriptionServiceTest {

    private static final Long USER_ID = 1L;
    private static final LocalDate TODAY = LocalDate.of(2026, 11, 11);

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Mock
    private UserService userService;

    private SubscriptionService service;

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(TODAY.atStartOfDay().toInstant(ZoneOffset.UTC), ZoneOffset.UTC);
        service = new SubscriptionService(subscriptionRepository, userService, clock, "try");
    }

    private static SubscriptionRequest request(String price, BillingPeriod period, LocalDate next) {
        return new SubscriptionRequest(" Netflix ", new BigDecimal(price), null, period, next, null, null);
    }

    private static Subscription subscription(String price, String currency, BillingPeriod period, Category category) {
        Subscription s = new Subscription();
        s.setName("Test");
        s.setPrice(new BigDecimal(price));
        s.setCurrency(currency);
        s.setBillingPeriod(period);
        s.setCategory(category);
        s.setActive(true);
        return s;
    }

    @Test
    void create_appliesDefaultsAndMovesPastDateForward() {
        User user = new User();
        when(userService.getUserById(USER_ID)).thenReturn(user);
        when(subscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Subscription saved = service.create(USER_ID, request("15.99", BillingPeriod.MONTHLY, LocalDate.of(2026, 10, 20)));

        assertThat(saved.getUser()).isSameAs(user);
        assertThat(saved.getName()).isEqualTo("Netflix");
        assertThat(saved.getCurrency()).isEqualTo("TRY");
        assertThat(saved.getCategory()).isEqualTo(Category.OTHER);
        assertThat(saved.isActive()).isTrue();
        assertThat(saved.getBillingAnchorDate()).isEqualTo(LocalDate.of(2026, 10, 20));
        assertThat(saved.getNextBillingDate()).isEqualTo(LocalDate.of(2026, 11, 20));
    }

    @Test
    void update_keepsAnchorWhenDateIsUnchanged() {
        Subscription existing = subscription("10", "TRY", BillingPeriod.MONTHLY, Category.OTHER);
        existing.setBillingAnchorDate(LocalDate.of(2026, 1, 31));
        existing.setNextBillingDate(LocalDate.of(2026, 11, 30));
        when(subscriptionRepository.findByIdAndUserId(5L, USER_ID)).thenReturn(Optional.of(existing));

        service.update(USER_ID, 5L, new SubscriptionRequest(
                "Netflix", new BigDecimal("12"), "usd", BillingPeriod.MONTHLY,
                LocalDate.of(2026, 11, 30), Category.ENTERTAINMENT, false));

        assertThat(existing.getBillingAnchorDate()).isEqualTo(LocalDate.of(2026, 1, 31));
        assertThat(existing.getCurrency()).isEqualTo("USD");
        assertThat(existing.isActive()).isFalse();
        assertThat(existing.getPrice()).isEqualByComparingTo("12");
    }

    @Test
    void update_resetsAnchorWhenDateChanges() {
        Subscription existing = subscription("10", "TRY", BillingPeriod.MONTHLY, Category.OTHER);
        existing.setBillingAnchorDate(LocalDate.of(2026, 1, 31));
        existing.setNextBillingDate(LocalDate.of(2026, 11, 30));
        when(subscriptionRepository.findByIdAndUserId(5L, USER_ID)).thenReturn(Optional.of(existing));

        service.update(USER_ID, 5L, request("10", BillingPeriod.MONTHLY, LocalDate.of(2026, 12, 15)));

        assertThat(existing.getBillingAnchorDate()).isEqualTo(LocalDate.of(2026, 12, 15));
        assertThat(existing.getNextBillingDate()).isEqualTo(LocalDate.of(2026, 12, 15));
    }

    @Test
    void get_otherUsersSubscriptionIsNotFound() {
        when(subscriptionRepository.findByIdAndUserId(5L, USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.get(USER_ID, 5L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void summary_groupsByCurrencyAndCategory() {
        when(subscriptionRepository.findByUserIdAndActiveTrue(USER_ID)).thenReturn(List.of(
                subscription("100", "TRY", BillingPeriod.MONTHLY, Category.ENTERTAINMENT),
                subscription("120", "TRY", BillingPeriod.YEARLY, Category.ENTERTAINMENT),
                subscription("10", "TRY", BillingPeriod.WEEKLY, Category.SOFTWARE),
                subscription("5", "USD", BillingPeriod.MONTHLY, Category.CLOUD)));

        List<SpendingSummaryResponse> summary = service.summary(USER_ID);

        assertThat(summary).extracting(SpendingSummaryResponse::currency).containsExactly("TRY", "USD");

        SpendingSummaryResponse tr = summary.get(0);
        assertThat(tr.activeSubscriptions()).isEqualTo(3);
        assertThat(tr.monthlyTotal()).isEqualByComparingTo("153.33");
        assertThat(tr.yearlyTotal()).isEqualByComparingTo("1840.00");
        assertThat(tr.monthlyByCategory().get(Category.ENTERTAINMENT)).isEqualByComparingTo("110.00");
        assertThat(tr.monthlyByCategory().get(Category.SOFTWARE)).isEqualByComparingTo("43.33");

        assertThat(summary.get(1).monthlyTotal()).isEqualByComparingTo("5.00");
    }

    @Test
    void summary_isEmptyWithoutActiveSubscriptions() {
        when(subscriptionRepository.findByUserIdAndActiveTrue(USER_ID)).thenReturn(List.of());

        assertThat(service.summary(USER_ID)).isEmpty();
    }

    @Test
    void advanceBillingDates_movesOverdueDatesFromAnchor() {
        Subscription monthEnd = subscription("10", "TRY", BillingPeriod.MONTHLY, Category.OTHER);
        monthEnd.setBillingAnchorDate(LocalDate.of(2026, 1, 31));
        monthEnd.setNextBillingDate(LocalDate.of(2026, 10, 31));
        Subscription weekly = subscription("10", "TRY", BillingPeriod.WEEKLY, Category.OTHER);
        weekly.setBillingAnchorDate(LocalDate.of(2026, 11, 3));
        weekly.setNextBillingDate(LocalDate.of(2026, 11, 3));
        when(subscriptionRepository.findByNextBillingDateBefore(TODAY)).thenReturn(List.of(monthEnd, weekly));

        assertThat(service.advanceBillingDates()).isEqualTo(2);
        assertThat(monthEnd.getNextBillingDate()).isEqualTo(LocalDate.of(2026, 11, 30));
        assertThat(weekly.getNextBillingDate()).isEqualTo(LocalDate.of(2026, 11, 17));
    }
}
