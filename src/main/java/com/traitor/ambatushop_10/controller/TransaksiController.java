package com.traitor.ambatushop_10.controller;

import com.traitor.ambatushop_10.dto.ErrorResponse;
import com.traitor.ambatushop_10.dto.TransaksiRequest;
import com.traitor.ambatushop_10.dto.TransaksiResponse;
import com.traitor.ambatushop_10.model.Produk;
import com.traitor.ambatushop_10.model.Transaksi;
import com.traitor.ambatushop_10.model.TransaksiDetail;
import com.traitor.ambatushop_10.service.TransaksiService;

import lombok.Getter;
import lombok.Setter;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/transaksi")
public class TransaksiController {

    private final TransaksiService transaksiService;

    public TransaksiController(TransaksiService transaksiService) {
        this.transaksiService = transaksiService;
    }

    // 🔧 ENHANCE: CREATE dengan request body yang lebih structured
    // ✅ FIX: GET semua transaksi
    @GetMapping
    @PreAuthorize("hasAnyRole('KASIR','MANAJER','ADMIN')")
    public ResponseEntity<?> getAllTransaksi() {
        try {
            List<Transaksi> transaksis = transaksiService.getAllTransaksi();

            // Convert to Response DTO jika perlu
            List<TransaksiResponse> responses = transaksis.stream()
                    .map(TransaksiResponse::new)
                    .toList();

            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse(500, "SERVER_ERROR", "Gagal mengambil data transaksi",
                            e.getMessage(), "/api/transaksi"));
        }
    }

    // ✅ FIX: GET transaksi by ID
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('KASIR','MANAJER','ADMIN')")
    public ResponseEntity<?> getTransaksiById(@PathVariable Long id) {
        try {
            Transaksi transaksi = transaksiService.getTransaksiById(id);
            return ResponseEntity.ok(new TransaksiResponse(transaksi));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(404, "NOT_FOUND", "Transaksi tidak ditemukan",
                            e.getMessage(), "/api/transaksi/" + id));
        }
    }

    // 🔧 UPDATE: CREATE dengan Request DTO
    @PostMapping
    @PreAuthorize("hasAnyRole('KASIR')")
    public ResponseEntity<?> createTransaksi(@RequestBody TransaksiRequest request) {
        try {
            Transaksi created = transaksiService.createTransaksi(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(new TransaksiResponse(created));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(400, "VALIDATION_ERROR", "Data transaksi tidak valid",
                            e.getMessage(), "/api/transaksi"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse(500, "SERVER_ERROR", "Gagal membuat transaksi",
                            e.getMessage(), "/api/transaksi"));
        }
    }

    // ✅ FIX: DELETE transaksi
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<?> deleteTransaksi(@PathVariable Long id) {
        try {
            transaksiService.deleteTransaksi(id);
            return ResponseEntity.ok("Transaksi berhasil dihapus");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(404, "NOT_FOUND", "Transaksi tidak ditemukan",
                            e.getMessage(), "/api/transaksi/" + id));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse(500, "SERVER_ERROR", "Gagal menghapus transaksi",
                            e.getMessage(), "/api/transaksi/" + id));
        }
    }


}
