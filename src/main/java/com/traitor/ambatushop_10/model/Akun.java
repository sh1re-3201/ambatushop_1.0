package com.traitor.ambatushop_10.model;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "akun")
@Getter
@Setter
@NoArgsConstructor
public class Akun {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    // @Column(name = "id_pegawai")
    private long idPegawai;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(unique = true, nullable = false)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "role")
    private Role role;

    // NEW FIELDS FOR ONLINE TRACKING
    @Column(name = "is_online", nullable = false)
    private boolean isOnline = false;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(name = "last_activity_at")
    private LocalDateTime lastActivityAt;

    @Column(name = "session_id", length = 100)
    private String sessionId;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    public Akun(String username, String password, String email, Role role) {
        this.username = username;
        this.password = password;
        this.email = email;
        this.role = role;
    }

    public static Akun ref(long id) {
        Akun a = new Akun();
        a.setIdPegawai(id);
        return a;
    }

    public enum Role {
        KASIR,
        MANAJER,
        ADMIN
    }

    // Helper method to mark as online
    public void markAsOnline(String sessionId, String ipAddress) {
        this.isOnline = true;
        this.sessionId = sessionId;
        this.ipAddress = ipAddress;
        this.lastLoginAt = LocalDateTime.now();
        this.lastActivityAt = LocalDateTime.now();
    }

    // Helper method to mark as offline
    public void markAsOffline() {
        this.isOnline = false;
        this.sessionId = null;
        this.lastActivityAt = LocalDateTime.now();
    }

    // Helper method to update activity
    public void updateActivity() {
        this.lastActivityAt = LocalDateTime.now();
    }

    // Check if user is considered "active" (within 5 minutes)
    public boolean isCurrentlyActive() {
        if (!isOnline)
            return false;
        if (lastActivityAt == null)
            return false;

        LocalDateTime fiveMinutesAgo = LocalDateTime.now().minusMinutes(5);
        return lastActivityAt.isAfter(fiveMinutesAgo);
    }
}
