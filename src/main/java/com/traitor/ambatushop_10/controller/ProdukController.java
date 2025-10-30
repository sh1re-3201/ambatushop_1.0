package com.traitor.ambatushop_10.controller;

import com.traitor.ambatushop_10.model.Produk;
import com.traitor.ambatushop_10.service.ProdukService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/produk")
public class ProdukController {

    private final ProdukService produkService;

    public ProdukController(ProdukService produkService) {
        this.produkService = produkService;
    }

    //CRUD Produk udah pake role dari metod security

    // GET semua produk
    @GetMapping
    @PreAuthorize("hasAnyRole('KASIR', 'MANAJER', 'ADMIN')")
    public List<Produk> getAllProduk() {
        return produkService.getAllProduk();
    }

    // GET produk by ID
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('KASIR', 'MANAJER', 'ADMIN')")
    public Produk getProdukById(@PathVariable Long id) {
        return produkService.getProdukById(id);
    }

    // SEARCH produk
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('KASIR', 'MANAJER', 'ADMIN')")
    public List<Produk> searchProduk(@RequestParam String keyword) {
        return produkService.searchProduk(keyword);
    }

    // CREATE produk
    @PostMapping
    @PreAuthorize("hasAnyRole('MANAJER', 'ADMIN')")
    public Produk createProduk(@RequestBody Produk produk) {
        return produkService.createProduk(produk);
    }

    // UPDATE produk
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAJER', 'ADMIN')")
    public Produk updateProduk(@PathVariable Long id, @RequestBody Produk produk) {
        return produkService.updateProduk(id, produk);
    }

    // DELETE produk
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public String deleteProduk(@PathVariable Long id) {
        produkService.deleteProduk(id);
        return "Produk berhasil dihapus";
    }
}