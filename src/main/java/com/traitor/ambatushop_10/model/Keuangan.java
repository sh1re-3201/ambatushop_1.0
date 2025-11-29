package com.traitor.ambatushop_10.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "keuangan")
@Getter @Setter
@NoArgsConstructor
public class Keuangan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
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
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_pegawai", referencedColumnName = "id_pegawai", nullable = false)
    private Akun akun;

    public Keuangan(Boolean jenis, String keterangan, Long nominal, LocalDateTime tanggal, Akun akun) {
        this.akun = akun;
        this.jenis = jenis;
        this.keterangan = keterangan;
        this.nominal = nominal;
        this.tanggal = tanggal;
    }
}