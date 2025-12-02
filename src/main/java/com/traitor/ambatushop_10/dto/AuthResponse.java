package com.traitor.ambatushop_10.dto;

public record AuthResponse(
        String token,
        String role,
        String username,
        Long userId,
        String message) {
}