package com.todoapp.controller;

import com.todoapp.dto.AlertSummary;
import com.todoapp.dto.ReminderResult;
import com.todoapp.service.ReminderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Task alerts. Both endpoints require authentication (see SecurityConfig)
 * and are scoped to the logged-in user only.
 */
@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    private final ReminderService reminderService;

    public AlertController(ReminderService reminderService) {
        this.reminderService = reminderService;
    }

    /**
     * GET /api/alerts/summary — in-app alerts: overdue / due-today /
     * due-tomorrow counts and task lists for the logged-in user.
     */
    @GetMapping("/summary")
    public ResponseEntity<AlertSummary> getSummary() {
        return ResponseEntity.ok(reminderService.getAlertSummary());
    }

    /**
     * POST /api/alerts/send-reminders — manually trigger the email
     * reminder run for the logged-in user. Returns
     * { sent, failed, message } where sent/failed count reminder emails.
     */
    @PostMapping("/send-reminders")
    public ResponseEntity<ReminderResult> sendReminders() {
        return ResponseEntity.ok(reminderService.sendRemindersForCurrentUser());
    }
}
