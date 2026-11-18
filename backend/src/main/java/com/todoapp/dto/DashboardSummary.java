package com.todoapp.dto;

/** Dashboard statistics (spec Module 6). */
public class DashboardSummary {

    private long totalTasks;
    private long completedTasks;
    private long pendingTasks;      // status = TODO
    private long inProgressTasks;   // status = IN_PROGRESS
    private long overdueTasks;      // due before today and not COMPLETED
    private double completionPercentage;

    public DashboardSummary() {
    }

    public DashboardSummary(long totalTasks, long completedTasks, long pendingTasks,
                            long inProgressTasks, long overdueTasks) {
        this.totalTasks = totalTasks;
        this.completedTasks = completedTasks;
        this.pendingTasks = pendingTasks;
        this.inProgressTasks = inProgressTasks;
        this.overdueTasks = overdueTasks;
        this.completionPercentage = totalTasks > 0
                ? Math.round((completedTasks * 100.0 / totalTasks) * 100.0) / 100.0
                : 0.0;
    }

    public long getTotalTasks() {
        return totalTasks;
    }

    public void setTotalTasks(long totalTasks) {
        this.totalTasks = totalTasks;
    }

    public long getCompletedTasks() {
        return completedTasks;
    }

    public void setCompletedTasks(long completedTasks) {
        this.completedTasks = completedTasks;
    }

    public long getPendingTasks() {
        return pendingTasks;
    }

    public void setPendingTasks(long pendingTasks) {
        this.pendingTasks = pendingTasks;
    }

    public long getInProgressTasks() {
        return inProgressTasks;
    }

    public void setInProgressTasks(long inProgressTasks) {
        this.inProgressTasks = inProgressTasks;
    }

    public long getOverdueTasks() {
        return overdueTasks;
    }

    public void setOverdueTasks(long overdueTasks) {
        this.overdueTasks = overdueTasks;
    }

    public double getCompletionPercentage() {
        return completionPercentage;
    }

    public void setCompletionPercentage(double completionPercentage) {
        this.completionPercentage = completionPercentage;
    }
}
