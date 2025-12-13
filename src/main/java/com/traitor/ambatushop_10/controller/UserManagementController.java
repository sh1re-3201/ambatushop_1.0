package com.traitor.ambatushop_10.controller;

import com.traitor.ambatushop_10.model.Akun;
import com.traitor.ambatushop_10.service.AkunService;
import com.traitor.ambatushop_10.service.UserSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class UserManagementController {

    private final AkunService akunService;
    private final UserSessionService userSessionService;

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getUserStats() {
        Map<String, Object> stats = userSessionService.getUserStats();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/online")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Akun>> getOnlineUsers() {
        List<Akun> onlineUsers = userSessionService.getOnlineUsers();
        return ResponseEntity.ok(onlineUsers);
    }

    @GetMapping("/all-with-status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getAllUsersWithStatus() {
        List<Akun> allUsers = akunService.getAllAkun();
        
        List<Map<String, Object>> usersWithStatus = allUsers.stream()
                .map(user -> {
                    Map<String, Object> userMap = new HashMap<>();
                    userMap.put("id", user.getIdPegawai());
                    userMap.put("username", user.getUsername());
                    userMap.put("email", user.getEmail());
                    userMap.put("role", user.getRole().name());
                    userMap.put("isOnline", user.isCurrentlyActive());
                    userMap.put("lastActivity", user.getLastActivityAt());
                    userMap.put("lastLogin", user.getLastLoginAt());
                    
                    // Add avatar initial
                    String initial = user.getUsername() != null && !user.getUsername().isEmpty()
                            ? user.getUsername().substring(0, 1).toUpperCase()
                            : "U";
                    userMap.put("initial", initial);
                    
                    return userMap;
                })
                .collect(java.util.stream.Collectors.toList());
        
        return ResponseEntity.ok(usersWithStatus);
    }

    @GetMapping("/count-by-role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Long>> getCountByRole() {
        List<Akun> allUsers = akunService.getAllAkun();
        
        Map<String, Long> counts = new HashMap<>();
        counts.put("ADMIN", allUsers.stream()
                .filter(u -> u.getRole() == Akun.Role.ADMIN)
                .count());
        counts.put("MANAJER", allUsers.stream()
                .filter(u -> u.getRole() == Akun.Role.MANAJER)
                .count());
        counts.put("KASIR", allUsers.stream()
                .filter(u -> u.getRole() == Akun.Role.KASIR)
                .count());
        
        return ResponseEntity.ok(counts);
    }
}