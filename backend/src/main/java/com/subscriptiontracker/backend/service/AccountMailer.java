package com.subscriptiontracker.backend.service;

import com.subscriptiontracker.backend.entity.Subscription;
import com.subscriptiontracker.backend.entity.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.Currency;
import java.util.List;
import java.util.Locale;

/** Composes the (Turkish) e-mails the application sends. */
@Component
public class AccountMailer {

    private static final Locale TR = Locale.forLanguageTag("tr-TR");
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("d MMMM", TR);

    private final MailService mailService;
    private final String frontendUrl;

    public AccountMailer(MailService mailService,
                         @Value("${app.frontend-url:http://localhost:5173}") String frontendUrl) {
        this.mailService = mailService;
        this.frontendUrl = frontendUrl.replaceAll("/+$", "");
    }

    public void sendVerification(User user, String token) {
        mailService.sendAsync(user.getEmail(), "subtracker: e-postanı doğrula", """
                Merhaba %s,

                Hesabını doğrulamak için bu bağlantıya tıkla:
                %s/dogrula?token=%s

                Bağlantı 2 gün geçerli. Hesabı sen açmadıysan bu e-postayı yok sayabilirsin.
                """.formatted(user.getName(), frontendUrl, token));
    }

    public void sendPasswordReset(User user, String token) {
        mailService.sendAsync(user.getEmail(), "subtracker: şifre sıfırlama", """
                Merhaba %s,

                Şifreni sıfırlamak için bu bağlantıya tıkla:
                %s/sifre-sifirla?token=%s

                Bağlantı 1 saat geçerli ve tek kullanımlık. Bunu sen istemediysen e-postayı yok sayabilirsin, şifren değişmez.
                """.formatted(user.getName(), frontendUrl, token));
    }

    /** Sends the payment reminder right away; returns whether it was delivered. */
    public boolean sendReminder(User user, List<Subscription> due, LocalDate today) {
        StringBuilder lines = new StringBuilder();
        for (Subscription s : due) {
            lines.append("• %s – %s – %s%n".formatted(s.getName(), money(s), when(s.getNextBillingDate(), today)));
        }
        return mailService.send(user.getEmail(), "subtracker: yaklaşan ödemelerin var", """
                Merhaba %s,

                Yaklaşan ödemelerin:

                %s
                Hatırlatmaları %s/app/profil sayfasından kapatabilir veya gün sayısını değiştirebilirsin.
                """.formatted(user.getName(), lines, frontendUrl));
    }

    private static String when(LocalDate date, LocalDate today) {
        long days = ChronoUnit.DAYS.between(today, date);
        if (days == 0) return "bugün";
        if (days == 1) return "yarın";
        return DATE.format(date);
    }

    private static String money(Subscription s) {
        NumberFormat format = NumberFormat.getCurrencyInstance(TR);
        try {
            format.setCurrency(Currency.getInstance(s.getCurrency()));
        } catch (IllegalArgumentException e) {
            return s.getPrice().toPlainString() + " " + s.getCurrency();
        }
        return format.format(s.getPrice());
    }
}
