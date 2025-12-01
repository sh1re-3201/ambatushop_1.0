package com.traitor.ambatushop_10.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "produk")
@Getter
@Setter
@NoArgsConstructor
public class Produk {

    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.IDENTITY)
    // @Column(name = "id_produk")
    private Long idProduk;

    @Column(nullable = false)
    private String namaProduk;

    @Column(nullable = false)
    private Double harga;

    @Column(nullable = false)
    private short stok;

    @Column(unique = true, length = 50)
    private String barcode;

    @Column(name = "barcode_image_path", length = 255)
    private String barcodeImagePath;

    public Produk(String namaProduk, Double harga, short stok) {
        this.namaProduk = namaProduk;
        this.harga = harga;
        this.stok = stok;
    }
}
