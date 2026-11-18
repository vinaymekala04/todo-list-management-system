package com.todoapp.service;

import com.todoapp.dto.DashboardSummary;
import com.todoapp.entity.TaskStatus;
import com.todoapp.entity.User;
import com.todoapp.repository.TaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
public class DashboardService {

    private final TaskRepository taskRepository;
    private final AuthService authService;

    public DashboardService(TaskRepository taskRepository, AuthService authService) {
        this.taskRepository = taskRepository;
        this.authService = authService;
    }

    @Transactional(readOnly = true)
    public DashboardSummary getSummary() {
        User user = authService.getCurrentUser();
        long total = taskRepository.countByUser(user);
        long completed = taskRepository.countByUserAndStatus(user, TaskStatus.COMPLETED);
        long pending = taskRepository.countByUserAndStatus(user, TaskStatus.TODO);
        long inProgress = taskRepository.countByUserAndStatus(user, TaskStatus.IN_PROGRESS);
        long overdue = taskRepository
                .findByUserAndDueDateBeforeAndStatusNot(user, LocalDate.now(), TaskStatus.COMPLETED)
                .size();
        return new DashboardSummary(total, completed, pending, inProgress, overdue);
    }
}
