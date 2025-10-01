package com.traitor.ambatushop_10.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.List;

@Entity @Table(name = "transaksi") @Getter @Setter
public class Transaksi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime tanggal;

    @Column(nullable = false)
    private Double total;

    @Column(nullable = false)
    private boolean metode_pembayaran; // true = tunai, false = QRIS

    @ManyToOne
    @JoinColumn(name = "idPegawai", nullable = false)
    private Akun idPegawai;

    @OneToMany(mappedBy = "transaksi", cascade = CascadeType.ALL)
    private List<TransaksiDetail> details;

}
