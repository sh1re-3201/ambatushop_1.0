package com.traitor.ambatushop_10.controller;

import com.traitor.ambatushop_10.model.Keuangan;
import com.traitor.ambatushop_10.service.KeuanganService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/keuangan")
@AllArgsConstructor
public class KeuanganController {

    private final KeuanganService keuanganService;

    // GET semua pengeluaran manual
    @GetMapping
    @PreAuthorize("hasAnyRole('MANAJER', 'ADMIN')")
    public List<Keuangan> getAllKeuangan() {
        // Hanya return pengeluaran manual
        return keuanganService.getAllKeuangan().stream()
                .filter(k -> k.getJenis() == Keuangan.JenisTransaksi.PENGELUARAN)
                .toList();
    }

    // CREATE pengeluaran manual
    @PostMapping
    @PreAuthorize("hasAnyRole('MANAJER', 'ADMIN', 'KASIR')")
    public ResponseEntity<?> createKeuangan(@RequestBody Keuangan keuangan) {
        try {
            // PASTIKAN hanya PENGELUARAN yang bisa dibuat
            keuangan.setJenis(Keuangan.JenisTransaksi.PENGELUARAN);
            
            Keuangan created = keuanganService.createKeuangan(keuangan);
            return ResponseEntity.ok(created);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Gagal menyimpan pengeluaran", "message", e.getMessage()));
        }
    }

    // GET pengeluaran by ID
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAJER', 'ADMIN')")
    public ResponseEntity<?> getKeuanganById(@PathVariable long id) {
        try {
            Keuangan keuangan = keuanganService.getKeuanganById(id);
            // Cek apakah ini pengeluaran
            if (keuangan.getJenis() != Keuangan.JenisTransaksi.PENGELUARAN) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(keuangan);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // DELETE pengeluaran manual
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAJER', 'ADMIN')")
    public ResponseEntity<?> deleteKeuangan(@PathVariable long id) {
        try {
            keuanganService.deleteKeuangan(id);
            return ResponseEntity.ok("Pengeluaran berhasil dihapus");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Gagal menghapus pengeluaran", "message", e.getMessage()));
        }
    }

    /**
     *  Get integrated financial data (untuk dashboard)
     */
    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('MANAJER', 'ADMIN', 'KASIR')")
    public ResponseEntity<Map<String, Object>> getFinancialSummary() {
        try {
            Map<String, Object> summary = keuanganService.getFinancialSummary();
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Gagal mengambil summary keuangan", "message", e.getMessage()));
        }
    }

    /**
     *  Get integrated records (pemasukan + pengeluaran)
     */
    @GetMapping("/integrated")
    @PreAuthorize("hasAnyRole('MANAJER', 'ADMIN', 'KASIR')")
    public ResponseEntity<?> getIntegratedRecords() {
        try {
            // Ini akan diimplementasi di frontend dengan menggabungkan data
            // dari transaksi dan keuangan
            return ResponseEntity.ok(Map.of(
                "message", "Use /api/transaksi for income data and /api/keuangan for expense data"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Gagal mengambil data terintegrasi", "message", e.getMessage()));
        }
    }
}
