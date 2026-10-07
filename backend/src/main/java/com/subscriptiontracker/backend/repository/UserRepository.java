package com.subscriptiontracker.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.subscriptiontracker.backend.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {

}
