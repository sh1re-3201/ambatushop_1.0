package com.traitor.ambatushop_10.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "akses_log")
@Getter @Setter
public class AksesLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idLog;

    @Column(nullable = false)
    private String aktivitas;

    @Column(nullable = false)
    private LocalDateTime waktu;

    // Relasi ke akun
    @ManyToOne
    @JoinColumn(name = "id_pegawai", nullable = false)
    private Akun akun;
}
