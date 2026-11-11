package com.subscriptiontracker.backend.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.subscriptiontracker.backend.dto.ChangePasswordRequest;
import com.subscriptiontracker.backend.dto.UpdateProfileRequest;
import com.subscriptiontracker.backend.entity.User;
import com.subscriptiontracker.backend.exception.InvalidCredentialsException;
import com.subscriptiontracker.backend.exception.ResourceNotFoundException;
import com.subscriptiontracker.backend.repository.SubscriptionRepository;
import com.subscriptiontracker.backend.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, SubscriptionRepository subscriptionRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @Transactional
    public User updateProfile(Long id, UpdateProfileRequest request) {
        User user = getUserById(id);
        user.setName(request.name().trim());
        return user;
    }

    @Transactional
    public void changePassword(Long id, ChangePasswordRequest request) {
        User user = getUserById(id);
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Current password is incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
    }

    @Transactional
    public void deleteAccount(Long id) {
        User user = getUserById(id);
        subscriptionRepository.deleteAllByUserId(id);
        userRepository.delete(user);
    }
}
