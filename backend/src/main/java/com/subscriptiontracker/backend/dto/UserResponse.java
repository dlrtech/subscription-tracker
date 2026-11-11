package com.subscriptiontracker.backend.dto;

import com.subscriptiontracker.backend.entity.User;

public record UserResponse(Long id, String name) {

    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getName());
    }
}
