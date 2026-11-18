package com.todoapp.dto;

import com.todoapp.entity.User;

import java.time.LocalDateTime;

/** Public profile view - never includes the password hash. */
public class ProfileResponse {

    private Long id;
    private String name;
    private String email;
    private LocalDateTime createdAt;

    public ProfileResponse() {
    }

    public static ProfileResponse fromEntity(User user) {
        ProfileResponse dto = new ProfileResponse();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setCreatedAt(user.getCreatedAt());
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
