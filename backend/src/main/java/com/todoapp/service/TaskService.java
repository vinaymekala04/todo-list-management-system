package com.todoapp.service;

import com.todoapp.dto.TaskRequest;
import com.todoapp.dto.TaskResponse;
import com.todoapp.entity.Task;
import com.todoapp.entity.TaskPriority;
import com.todoapp.entity.TaskStatus;
import com.todoapp.entity.User;
import com.todoapp.exception.ResourceNotFoundException;
import com.todoapp.repository.TaskRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
public class TaskService {

    private static final Set<String> SORTABLE_FIELDS =
            Set.of("title", "dueDate", "priority", "status", "createdAt", "updatedAt");

    private final TaskRepository taskRepository;
    private final AuthService authService;

    public TaskService(TaskRepository taskRepository, AuthService authService) {
        this.taskRepository = taskRepository;
        this.authService = authService;
    }

    /**
     * Lists the logged-in user's tasks with optional search / filter / sort.
     * Every predicate is scoped to the current user, so another user's
     * tasks can never leak through this endpoint.
     */
    @Transactional(readOnly = true)
    public List<TaskResponse> getAllTasks(String search, TaskStatus status, TaskPriority priority,
                                          LocalDate dueDate, String sortBy, String sortDir) {
        User user = authService.getCurrentUser();

        Specification<Task> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("user"), user));
            if (search != null && !search.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("title")),
                        "%" + search.trim().toLowerCase() + "%"));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (priority != null) {
                predicates.add(cb.equal(root.get("priority"), priority));
            }
            if (dueDate != null) {
                predicates.add(cb.equal(root.get("dueDate"), dueDate));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        String sortField = (sortBy != null && SORTABLE_FIELDS.contains(sortBy)) ? sortBy : "createdAt";
        Sort sort = "asc".equalsIgnoreCase(sortDir)
                ? Sort.by(sortField).ascending()
                : Sort.by(sortField).descending();

        return taskRepository.findAll(spec, sort).stream()
                .map(TaskResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public TaskResponse getTaskById(Long id) {
        return TaskResponse.fromEntity(findOwnedTask(id));
    }

    @Transactional
    public TaskResponse createTask(TaskRequest request) {
        User user = authService.getCurrentUser();
        Task task = new Task();
        task.setTitle(request.getTitle().trim());
        task.setDescription(request.getDescription());
        task.setDueDate(request.getDueDate());
        task.setPriority(request.getPriority() != null ? request.getPriority() : TaskPriority.MEDIUM);
        task.setStatus(request.getStatus() != null ? request.getStatus() : TaskStatus.TODO);
        task.setUser(user);
        return TaskResponse.fromEntity(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse updateTask(Long id, TaskRequest request) {
        Task task = findOwnedTask(id);
        task.setTitle(request.getTitle().trim());
        task.setDescription(request.getDescription());
        task.setDueDate(request.getDueDate());
        if (request.getPriority() != null) {
            task.setPriority(request.getPriority());
        }
        if (request.getStatus() != null) {
            task.setStatus(request.getStatus());
        }
        return TaskResponse.fromEntity(taskRepository.save(task));
    }

    @Transactional
    public void deleteTask(Long id) {
        taskRepository.delete(findOwnedTask(id));
    }

    @Transactional
    public TaskResponse completeTask(Long id) {
        Task task = findOwnedTask(id);
        task.setStatus(TaskStatus.COMPLETED);
        return TaskResponse.fromEntity(taskRepository.save(task));
    }

    /**
     * Loads a task only if it belongs to the logged-in user.
     * A task owned by someone else looks exactly like a missing task (404),
     * so ownership cannot be probed.
     */
    private Task findOwnedTask(Long id) {
        User user = authService.getCurrentUser();
        return taskRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));
    }
}
