package com.subscriptiontracker.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;


@Entity
public class User {
    private String name;

    @Id
    @GeneratedValue
    private Long id;
}