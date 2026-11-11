package com.subscriptiontracker.backend.controller;

import com.subscriptiontracker.backend.entity.User;
import com.subscriptiontracker.backend.service.UserService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    public User createUser(@RequestBody User user) {
        return userService.createUser(user);
    }

    @GetMapping("/{id}")
    public User getUserById(@PathVariable Long id) {
        return userService.getUserById(id);
    }

    @PutMapping("/{id}/name")
    public User updateUserName(
            @PathVariable Long id,
            @RequestBody String newName) {

        return userService.updateUserName(id, newName);
    }
}