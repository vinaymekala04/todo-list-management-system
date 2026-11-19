package com.todoapp.service;

import com.todoapp.entity.Task;
import com.todoapp.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Sends task reminder emails via Spring Mail (JavaMailSender).
 * If mail is not configured (no host or username in application.properties),
 * sending is skipped with a warning log instead of crashing the app —
 * the in-app alerts (GET /api/alerts/summary) keep working either way.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${app.reminder.from:}")
    private String mailFrom;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /** True when an SMTP host and username are configured. */
    public boolean isConfigured() {
        return mailHost != null && !mailHost.isBlank()
                && mailUsername != null && !mailUsername.isBlank();
    }

    /**
     * Sends one email to {@code user} grouping their due-tomorrow,
     * due-today and overdue tasks. Returns true if the mail was accepted
     * for delivery, false if mail is unconfigured or sending failed.
     * At least one of the three lists must be non-empty.
     */
    public boolean sendReminderEmail(User user, List<Task> overdueTasks,
                                     List<Task> dueTodayTasks, List<Task> dueTomorrowTasks) {
        if (!isConfigured()) {
            log.warn("Mail is not configured (MAIL_HOST / MAIL_USERNAME missing) — "
                    + "skipping reminder email for {}", user.getEmail());
            return false;
        }

        StringBuilder body = new StringBuilder();
        body.append("Hi ").append(user.getName()).append(",\n\n");
        body.append("Here are your tasks that need attention:\n");
        appendSection(body, "Overdue", overdueTasks);
        appendSection(body, "Due today", dueTodayTasks);
        appendSection(body, "Due tomorrow", dueTomorrowTasks);
        body.append("\nOpen your Todo List to review them.\n");

        SimpleMailMessage message = new SimpleMailMessage();
        String from = (mailFrom != null && !mailFrom.isBlank()) ? mailFrom : mailUsername;
        message.setFrom(from);
        message.setTo(user.getEmail());
        message.setSubject("Your tasks due soon — Todo List");
        message.setText(body.toString());

        try {
            mailSender.send(message);
            log.info("Reminder email sent to {}", user.getEmail());
            return true;
        } catch (MailException e) {
            log.error("Failed to send reminder email to {}: {}", user.getEmail(), e.getMessage());
            return false;
        }
    }

    private void appendSection(StringBuilder body, String heading, List<Task> tasks) {
        if (tasks == null || tasks.isEmpty()) {
            return;
        }
        body.append("\n").append(heading).append(":\n");
        for (Task task : tasks) {
            body.append(" - ").append(task.getTitle())
                    .append(" (due ").append(task.getDueDate())
                    .append(", priority ").append(task.getPriority()).append(")\n");
        }
    }
}
