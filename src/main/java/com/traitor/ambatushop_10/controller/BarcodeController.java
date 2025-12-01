package com.traitor.ambatushop_10.controller;

import com.traitor.ambatushop_10.model.Produk;
import com.traitor.ambatushop_10.repository.ProdukRepository;
import com.traitor.ambatushop_10.service.BarcodeService;
import com.traitor.ambatushop_10.service.ProdukService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/barcode")
public class BarcodeController {

    private final BarcodeService barcodeService;
    private final ProdukService produkService;
    private final ProdukRepository produkRepository;

    public BarcodeController(BarcodeService barcodeService, ProdukService produkService,
            ProdukRepository produkRepository) {
        this.barcodeService = barcodeService;
        this.produkService = produkService;
        this.produkRepository = produkRepository;
    }

    // GET barcode image
    @GetMapping("/produk/{id}/image")
    public ResponseEntity<byte[]> getBarcodeImage(@PathVariable Long id) {
        try {
            Produk produk = produkService.getProdukById(id);

            if (produk.getBarcodeImagePath() == null || produk.getBarcodeImagePath().trim().isEmpty()) {
                System.out.println("Barcode image path is null for product: " + id);
                return ResponseEntity.notFound().build();
            }

            // Gunakan absolute path yang konsisten
            String imagePath = "./barcodes/" + produk.getBarcodeImagePath();
            Path filePath = Paths.get(imagePath);

            System.out.println("Looking for barcode image at: " + filePath.toAbsolutePath());

            if (!Files.exists(filePath)) {
                System.out.println("Barcode image file not found: " + filePath.toAbsolutePath());
                return ResponseEntity.notFound().build();
            }

            byte[] imageBytes = Files.readAllBytes(filePath);
            System.out.println("Barcode image loaded successfully, size: " + imageBytes.length + " bytes");

            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_PNG)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"barcode-" + id + ".png\"")
                    .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate")
                    .header(HttpHeaders.PRAGMA, "no-cache")
                    .header(HttpHeaders.EXPIRES, "0")
                    .body(imageBytes);

        } catch (Exception e) {
            System.err.println("Error loading barcode image for product " + id + ": " + e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    // POST decode barcode dari uploaded image
    @PostMapping("/decode")
    public ResponseEntity<Map<String, Object>> decodeBarcode(@RequestParam("image") MultipartFile imageFile) {
        try {
            System.out.println("Received barcode decode request");
            System.out.println("File size: " + imageFile.getSize() + " bytes");
            System.out.println("Content type: " + imageFile.getContentType());

            if (imageFile.isEmpty()) {
                System.out.println("File is empty");
                throw new RuntimeException("File gambar kosong");
            }

            String contentType = imageFile.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                System.out.println("Invalid content type: " + contentType);
                throw new RuntimeException("File harus berupa gambar (JPEG, PNG, etc)");
            }

            System.out.println("Calling barcodeService.decodeBarcodeFromImage...");
            String barcodeText = barcodeService.decodeBarcodeFromImage(imageFile);
            System.out.println("Decoded barcode: " + barcodeText);

            if (barcodeText == null || barcodeText.trim().isEmpty()) {
                System.out.println("No barcode found in image");
                throw new RuntimeException("Tidak dapat membaca barcode dari gambar");
            }

            Optional<Produk> produk = findProductByBarcode(barcodeText.trim());

            Map<String, Object> response = new HashMap<>();
            response.put("barcode", barcodeText);
            response.put("produk", produk.orElse(null));
            response.put("found", produk.isPresent());
            response.put("success", true);

            System.out.println("Response: " + response);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("Error decoding barcode: " + e.getMessage());
            e.printStackTrace();

            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            error.put("success", false);
            return ResponseEntity.badRequest().body(error);
        }
    }

    // POST generate barcode untuk produk - FIXED
    @PostMapping("/produk/{id}/generate")
    public ResponseEntity<Map<String, Object>> generateBarcode(@PathVariable Long id) {
        try {
            Produk produk = produkService.getProdukById(id);

            // Generate barcode text jika belum ada
            if (produk.getBarcode() == null || produk.getBarcode().trim().isEmpty()) {
                String barcodeText = barcodeService.generateBarcodeText(produk);
                produk.setBarcode(barcodeText);
            }

            // Generate barcode image
            String imagePath = barcodeService.generateBarcodeImage(produk.getBarcode(), id);
            produk.setBarcodeImagePath(imagePath);

            // Save updated product
            Produk updated = produkService.updateProduk(id, produk);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Barcode berhasil digenerate");
            response.put("produk", updated);
            response.put("barcode", updated.getBarcode());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", "Gagal generate barcode: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // GET check barcode exists
    @GetMapping("/check/{barcode}")
    public ResponseEntity<Map<String, Object>> checkBarcode(@PathVariable String barcode) {
        try {
            System.out.println("Checking barcode: " + barcode);

            Optional<Produk> produk = findProductByBarcode(barcode.trim());

            Map<String, Object> response = new HashMap<>();
            response.put("exists", produk.isPresent());
            response.put("produk", produk.orElse(null));
            response.put("barcode", barcode);
            response.put("success", true);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("Error checking barcode: " + e.getMessage());

            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            error.put("success", false);
            return ResponseEntity.badRequest().body(error);
        }
    }

    private Optional<Produk> findProductByBarcode(String barcode) {
        // Gunakan repository method yang sudah ada
        return produkRepository.findByBarcode(barcode);
    }
}