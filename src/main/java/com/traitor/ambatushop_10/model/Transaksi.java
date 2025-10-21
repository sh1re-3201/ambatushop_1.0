package com.traitor.ambatushop_10.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.List;

@Entity @Table(name = "transaksi")
@Getter @Setter @NoArgsConstructor
public class Transaksi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    // @Column(name = "id")
    private Long idTransaksi;

    public Transaksi(MetodePembayaran metode_pembayaran, LocalDateTime tanggal, Double total,Akun akun) {
        this.metode_pembayaran = metode_pembayaran;
        this.tanggal = tanggal;
        this.total = total;
    }

    @Column(nullable = false)
    private LocalDateTime tanggal;

    @Column(nullable = false)
    private Double total;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MetodePembayaran metode_pembayaran; // true = tunai, false = QRIS

    @ManyToOne
    @JoinColumn(name = "akun_id", nullable = false) // Sesuai dengan dbnya, dikita itu base columnnya akun_id di db transaksi liquibase
    private Akun akun; // Menggunakan akun agar nanti dipakainya bukan langsung idPegawad tapi akundPegawai

    // nunjuk ke field transaksi di TransaksiDetail
    @OneToMany(mappedBy = "transaksi", cascade = CascadeType.ALL)
    private List<TransaksiDetail> details;

    public enum MetodePembayaran {
        TUNAI,
        NON_TUNAI
    }

}
