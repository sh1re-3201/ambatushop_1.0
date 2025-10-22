package com.traitor.ambatushop_10.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "produk")
@Getter @Setter @NoArgsConstructor
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

    public Produk(String namaProduk, Double harga, short stok) {
        this.namaProduk = namaProduk;
        this.harga = harga;
        this.stok = stok;
    }
}
