package com.traitor.ambatushop_10.dto;

public class RegisterResponse {
    private String message;
    private String username;
    private String email;
    private String role;
    private String timestamp;

    public RegisterResponse(String message, String username, String email, String role) {
        this.message = message;
        this.username = username;
        this.email = email;
        this.role = role;
        this.timestamp = java.time.LocalDateTime.now().toString();
    }

    // Getters
    public String getMessage() { return message; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
    public String getTimestamp() { return timestamp; }
}