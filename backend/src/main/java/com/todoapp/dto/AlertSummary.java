package com.todoapp.dto;

import java.util.List;

/**
 * In-app alert summary for the logged-in user (GET /api/alerts/summary).
 * Only non-COMPLETED tasks are included: overdue (dueDate &lt; today),
 * due today (dueDate == today) and due tomorrow (dueDate == tomorrow).
 */
public class AlertSummary {

    private long overdueCount;
    private long dueTodayCount;
    private long dueTomorrowCount;
    private List<TaskResponse> overdueTasks;
    private List<TaskResponse> dueTodayTasks;
    private List<TaskResponse> dueTomorrowTasks;

    public AlertSummary() {
    }

    public AlertSummary(List<TaskResponse> overdueTasks, List<TaskResponse> dueTodayTasks,
                        List<TaskResponse> dueTomorrowTasks) {
        this.overdueTasks = overdueTasks;
        this.dueTodayTasks = dueTodayTasks;
        this.dueTomorrowTasks = dueTomorrowTasks;
        this.overdueCount = overdueTasks != null ? overdueTasks.size() : 0;
        this.dueTodayCount = dueTodayTasks != null ? dueTodayTasks.size() : 0;
        this.dueTomorrowCount = dueTomorrowTasks != null ? dueTomorrowTasks.size() : 0;
    }

    public long getOverdueCount() {
        return overdueCount;
    }

    public void setOverdueCount(long overdueCount) {
        this.overdueCount = overdueCount;
    }

    public long getDueTodayCount() {
        return dueTodayCount;
    }

    public void setDueTodayCount(long dueTodayCount) {
        this.dueTodayCount = dueTodayCount;
    }

    public long getDueTomorrowCount() {
        return dueTomorrowCount;
    }

    public void setDueTomorrowCount(long dueTomorrowCount) {
        this.dueTomorrowCount = dueTomorrowCount;
    }

    public List<TaskResponse> getOverdueTasks() {
        return overdueTasks;
    }

    public void setOverdueTasks(List<TaskResponse> overdueTasks) {
        this.overdueTasks = overdueTasks;
    }

    public List<TaskResponse> getDueTodayTasks() {
        return dueTodayTasks;
    }

    public void setDueTodayTasks(List<TaskResponse> dueTodayTasks) {
        this.dueTodayTasks = dueTodayTasks;
    }

    public List<TaskResponse> getDueTomorrowTasks() {
        return dueTomorrowTasks;
    }

    public void setDueTomorrowTasks(List<TaskResponse> dueTomorrowTasks) {
        this.dueTomorrowTasks = dueTomorrowTasks;
    }
}
