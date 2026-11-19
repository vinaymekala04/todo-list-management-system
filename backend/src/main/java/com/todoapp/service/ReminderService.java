package com.todoapp.service;

import com.todoapp.dto.AlertSummary;
import com.todoapp.dto.ReminderResult;
import com.todoapp.dto.TaskResponse;
import com.todoapp.entity.Task;
import com.todoapp.entity.TaskStatus;
import com.todoapp.entity.User;
import com.todoapp.repository.TaskRepository;
import com.todoapp.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Alert summary (in-app) and email reminders (scheduled + manual trigger).
 *
 * <ul>
 *   <li>Overdue = dueDate before today, due today = dueDate today,
 *       due tomorrow = dueDate tomorrow — all non-COMPLETED only.</li>
 *   <li>The scheduled run fires daily (default 08:00, see
 *       {@code app.reminder.cron}) for every user and sends one grouped
 *       email per user.</li>
 *   <li>A task already reminded today (lastReminderSentAt is today) is
 *       skipped, so an application restart does not duplicate emails.</li>
 * </ul>
 */
@Service
public class ReminderService {

    private static final Logger log = LoggerFactory.getLogger(ReminderService.class);

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final AuthService authService;
    private final EmailService emailService;

    @Value("${app.reminder.enabled:true}")
    private boolean reminderEnabled;

    public ReminderService(TaskRepository taskRepository, UserRepository userRepository,
                           AuthService authService, EmailService emailService) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.authService = authService;
        this.emailService = emailService;
    }

    /** In-app alert summary for the logged-in user (GET /api/alerts/summary). */
    @Transactional(readOnly = true)
    public AlertSummary getAlertSummary() {
        User user = authService.getCurrentUser();
        LocalDate today = LocalDate.now();
        List<TaskResponse> overdue = taskRepository
                .findByUserAndDueDateBeforeAndStatusNot(user, today, TaskStatus.COMPLETED)
                .stream().map(TaskResponse::fromEntity).toList();
        List<TaskResponse> dueToday = taskRepository
                .findByUserAndStatusNotAndDueDate(user, TaskStatus.COMPLETED, today)
                .stream().map(TaskResponse::fromEntity).toList();
        List<TaskResponse> dueTomorrow = taskRepository
                .findByUserAndStatusNotAndDueDate(user, TaskStatus.COMPLETED, today.plusDays(1))
                .stream().map(TaskResponse::fromEntity).toList();
        return new AlertSummary(overdue, dueToday, dueTomorrow);
    }

    /** Manual trigger for the logged-in user (POST /api/alerts/send-reminders). */
    @Transactional
    public ReminderResult sendRemindersForCurrentUser() {
        User user = authService.getCurrentUser();
        return sendRemindersForUser(user);
    }

    /**
     * Daily scheduled run for ALL users (default 08:00, {@code app.reminder.cron}).
     * Skipped entirely when {@code app.reminder.enabled} is false.
     */
    @Scheduled(cron = "${app.reminder.cron:0 0 8 * * *}")
    @Transactional
    public void runDailyReminders() {
        if (!reminderEnabled) {
            log.info("Task reminders are disabled (app.reminder.enabled=false) — skipping scheduled run");
            return;
        }
        int sent = 0;
        int failed = 0;
        int skipped = 0;
        for (User user : userRepository.findAll()) {
            ReminderResult result = sendRemindersForUser(user);
            sent += result.getSent();
            failed += result.getFailed();
            if (result.getSent() == 0 && result.getFailed() == 0) {
                skipped++;
            }
        }
        log.info("Daily reminder run finished: sent={}, failed={}, users with nothing due={}",
                sent, failed, skipped);
    }

    /**
     * Sends one grouped reminder email to a single user for their
     * non-completed tasks due tomorrow, due today, or overdue — excluding
     * tasks already reminded today. Returns the email counts for that user.
     */
    @Transactional
    public ReminderResult sendRemindersForUser(User user) {
        LocalDate today = LocalDate.now();
        List<Task> overdue = notRemindedToday(taskRepository
                .findByUserAndDueDateBeforeAndStatusNot(user, today, TaskStatus.COMPLETED));
        List<Task> dueToday = notRemindedToday(taskRepository
                .findByUserAndStatusNotAndDueDate(user, TaskStatus.COMPLETED, today));
        List<Task> dueTomorrow = notRemindedToday(taskRepository
                .findByUserAndStatusNotAndDueDate(user, TaskStatus.COMPLETED, today.plusDays(1)));

        if (overdue.isEmpty() && dueToday.isEmpty() && dueTomorrow.isEmpty()) {
            return new ReminderResult(0, 0, "No tasks due — nothing to remind " + user.getEmail() + " about.");
        }
        if (!emailService.isConfigured()) {
            log.warn("Mail is not configured (MAIL_HOST / MAIL_USERNAME missing) — "
                    + "skipping reminder email for {}", user.getEmail());
            return new ReminderResult(0, 1,
                    "Mail is not configured. Set MAIL_HOST, MAIL_USERNAME and MAIL_PASSWORD — see README-backend.md.");
        }

        boolean sent = emailService.sendReminderEmail(user, overdue, dueToday, dueTomorrow);
        if (!sent) {
            return new ReminderResult(0, 1, "Failed to send reminder email to " + user.getEmail() + ".");
        }

        // Mark only the tasks that were actually included, so a restart
        // or a second run today does not email about them again.
        LocalDateTime now = LocalDateTime.now();
        for (Task task : overdue) {
            task.setLastReminderSentAt(now);
        }
        for (Task task : dueToday) {
            task.setLastReminderSentAt(now);
        }
        for (Task task : dueTomorrow) {
            task.setLastReminderSentAt(now);
        }
        taskRepository.saveAll(overdue);
        taskRepository.saveAll(dueToday);
        taskRepository.saveAll(dueTomorrow);
        int taskCount = overdue.size() + dueToday.size() + dueTomorrow.size();
        return new ReminderResult(1, 0,
                "Reminder email sent to " + user.getEmail() + " covering " + taskCount + " task(s).");
    }

    /** Drops tasks whose lastReminderSentAt is today (already reminded). */
    private List<Task> notRemindedToday(List<Task> tasks) {
        LocalDate today = LocalDate.now();
        return tasks.stream()
                .filter(task -> task.getLastReminderSentAt() == null
                        || !task.getLastReminderSentAt().toLocalDate().equals(today))
                .toList();
    }
}
