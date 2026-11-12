package com.subscriptiontracker.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Sends plain-text e-mail through SMTP ({@code spring.mail.*}). Without an SMTP host (local development)
 * the message is written to the log instead, so links can still be followed.
 */
@Service
public class MailService {

    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    private final JavaMailSender sender;
    private final String from;
    private final ExecutorService executor = Executors.newFixedThreadPool(2, runnable -> {
        Thread thread = new Thread(runnable, "mail-sender");
        thread.setDaemon(true);
        return thread;
    });

    public MailService(ObjectProvider<JavaMailSender> sender,
                       @Value("${spring.mail.host:}") String smtpHost,
                       @Value("${app.mail.from:subtracker <no-reply@localhost>}") String from) {
        // An empty SPRING_MAIL_HOST (common in docker-compose files) still creates a sender bean; ignore it.
        this.sender = smtpHost.isBlank() ? null : sender.getIfAvailable();
        this.from = from;
        if (this.sender == null) {
            log.warn("No SMTP server configured (spring.mail.host); e-mails are only written to the log");
        }
    }

    /** Sends in the background so request latency does not reveal whether an address exists. */
    public void sendAsync(String to, String subject, String body) {
        executor.execute(() -> send(to, subject, body));
    }

    /** Sends immediately; returns false if delivery failed. */
    public boolean send(String to, String subject, String body) {
        if (sender == null) {
            log.info("E-mail (not sent, no SMTP configured) to={} subject=\"{}\"\n{}", to, subject, body);
            return true;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            sender.send(message);
            return true;
        } catch (RuntimeException e) {
            log.error("Could not send e-mail to {}", to, e);
            return false;
        }
    }
}
