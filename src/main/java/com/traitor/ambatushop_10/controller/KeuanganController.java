package com.traitor.ambatushop_10.controller;

import com.traitor.ambatushop_10.dto.FinancialSummary;
import com.traitor.ambatushop_10.model.Keuangan;
import com.traitor.ambatushop_10.service.KeuanganService;
import lombok.AllArgsConstructor;
// import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/keuangan")
@AllArgsConstructor
public class KeuanganController {

    private final KeuanganService keuanganService;

    // ===== ENDPOINT UNTUK SEMUA ROLE (KASIR, MANAJER, ADMIN) =====

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('KASIR', 'MANAJER', 'ADMIN')")
    public FinancialSummary getFinancialSummary() {
        List<Keuangan> allKeuangan = keuanganService.getAllKeuangan();

        // Filter dan hitung total
        double totalPemasukan = allKeuangan.stream()
                .filter(k -> k.getJenis() == Keuangan.JenisTransaksi.PEMASUKAN)
                .mapToDouble(Keuangan::getNominal)
                .sum();

        double totalPengeluaran = allKeuangan.stream()
                .filter(k -> k.getJenis() == Keuangan.JenisTransaksi.PENGELUARAN)
                .mapToDouble(Keuangan::getNominal)
                .sum();

        return new FinancialSummary(totalPemasukan, totalPengeluaran, allKeuangan.size());
    }

    @GetMapping("/kasir/recent")
    @PreAuthorize("hasAnyRole('KASIR', 'MANAJER', 'ADMIN')")
    public List<Keuangan> getRecentKeuangan(@RequestParam(defaultValue = "10") int limit) {
        List<Keuangan> allKeuangan = keuanganService.getAllKeuangan();
        // Ambil data terbaru
        return allKeuangan.stream()
                .sorted((a, b) -> b.getTanggal().compareTo(a.getTanggal()))
                .limit(limit)
                .toList();
    }

    @GetMapping("/kasir/by-type/{jenis}")
    @PreAuthorize("hasAnyRole('KASIR', 'MANAJER', 'ADMIN')")
    public List<Keuangan> getKeuanganByType(@PathVariable String jenis) {
        Keuangan.JenisTransaksi jenisEnum;
        try {
            jenisEnum = Keuangan.JenisTransaksi.valueOf(jenis.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Jenis tidak valid: " + jenis);
        }

        return keuanganService.getByJenis(jenisEnum);
    }

    @PostMapping("/kasir/add")
    @PreAuthorize("hasAnyRole('KASIR', 'MANAJER', 'ADMIN')")
    public Keuangan createKeuanganForKasir(@RequestBody Keuangan keuangan) {
        return keuanganService.createKeuanganForKasir(keuangan);
    }

    // ===== ENDPOINT UNTUK MANAJER & ADMIN SAJA (TETAP ADA) =====

    @GetMapping
    @PreAuthorize("hasAnyRole('MANAJER', 'ADMIN')")
    public List<Keuangan> getAllKeuangan() {
        return keuanganService.getAllKeuangan();
    }

    @PostMapping
    @PreAuthorize("hasRole('MANAJER')")
    public Keuangan createKeuangan(@RequestBody Keuangan keuangan) {
        return keuanganService.createKeuangan(keuangan);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAJER', 'ADMIN')")
    public Keuangan getKeuanganById(@PathVariable long id) {
        return keuanganService.getKeuanganById(id);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAJER', 'ADMIN')")
    public String deleteKeuangan(@PathVariable long id) {
        keuanganService.deleteKeuangan(id);
        return "Pengeluaran berhasil dihapus";
    }

}
