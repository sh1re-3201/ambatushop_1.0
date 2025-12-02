package com.traitor.ambatushop_10.service;

import com.traitor.ambatushop_10.model.Keuangan;
import com.traitor.ambatushop_10.model.Transaksi;
import com.traitor.ambatushop_10.repository.KeuanganRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@AllArgsConstructor
@Transactional
public class KeuanganService {

    private final KeuanganRepository keuanganRepository;
    private final TransaksiService transaksiService;

    // Get all keuangan data
    @Transactional(readOnly = true)
    public List<Keuangan> getAllKeuangan() {
        return keuanganRepository.findAll();
    }

    // Create manual keuangan entry (HANYA untuk pengeluaran manual)
    public Keuangan createKeuangan(Keuangan keuangan) {
        if (keuangan.getKeterangan() == null || keuangan.getKeterangan().trim().isEmpty()) {
            throw new RuntimeException("Keterangan tidak boleh kosong");
        }

        // hanya PENGELUARAN yang bisa dibuat manual
        if (keuangan.getJenis() != Keuangan.JenisTransaksi.PENGELUARAN) {
            throw new RuntimeException("Hanya bisa membuat entry PENGELUARAN manual");
        }

        return keuanganRepository.save(keuangan);
    }

    // Get keuangan by ID
    @Transactional(readOnly = true)
    public Keuangan getKeuanganById(long id) {
        return keuanganRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Data keuangan dengan ID: " + id + " tidak ditemukan"));
    }

    // Get by jenis
    @Transactional(readOnly = true)
    public List<Keuangan> getByJenis(Keuangan.JenisTransaksi jenis) {
        return keuanganRepository.findByJenis(jenis);
    }

    // Get total by jenis
    @Transactional(readOnly = true)
    public Double getTotalByJenis(Keuangan.JenisTransaksi jenis) {
        return keuanganRepository.findByJenis(jenis).stream()
                .mapToDouble(Keuangan::getNominal)
                .sum();
    }

    // Delete keuangan
    public void deleteKeuangan(long id) {
        Keuangan keuangan = getKeuanganById(id);

        // Cek apakah ini pengeluaran manual
        if (keuangan.getJenis() != Keuangan.JenisTransaksi.PENGELUARAN) {
            throw new RuntimeException("Hanya pengeluaran manual yang bisa dihapus");
        }

        keuanganRepository.delete(keuangan);
    }

    /**
     * Method untuk menghitung total pemasukan dari transaksi
     */
    @Transactional(readOnly = true)
    public Double getTotalPemasukan() {
        return transaksiService.getAllTransaksi().stream()
                .filter(t -> t.getPaymentStatus() == Transaksi.PaymentStatus.PAID)
                .filter(t -> !isStockPurchase(t)) // Filter out stock purchases
                .mapToDouble(Transaksi::getTotal)
                .sum();
    }

    /**
     * Method untuk menghitung total pengeluaran (manual + stock purchases)
     */
    @Transactional(readOnly = true)
    public Double getTotalPengeluaran() {
        // 1. Pengeluaran manual dari table keuangan
        double manualExpenses = getTotalByJenis(Keuangan.JenisTransaksi.PENGELUARAN);

        // 2. Stock purchases dari transaksi
        double stockPurchases = transaksiService.getAllTransaksi().stream()
                .filter(this::isStockPurchase)
                .mapToDouble(Transaksi::getTotal)
                .sum();

        return manualExpenses + stockPurchases;
    }

    /**
     * Helper method untuk cek apakah transaksi adalah stock purchase
     */
    private boolean isStockPurchase(Transaksi transaksi) {
        if (transaksi == null)
            return false;

        // Cek berdasarkan paymentGatewayResponse
        if (transaksi.getPaymentGatewayResponse() != null) {
            String response = transaksi.getPaymentGatewayResponse().toUpperCase();
            return response.contains("STOCK_PURCHASE") ||
                    response.contains("PEMBELIAN") ||
                    response.contains("BELI") ||
                    response.contains("STOK");
        }

        // Cek berdasarkan metode dan total (fallback)
        return transaksi.getMetode_pembayaran() == Transaksi.MetodePembayaran.TUNAI &&
                transaksi.getPaymentStatus() == Transaksi.PaymentStatus.PAID &&
                !transaksi.getReferenceNumber().contains("TRX"); // bukan transaksi penjualan reguler
    }

    /**
     * Get integrated financial summary
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getFinancialSummary() {
        double pemasukan = getTotalPemasukan();
        double pengeluaran = getTotalPengeluaran();
        double laba = pemasukan - pengeluaran;

        long totalTransaksi = transaksiService.getAllTransaksi().stream()
                .filter(t -> t.getPaymentStatus() == Transaksi.PaymentStatus.PAID)
                .count();

        return Map.of(
                "totalPemasukan", pemasukan,
                "totalPengeluaran", pengeluaran,
                "labaBersih", laba,
                "totalTransaksi", totalTransaksi,
                "totalPengeluaranManual", getTotalByJenis(Keuangan.JenisTransaksi.PENGELUARAN),
                "totalStockPurchase", transaksiService.getAllTransaksi().stream()
                        .filter(this::isStockPurchase)
                        .mapToDouble(Transaksi::getTotal)
                        .sum());
    }

    public List<Keuangan> getRecentKeuangan(int limit) {
        List<Keuangan> allKeuangan = keuanganRepository.findAll();
        return allKeuangan.stream()
                .sorted((a, b) -> b.getTanggal().compareTo(a.getTanggal()))
                .limit(limit)
                .toList();
    }

    public List<Keuangan> getByJenisForKasir(String jenis) {
        Keuangan.JenisTransaksi jenisEnum;
        try {
            jenisEnum = Keuangan.JenisTransaksi.valueOf(jenis.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Jenis tidak valid: " + jenis);
        }

        return keuanganRepository.findByJenis(jenisEnum);
    }

    // Kasir bisa tambah pengeluaran
    public Keuangan createKeuanganForKasir(Keuangan keuangan) {
        if (keuangan.getKeterangan() == null || keuangan.getKeterangan().trim().isEmpty()) {
            throw new RuntimeException("Keterangan tidak boleh kosong");
        }

        // Pastikan hanya pengeluaran yang bisa ditambahkan kasir
        if (keuangan.getJenis() != Keuangan.JenisTransaksi.PENGELUARAN) {
            throw new RuntimeException("Kasir hanya bisa menambahkan pengeluaran");
        }

        return keuanganRepository.save(keuangan);
    }
}
