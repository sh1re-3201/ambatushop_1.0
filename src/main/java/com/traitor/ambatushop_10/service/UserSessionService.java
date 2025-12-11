package com.traitor.ambatushop_10.service;

import com.traitor.ambatushop_10.model.Akun;
import com.traitor.ambatushop_10.repository.AkunRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@Slf4j
public class UserSessionService {

    private final AkunRepository akunRepository;
    private final Map<String, UserSession> activeSessions = new ConcurrentHashMap<>();

    public UserSessionService(AkunRepository akunRepository) {
        this.akunRepository = akunRepository;
    }

    @Transactional
    public void userLoggedIn(Long userId, String username, HttpServletRequest request) {
        try {
            Akun akun = akunRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String sessionId = UUID.randomUUID().toString();
            String ipAddress = getClientIp(request);

            // Update database
            akun.markAsOnline(sessionId, ipAddress);
            akunRepository.save(akun);

            // Store in memory cache
            UserSession session = new UserSession(
                    userId,
                    username,
                    akun.getRole().name(),
                    sessionId,
                    ipAddress,
                    LocalDateTime.now());
            activeSessions.put(sessionId, session);

            log.info("User {} logged in. Session: {}, IP: {}", username, sessionId, ipAddress);

        } catch (Exception e) {
            log.error("Error tracking user login: {}", e.getMessage(), e);
        }
    }

    // Method baru untuk logout by token (alternatif)
    @Transactional
    public void userLoggedOut(Long userId) {
        try {
            Akun akun = akunRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Update database
            akun.setOnline(false);
            akun.setLastActivityAt(LocalDateTime.now());
            akun.setSessionId(null);
            akunRepository.save(akun);

            // Remove from memory cache
            activeSessions.remove(userId);

            log.info("✅ User {} logged out successfully", akun.getUsername());

        } catch (Exception e) {
            log.error("❌ Error tracking user logout: {}", e.getMessage(), e);
        }
    }

     // Method untuk cek dan cleanup session yang expired
    public void checkAndCleanupExpiredSessions() {
        LocalDateTime fifteenMinutesAgo = LocalDateTime.now().minusMinutes(15);
        
        activeSessions.entrySet().removeIf(entry -> {
            UserSession session = entry.getValue();
            
            if (session.getLastActivity().isBefore(fifteenMinutesAgo)) {
                // Mark as offline in database
                akunRepository.findById(session.getUserId()).ifPresent(akun -> {
                    akun.setOnline(false);
                    akun.setLastActivityAt(LocalDateTime.now());
                    akunRepository.save(akun);
                    log.info("Auto-logout user {} due to inactivity", akun.getUsername());
                });
                return true;
            }
            return false;
        });
    }

    @Transactional
    public void updateUserActivity(Long userId) {
        try {
            Akun akun = akunRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            akun.updateActivity();
            akunRepository.save(akun);

        } catch (Exception e) {
            log.error("Error updating user activity: {}", e.getMessage(), e);
        }
    }

    public List<Akun> getOnlineUsers() {
        return akunRepository.findAll().stream()
                .filter(Akun::isCurrentlyActive)
                .collect(Collectors.toList());
    }

    public Map<String, Object> getUserStats() {
        List<Akun> allUsers = akunRepository.findAll();

        long totalUsers = allUsers.size();
        long onlineUsers = allUsers.stream()
                .filter(Akun::isCurrentlyActive)
                .count();

        long adminCount = allUsers.stream()
                .filter(u -> u.getRole() == Akun.Role.ADMIN)
                .count();
        long managerCount = allUsers.stream()
                .filter(u -> u.getRole() == Akun.Role.MANAJER)
                .count();
        long kasirCount = allUsers.stream()
                .filter(u -> u.getRole() == Akun.Role.KASIR)
                .count();

        Map<String, Object> stats = new java.util.HashMap<>();
        stats.put("totalUsers", totalUsers);
        stats.put("onlineUsers", onlineUsers);
        stats.put("offlineUsers", totalUsers - onlineUsers);
        stats.put("adminCount", adminCount);
        stats.put("managerCount", managerCount);
        stats.put("kasirCount", kasirCount);

        // Add active sessions count by role
        stats.put("activeAdmins", allUsers.stream()
                .filter(u -> u.getRole() == Akun.Role.ADMIN && u.isCurrentlyActive())
                .count());
        stats.put("activeManagers", allUsers.stream()
                .filter(u -> u.getRole() == Akun.Role.MANAJER && u.isCurrentlyActive())
                .count());
        stats.put("activeKasirs", allUsers.stream()
                .filter(u -> u.getRole() == Akun.Role.KASIR && u.isCurrentlyActive())
                .count());

        return stats;
    }

    @Scheduled(fixedRate = 300000) // Run every 5 minutes
    @Transactional
    public void cleanupInactiveUsers() {
        log.info("Cleaning up inactive user sessions...");

        LocalDateTime fifteenMinutesAgo = LocalDateTime.now().minusMinutes(15);

        List<Akun> inactiveUsers = akunRepository.findAll().stream()
                .filter(Akun::isOnline)
                .filter(akun -> akun.getLastActivityAt() != null
                        && akun.getLastActivityAt().isBefore(fifteenMinutesAgo))
                .collect(Collectors.toList());

        for (Akun akun : inactiveUsers) {
            akun.markAsOffline();
            akunRepository.save(akun);

            // Remove from memory cache
            activeSessions.values().removeIf(session -> session.getUserId() == akun.getIdPegawai());

            log.info("Marked user {} as offline due to inactivity", akun.getUsername());
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }

    // Inner class for session tracking
    @Getter
    @Setter
    @AllArgsConstructor
    private static class UserSession {
        private Long userId;
        private String username;
        private String role;
        private String sessionId;
        private String ipAddress;
        private LocalDateTime lastActivity;
    }
}