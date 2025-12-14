package com.traitor.ambatushop_10.controller;

import com.traitor.ambatushop_10.model.Akun;
import com.traitor.ambatushop_10.service.AkunService;
import com.traitor.ambatushop_10.service.UserSessionService;
import com.traitor.ambatushop_10.dto.ErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/manajer")
public class ManajerController {

    private final AkunService akunService;
    private final UserSessionService userSessionService;

    public ManajerController(AkunService akunService, UserSessionService userSessionService) {
        this.akunService = akunService;
        this.userSessionService = userSessionService;
    }

    // GET semua akun untuk Manajer (read-only)
    @GetMapping("/akun")
    @PreAuthorize("hasAnyRole('MANAJER', 'ADMIN')")
    public ResponseEntity<?> getAllAkunForManager() {
        try {
            List<Akun> akunList = akunService.getAllAkun();
            return ResponseEntity.ok(akunList);
        } catch (Exception e) {
            ErrorResponse error = new ErrorResponse(
                    500, "SERVER_ERROR", "Gagal mengambil data akun",
                    e.getMessage(), "/api/manajer/akun");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // GET akun by ID untuk Manajer (read-only)
    @GetMapping("/akun/{id}")
    @PreAuthorize("hasAnyRole('MANAJER', 'ADMIN')")
    public ResponseEntity<?> getAkunByIdForManager(@PathVariable Long id) {
        try {
            Akun akun = akunService.getAkunById(id);
            return ResponseEntity.ok(akun);
        } catch (RuntimeException e) {
            ErrorResponse error = new ErrorResponse(
                    404, "NOT_FOUND", "Akun tidak ditemukan",
                    e.getMessage(), "/api/manajer/akun/" + id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            ErrorResponse error = new ErrorResponse(
                    500, "SERVER_ERROR", "Gagal mengambil data akun",
                    e.getMessage(), "/api/manajer/akun/" + id);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Get user statistics for manager dashboard
     */
    @GetMapping("/users/stats")
    @PreAuthorize("hasAnyRole('MANAJER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getUserStats() {
        Map<String, Object> stats = userSessionService.getUserStats();
        return ResponseEntity.ok(stats);
    }

    /**
     * Get all users with online status (for manager view)
     */
    @GetMapping("/users/all-with-status")
    @PreAuthorize("hasAnyRole('MANAJER', 'ADMIN')")
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
                    userMap.put("sessionId", user.getSessionId());
                    userMap.put("ipAddress", user.getIpAddress());

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

    /**
     * Get combined dashboard data for manager
     */
    @GetMapping("/dashboard/combined")
    @PreAuthorize("hasAnyRole('MANAJER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getCombinedDashboardData() {
        Map<String, Object> response = new HashMap<>();
        
        // Get user stats
        Map<String, Object> stats = userSessionService.getUserStats();
        response.put("stats", stats);
        
        // Get all users with status
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
                userMap.put("initial", user.getUsername().substring(0, 1).toUpperCase());
                return userMap;
            })
            .collect(java.util.stream.Collectors.toList());
        
        response.put("users", usersWithStatus);
        response.put("timestamp", System.currentTimeMillis());
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get users list for manager view (simple version)
     */
    @GetMapping("/users/list")
    @PreAuthorize("hasAnyRole('MANAJER', 'ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getUsersList() {
        List<Akun> allUsers = akunService.getAllAkun();

        List<Map<String, Object>> usersList = allUsers.stream()
                .map(user -> {
                    Map<String, Object> userMap = new HashMap<>();
                    userMap.put("id", user.getIdPegawai());
                    userMap.put("username", user.getUsername());
                    userMap.put("email", user.getEmail());
                    userMap.put("role", user.getRole().name());
                    userMap.put("isOnline", user.isCurrentlyActive());
                    userMap.put("lastActivity", user.getLastActivityAt());

                    // Format display name
                    String displayName = user.getUsername();
                    if (displayName.contains(".")) {
                        displayName = displayName.split("\\.")[0];
                        displayName = displayName.substring(0, 1).toUpperCase() +
                                displayName.substring(1);
                    }
                    userMap.put("displayName", displayName);

                    // Avatar initial
                    String initial = user.getUsername() != null && !user.getUsername().isEmpty()
                            ? user.getUsername().substring(0, 1).toUpperCase()
                            : "U";
                    userMap.put("initial", initial);

                    return userMap;
                })
                .collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(usersList);
    }
}
