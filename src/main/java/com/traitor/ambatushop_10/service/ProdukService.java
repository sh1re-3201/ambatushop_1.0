package com.traitor.ambatushop_10.service;

import com.traitor.ambatushop_10.model.Produk;
import com.traitor.ambatushop_10.repository.ProdukRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProdukService {

    private final ProdukRepository produkRepository;

    public ProdukService(ProdukRepository produkRepository) {
        this.produkRepository = produkRepository;
    }

    public List<Produk> getAllProduk() {
        return produkRepository.findAll();
    }

    public Produk getProdukById(Long id) {
        return produkRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produk tidak ditemukan dengan ID: " + id));
    }

    public Produk createProduk(Produk produk) {
        // Validasi
        if (produk.getNamaProduk() == null || produk.getNamaProduk().trim().isEmpty()) {
            throw new RuntimeException("Nama produk tidak boleh kosong");
        }
        if (produk.getHarga() <= 0) {
            throw new RuntimeException("Harga harus lebih dari 0");
        }
        if (produk.getStok() < 0) {
            throw new RuntimeException("Stok tidak boleh negatif");
        }

        return produkRepository.save(produk);
    }

    public Produk updateProduk(Long id, Produk produkUpdate) {
        Produk existing = getProdukById(id);

        if (produkUpdate.getNamaProduk() != null) {
            existing.setNamaProduk(produkUpdate.getNamaProduk());
        }
        if (produkUpdate.getHarga() != null) {
            existing.setHarga(produkUpdate.getHarga());
        }
        if (produkUpdate.getStok() >= 0) {
            existing.setStok(produkUpdate.getStok());
        }

        return produkRepository.save(existing);
    }

    public void deleteProduk(Long id) {
        Produk produk = getProdukById(id);
        produkRepository.delete(produk);
    }

    public List<Produk> searchProduk(String keyword) {
        return produkRepository.findByNamaProdukContainingIgnoreCase(keyword);
    }
}