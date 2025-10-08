package com.traitor.ambatushop_10.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "transaksi_detail")
@Getter
@Setter
public class TransaksiDetail {

    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.IDENTITY)
    private Long idTransaksiDetail;

    // `mappedBy` itu harus menunjuk ke nama variabel many to one di
    // TransaksiDetail, bukan ke nama ID-nya.
    @ManyToOne
    @JoinColumn(name = "idTransaksi", nullable = false)
    private Transaksi transaksi; // Sama seperti di akun, nanti yg dipanggila bukan idTransaksi.id tapi transaksi,idTransaksi

    @ManyToOne
    @JoinColumn(name = "produk_id", nullable = false)
    private Produk produkId;

    @Column(nullable = false)
    private short jumlah;

    @Column(nullable = false)
    private double hargaSatuan;

    @Column(nullable = false)
    private double subtotal;

}
