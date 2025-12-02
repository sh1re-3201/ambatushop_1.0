package com.traitor.ambatushop_10.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "keuangan")
@Getter @Setter
public class Keuangan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long idKeuangan;

    // PERBAIKAN: Tambahkan ENUM
    @Enumerated(EnumType.STRING)
    @Column(name = "jenis", nullable = false, length = 20)
    private JenisTransaksi jenis;

    @Column(nullable = false)
    private String keterangan;

    // PERBAIKAN: Ubah dari Long ke Double
    @Column(nullable = false)
    private Double nominal;

    @Column(nullable = false)
    private LocalDateTime tanggal;

    @ManyToOne
    @JoinColumn(name = "id_pegawai", nullable = false)
    private Akun akun;

    // PERBAIKAN: Tambahkan ENUM di dalam class
    public enum JenisTransaksi {
        PEMASUKAN,
        PENGELUARAN
    }

    // Constructor kosong (untuk JPA)
    public Keuangan() {}

    // Constructor dengan parameter
    public Keuangan(JenisTransaksi jenis, String keterangan, Double nominal, 
                    LocalDateTime tanggal, Akun akun) {
        this.jenis = jenis;
        this.keterangan = keterangan;
        this.nominal = nominal;
        this.tanggal = tanggal;
        this.akun = akun;
    }
}