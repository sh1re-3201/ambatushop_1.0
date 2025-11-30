package com.traitor.ambatushop_10.controller;

import com.traitor.ambatushop_10.model.Produk;
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
    
    public BarcodeController(BarcodeService barcodeService, ProdukService produkService) {
        this.barcodeService = barcodeService;
        this.produkService = produkService;
    }
    
    // GET barcode image
    @GetMapping("/produk/{id}/image")
    public ResponseEntity<byte[]> getBarcodeImage(@PathVariable Long id) {
        try {
            Produk produk = produkService.getProdukById(id);
            if (produk.getBarcodeImagePath() == null) {
                return ResponseEntity.notFound().build();
            }
            
            Path imagePath = Paths.get("./barcodes/" + produk.getBarcodeImagePath());
            
            // Check if file exists
            if (!Files.exists(imagePath)) {
                return ResponseEntity.notFound().build();
            }
            
            byte[] imageBytes = Files.readAllBytes(imagePath);
            
            return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"barcode-" + id + ".png\"")
                .body(imageBytes);
                
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    // POST decode barcode dari uploaded image
    @PostMapping("/decode")
    public ResponseEntity<Map<String, Object>> decodeBarcode(@RequestParam("image") MultipartFile imageFile) {
        try {
            // Validate file
            if (imageFile.isEmpty()) {
                throw new RuntimeException("File gambar kosong");
            }
            
            // Validate file type
            String contentType = imageFile.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                throw new RuntimeException("File harus berupa gambar");
            }
            
            String barcodeText = barcodeService.decodeBarcodeFromImage(imageFile);
            
            // Cari produk berdasarkan barcode
            Optional<Produk> produk = findProductByBarcode(barcodeText);
            
            Map<String, Object> response = new HashMap<>();
            response.put("barcode", barcodeText);
            response.put("produk", produk.orElse(null));
            response.put("found", produk.isPresent());
            response.put("success", true);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            error.put("success", false);
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // POST generate barcode untuk produk
    @PostMapping("/produk/{id}/generate")
    public ResponseEntity<Map<String, Object>> generateBarcode(@PathVariable Long id) {
        try {
            Produk produk = produkService.getProdukById(id);
            
            // Generate barcode text jika belum ada
            if (produk.getBarcode() == null) {
                String barcodeText = barcodeService.generateBarcodeText(produk);
                produk.setBarcode(barcodeText);
            }
            
            // Generate barcode image
            String imagePath = barcodeService.generateBarcodeImage(produk.getBarcode(), id);
            produk.setBarcodeImagePath(imagePath);
            
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
            Optional<Produk> produk = findProductByBarcode(barcode);
            
            Map<String, Object> response = new HashMap<>();
            response.put("exists", produk.isPresent());
            response.put("produk", produk.orElse(null));
            response.put("barcode", barcode);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            error.put("success", false);
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    private Optional<Produk> findProductByBarcode(String barcode) {
        // Implement search logic - bisa melalui repository custom query
        // Untuk sementara, difilter manual
        List<Produk> allProducts = produkService.getAllProduk();
        return allProducts.stream()
            .filter(p -> p.getBarcode() != null && p.getBarcode().equals(barcode))
            .findFirst();
    }
}