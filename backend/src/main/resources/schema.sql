-- ============================================================
-- Todo List Management System - MySQL schema
-- Run manually if you prefer explicit DDL over ddl-auto=update:
--   mysql -u root -p < schema.sql
-- (spring.jpa.hibernate.ddl-auto=update creates these tables
--  automatically, so this file is NOT executed by default.)
-- ============================================================

CREATE DATABASE IF NOT EXISTS todo_db
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE todo_db;

CREATE TABLE IF NOT EXISTS users (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(150) NOT NULL,
    password   VARCHAR(255) NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_email (email)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS tasks (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    title       VARCHAR(200) NOT NULL,
    description TEXT         NULL,
    due_date    DATE         NULL,
    priority    VARCHAR(20)  NOT NULL DEFAULT 'MEDIUM',
    status      VARCHAR(30)  NOT NULL DEFAULT 'TODO',
    user_id     BIGINT       NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_tasks_user_id (user_id),
    KEY idx_tasks_status (status),
    KEY idx_tasks_priority (priority),
    KEY idx_tasks_due_date (due_date),
    CONSTRAINT fk_tasks_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
) ENGINE = InnoDB;

-- Priority values: HIGH, MEDIUM, LOW
-- Status values:   TODO, IN_PROGRESS, COMPLETED
