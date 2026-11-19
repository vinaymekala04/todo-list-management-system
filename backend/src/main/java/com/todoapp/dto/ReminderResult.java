package com.todoapp.dto;

/**
 * Result of a reminder run (POST /api/alerts/send-reminders).
 * {@code sent} / {@code failed} count reminder emails, not tasks:
 * one email groups all of a user's due-tomorrow, due-today and overdue
 * tasks, so a manual trigger for one user sends at most one email.
 */
public class ReminderResult {

    private int sent;
    private int failed;
    private String message;

    public ReminderResult() {
    }

    public ReminderResult(int sent, int failed, String message) {
        this.sent = sent;
        this.failed = failed;
        this.message = message;
    }

    public int getSent() {
        return sent;
    }

    public void setSent(int sent) {
        this.sent = sent;
    }

    public int getFailed() {
        return failed;
    }

    public void setFailed(int failed) {
        this.failed = failed;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
