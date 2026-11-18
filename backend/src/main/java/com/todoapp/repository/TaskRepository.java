package com.todoapp.repository;

import com.todoapp.entity.Task;
import com.todoapp.entity.TaskPriority;
import com.todoapp.entity.TaskStatus;
import com.todoapp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long>, JpaSpecificationExecutor<Task> {

    /** All tasks of a user, newest first. */
    List<Task> findByUserOrderByCreatedAtDesc(User user);

    /** A single task only if it belongs to the given user (ownership check). */
    Optional<Task> findByIdAndUser(Long id, User user);

    List<Task> findByUserAndStatus(User user, TaskStatus status);

    List<Task> findByUserAndPriority(User user, TaskPriority priority);

    List<Task> findByUserAndStatusAndPriority(User user, TaskStatus status, TaskPriority priority);

    /** Search by title, case-insensitive, scoped to the user. */
    List<Task> findByUserAndTitleContainingIgnoreCase(User user, String title);

    List<Task> findByUserAndDueDate(User user, LocalDate dueDate);

    /** Overdue = due before today and not completed. */
    List<Task> findByUserAndDueDateBeforeAndStatusNot(User user, LocalDate date, TaskStatus status);

    long countByUser(User user);

    long countByUserAndStatus(User user, TaskStatus status);
}
