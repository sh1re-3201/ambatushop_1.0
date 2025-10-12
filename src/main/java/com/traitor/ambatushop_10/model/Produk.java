package com.traitor.ambatushop_10.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "produk")
@Getter @Setter
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
}
