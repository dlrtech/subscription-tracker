package com.subscriptiontracker.backend.service;

import org.springframework.stereotype.Service;

import com.subscriptiontracker.backend.entity.User;
import com.subscriptiontracker.backend.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User createUser(User user) {

        if (user.getName() == null || user.getName().isBlank()) {
            throw new IllegalArgumentException("User name cannot be empty");
        }

        return userRepository.save(user);
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    public User updateUserName(Long id, String newName) {

        if (newName == null || newName.isBlank()) {
            throw new IllegalArgumentException("User name cannot be empty");
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setName(newName);

        return userRepository.save(user);
    }
}