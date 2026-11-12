package com.subscriptiontracker.backend.service;

import com.subscriptiontracker.backend.entity.Subscription;
import com.subscriptiontracker.backend.entity.User;
import com.subscriptiontracker.backend.repository.SubscriptionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** E-mails users about payments due within their chosen number of days (one e-mail per user and run). */
@Service
public class ReminderService {

    /** Upper bound of {@code User.reminderDays}; used to limit the candidate query. */
    static final int MAX_REMINDER_DAYS = 14;

    private static final Logger log = LoggerFactory.getLogger(ReminderService.class);

    private final SubscriptionRepository subscriptionRepository;
    private final AccountMailer mailer;
    private final Clock clock;

    public ReminderService(SubscriptionRepository subscriptionRepository, AccountMailer mailer, Clock clock) {
        this.subscriptionRepository = subscriptionRepository;
        this.mailer = mailer;
        this.clock = clock;
    }

    @Scheduled(cron = "${app.reminders.cron:0 0 9 * * *}")
    public void sendDailyReminders() {
        int sent = sendDueReminders();
        if (sent > 0) {
            log.info("Sent payment reminders to {} user(s)", sent);
        }
    }

    /** Returns the number of users that were e-mailed. */
    @Transactional
    public int sendDueReminders() {
        LocalDate today = LocalDate.now(clock);
        List<Subscription> candidates =
                subscriptionRepository.findReminderCandidates(today, today.plusDays(MAX_REMINDER_DAYS));

        Map<User, List<Subscription>> byUser = new LinkedHashMap<>();
        for (Subscription s : candidates) {
            User user = s.getUser();
            if (!s.getNextBillingDate().isAfter(today.plusDays(user.getReminderDays()))) {
                byUser.computeIfAbsent(user, u -> new ArrayList<>()).add(s);
            }
        }

        int sent = 0;
        for (Map.Entry<User, List<Subscription>> entry : byUser.entrySet()) {
            if (mailer.sendReminder(entry.getKey(), entry.getValue(), today)) {
                entry.getValue().forEach(s -> s.setLastRemindedFor(s.getNextBillingDate()));
                sent++;
            }
        }
        return sent;
    }
}
