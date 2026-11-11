package com.subscriptiontracker.backend.controller;

import com.subscriptiontracker.backend.dto.UserRequest;
import com.subscriptiontracker.backend.dto.UserResponse;
import com.subscriptiontracker.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse createUser(@Valid @RequestBody UserRequest request) {
        return UserResponse.from(userService.createUser(request));
    }

    @GetMapping("/{id}")
    public UserResponse getUserById(@PathVariable Long id) {
        return UserResponse.from(userService.getUserById(id));
    }

    @PutMapping("/{id}/name")
    public UserResponse updateUserName(@PathVariable Long id, @Valid @RequestBody UserRequest request) {
        return UserResponse.from(userService.updateUserName(id, request));
    }
}
