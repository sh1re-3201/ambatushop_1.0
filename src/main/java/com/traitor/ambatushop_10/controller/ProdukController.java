package com.traitor.ambatushop_10.controller;

import com.traitor.ambatushop_10.model.Produk;
import com.traitor.ambatushop_10.repository.ProdukRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class ProdukController {

    private final ProdukRepository produkRepository;

    public ProdukController(ProdukRepository produkRepository) {
        this.produkRepository = produkRepository;
    }

    @GetMapping("/produk")
    public List<Produk> getProduk() {
        return produkRepository.findAll(); // menampilkan data dari database dengan format JSON
    }
}
