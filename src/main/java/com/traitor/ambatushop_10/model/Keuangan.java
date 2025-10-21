package com.traitor.ambatushop_10.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "keuangan")
@Getter @Setter
public class Keuangan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idKeuangan;

    // 0 = Cash, 1 = QRIS
    @Column(nullable = false)
    private Boolean jenis;

    @Column(nullable = false)
    private String keterangan;

    @Column(nullable = false)
    private Long nominal;

    @Column(nullable = false)
    private LocalDateTime tanggal;

    // Relasi ke model akun
    @ManyToOne
    @JoinColumn(name = "id_pegawai", nullable = false)
    private Akun akun;

}