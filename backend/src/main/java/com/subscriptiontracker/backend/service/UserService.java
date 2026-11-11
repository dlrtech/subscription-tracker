package com.subscriptiontracker.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.subscriptiontracker.backend.dto.UserRequest;
import com.subscriptiontracker.backend.entity.User;
import com.subscriptiontracker.backend.exception.ResourceNotFoundException;
import com.subscriptiontracker.backend.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public User createUser(UserRequest request) {
        User user = new User();
        user.setName(request.name().trim());
        return userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @Transactional
    public User updateUserName(Long id, UserRequest request) {
        User user = getUserById(id);
        user.setName(request.name().trim());
        return userRepository.save(user);
    }
}
