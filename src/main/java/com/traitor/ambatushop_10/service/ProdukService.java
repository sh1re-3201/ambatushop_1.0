package com.traitor.ambatushop_10.service;

import com.traitor.ambatushop_10.model.Produk;
import com.traitor.ambatushop_10.repository.ProdukRepository;
import org.springframework.stereotype.Service;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Service
public class ProdukService {

    private final ProdukRepository produkRepository;
    // private final BarcodeService barcodeService;

    public ProdukService(ProdukRepository produkRepository) {
        this.produkRepository = produkRepository;
        // this.barcodeService = barcodeService;
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

        // Simpan produk dulu untuk mendapatkan ID
        Produk savedProduk = produkRepository.save(produk);

        // // Generate barcode SETELAH produk disimpan (punya ID)
        // if (savedProduk.getBarcode() == null ||
        // savedProduk.getBarcode().trim().isEmpty()) {
        // String generatedBarcode = barcodeService.generateBarcodeText(savedProduk);
        // savedProduk.setBarcode(generatedBarcode);
        // }

        // if (produkRepository.existsByBarcode(savedProduk.getBarcode())) {
        // throw new RuntimeException("Barcode '" + savedProduk.getBarcode() + "' sudah
        // digunakan");
        // }

        // try {
        // // Generate barcode image
        // String imagePath =
        // barcodeService.generateBarcodeImage(savedProduk.getBarcode(),
        // savedProduk.getIdProduk());
        // savedProduk.setBarcodeImagePath(imagePath);
        // return produkRepository.save(savedProduk); // Save lagi dengan barcode image
        // } catch (Exception e) {
        // // Jika gagal generate image, tetap simpan produk tanpa image
        // System.err.println("Warning: Gagal generate barcode image: " +
        // e.getMessage());
        return produkRepository.save(savedProduk);
        // }
    }

    // UPDATE: Juga hapus image lama saat update barcode
    public Produk updateProduk(Long id, Produk produkUpdate) {
        Produk existing = getProdukById(id);

        // String oldBarcodeImagePath = existing.getBarcodeImagePath(); // Simpan path lama

        if (produkUpdate.getNamaProduk() != null) {
            existing.setNamaProduk(produkUpdate.getNamaProduk());
        }
        if (produkUpdate.getHarga() != null) {
            existing.setHarga(produkUpdate.getHarga());
        }
        if (produkUpdate.getStok() >= 0) {
            existing.setStok(produkUpdate.getStok());
        }

        // UPDATE BARCODE JIKA DIUBAH
        // if (produkUpdate.getBarcode() != null && !produkUpdate.getBarcode().equals(existing.getBarcode())) {
        //     // Validasi barcode unique
        //     if (produkRepository.existsByBarcode(produkUpdate.getBarcode())) {
        //         throw new RuntimeException("Barcode '" + produkUpdate.getBarcode() + "' sudah digunakan");
        //     }
        //     existing.setBarcode(produkUpdate.getBarcode());

            // HAPUS IMAGE LAMA sebelum generate baru
            // if (oldBarcodeImagePath != null) {
            //     deleteBarcodeImageByPath(oldBarcodeImagePath);
            // }

            // // Regenerate barcode image
            // try {
            // String imagePath = barcodeService.generateBarcodeImage(existing.getBarcode(),
            // id);
            // existing.setBarcodeImagePath(imagePath);
            // } catch (Exception e) {
            // System.err.println("Warning: Gagal regenerate barcode image: " +
            // e.getMessage());
            // existing.setBarcodeImagePath(null); // Set null jika gagal
            // }
        // }

        return produkRepository.save(existing);
    }

    // Helper method untuk hapus image by path
    // private void deleteBarcodeImageByPath(String imagePath) {
    //     try {
    //         if (imagePath != null && !imagePath.trim().isEmpty()) {
    //             Path path = Paths.get("./barcodes/" + imagePath);
    //             if (Files.exists(path)) {
    //                 Files.delete(path);
    //                 System.out.println("Old barcode image deleted: " + path);
    //             }
    //         }
    //     } catch (Exception e) {
    //         System.err.println("Error deleting old barcode image: " + e.getMessage());
    //     }
    // }

    // DELETE produk dengan hapus barcode image
    public void deleteProduk(Long id) {
        Produk produk = getProdukById(id);

        // HAPUS BARCODE IMAGE FILE sebelum hapus produk
        // deleteBarcodeImageFile(produk);

        produkRepository.delete(produk);
    }

    // Method untuk hapus file barcode image
    // private void deleteBarcodeImageFile(Produk produk) {
    //     try {
    //         if (produk.getBarcodeImagePath() != null && !produk.getBarcodeImagePath().trim().isEmpty()) {
    //             Path imagePath = Paths.get("./barcodes/" + produk.getBarcodeImagePath());

    //             if (Files.exists(imagePath)) {
    //                 Files.delete(imagePath);
    //                 System.out.println("Barcode image deleted: " + imagePath);
    //             } else {
    //                 System.out.println("Barcode image not found: " + imagePath);
    //             }
    //         }
    //     } catch (Exception e) {
    //         System.err.println("Error deleting barcode image: " + e.getMessage());
    //         // Jangan throw exception, biarkan produk tetap terhapus
    //     }
    // }

    public List<Produk> searchProduk(String keyword) {
        return produkRepository.findByNamaProdukContainingIgnoreCase(keyword);
    }
}