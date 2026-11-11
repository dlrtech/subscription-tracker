package com.subscriptiontracker.backend.controller;

import com.subscriptiontracker.backend.entity.User;
import com.subscriptiontracker.backend.exception.ResourceNotFoundException;
import com.subscriptiontracker.backend.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserService userService;

    private static User user(String name) {
        User user = new User();
        user.setName(name);
        return user;
    }

    @Test
    void create_returns201() throws Exception {
        when(userService.createUser(any())).thenReturn(user("Dilara"));

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Dilara\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Dilara"));
    }

    @Test
    void create_returns400ForBlankName() throws Exception {
        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"  \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.name").exists());
    }

    @Test
    void updateName_readsJsonBody() throws Exception {
        when(userService.updateUserName(eq(1L), argThat(r -> "Yeni".equals(r.name()))))
                .thenReturn(user("Yeni"));

        mockMvc.perform(put("/api/users/1/name")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Yeni\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Yeni"));
    }

    @Test
    void get_returns404WhenMissing() throws Exception {
        when(userService.getUserById(7L)).thenThrow(new ResourceNotFoundException("User not found"));

        mockMvc.perform(get("/api/users/7"))
                .andExpect(status().isNotFound());
    }
}
