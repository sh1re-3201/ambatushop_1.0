package com.traitor.ambatushop_10.service;

import com.traitor.ambatushop_10.dto.StockPurchaseRequest;
import com.traitor.ambatushop_10.dto.TransaksiRequest;
import com.traitor.ambatushop_10.model.Akun;
import com.traitor.ambatushop_10.model.Keuangan;
import com.traitor.ambatushop_10.model.Produk;
import com.traitor.ambatushop_10.model.Transaksi;
import com.traitor.ambatushop_10.model.TransaksiDetail;
import com.traitor.ambatushop_10.repository.AkunRepository;
import com.traitor.ambatushop_10.repository.KeuanganRepository;
import com.traitor.ambatushop_10.repository.ProdukRepository;
import com.traitor.ambatushop_10.repository.TransaksiRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
public class TransaksiService {

    private final TransaksiRepository transaksiRepository;
    private final ProdukRepository produkRepository;
    private final AkunRepository akunRepository;
    private final KeuanganRepository keuanganRepository;

    public TransaksiService(TransaksiRepository transaksiRepository,
            ProdukRepository produkRepository,
            AkunRepository akunRepository, KeuanganRepository keuanganRepository) {
        this.transaksiRepository = transaksiRepository;
        this.produkRepository = produkRepository;
        this.akunRepository = akunRepository;
        this.keuanganRepository = keuanganRepository;
    }

    // GET semua transaksi
    public List<Transaksi> getAllTransaksi() {
        return transaksiRepository.findAll();
    }

    // GET transaksi by ID
    public Transaksi getTransaksiById(Long id) {
        return transaksiRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaksi tidak ditemukan dengan ID: " + id));
    }

    // CREATE transaksi dengan DTO
    public Transaksi createTransaksi(TransaksiRequest request) {
        // Validasi akun exists
        Akun akun = akunRepository.findById(request.getAkunId())
                .orElseThrow(() -> new RuntimeException("Akun tidak ditemukan dengan ID: " + request.getAkunId()));

        // Convert String to Enum
        Transaksi.MetodePembayaran metodePembayaran;
        try {
            metodePembayaran = Transaksi.MetodePembayaran.valueOf(request.getMetodePembayaran().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Metode pembayaran tidak valid: " + request.getMetodePembayaran());
        }

        // Untuk TUNAI langsung PAID, untuk NON_TUNAI tetap PENDING
        Transaksi.PaymentStatus initialStatus = (metodePembayaran == Transaksi.MetodePembayaran.TUNAI)
                ? Transaksi.PaymentStatus.PAID
                : Transaksi.PaymentStatus.PENDING;

        // Create transaksi entity
        Transaksi transaksi = new Transaksi();
        transaksi.setMetode_pembayaran(metodePembayaran);
        transaksi.setTotal(request.getTotal());
        transaksi.setAkun(akun);
        transaksi.setKasirName(request.getKasirName());
        transaksi.setPaymentStatus(initialStatus); // Status berdasarkan metode
        transaksi.setReferenceNumber(generateReferenceNumber());

        // Validasi & proses details
        if (request.getDetails() != null && !request.getDetails().isEmpty()) {
            validateStockAvailability(request.getDetails());
            List<TransaksiDetail> details = createTransaksiDetails(request.getDetails(), transaksi);
            transaksi.setDetails(details);

            // Kurangi stok
            updateProductStock(request.getDetails(), false);
        }

        return transaksiRepository.save(transaksi);
    }

    // UPDATE transaksi
    public Transaksi updateTransaksi(Transaksi transaksi) {
        return transaksiRepository.save(transaksi);
    }

    // DELETE transaksi
    public void deleteTransaksi(Long id) {
        Transaksi transaksi = getTransaksiById(id);

        // Kembalikan stok jika transaksi dihapus
        if (transaksi.getDetails() != null) {
            updateProductStockFromEntity(transaksi.getDetails(), true);
        }

        transaksiRepository.delete(transaksi);
    }

    // FIND by payment gateway ID
    public Optional<Transaksi> findByPaymentGatewayId(String paymentGatewayId) {
        return transaksiRepository.findByPaymentGatewayId(paymentGatewayId);
    }

    // NEW: Update payment status
    public Transaksi updatePaymentStatus(String paymentGatewayId, Transaksi.PaymentStatus status) {
        Transaksi transaksi = transaksiRepository.findByPaymentGatewayId(paymentGatewayId)
                .orElseThrow(
                        () -> new RuntimeException("Transaksi tidak ditemukan dengan payment ID: " + paymentGatewayId));

        transaksi.setPaymentStatus(status);
        return transaksiRepository.save(transaksi);
    }

    // Helper methods
    private void validateStockAvailability(List<com.traitor.ambatushop_10.dto.TransaksiDetailRequest> details) {
        for (com.traitor.ambatushop_10.dto.TransaksiDetailRequest detail : details) {
            Produk produk = produkRepository.findById(detail.getProdukId())
                    .orElseThrow(
                            () -> new RuntimeException("Produk tidak ditemukan dengan ID: " + detail.getProdukId()));

            if (produk.getStok() < detail.getJumlah()) {
                throw new RuntimeException(
                        "Stok " + produk.getNamaProduk() + " tidak mencukupi. " +
                                "Stok tersedia: " + produk.getStok() + ", diminta: " + detail.getJumlah());
            }
        }
    }

    private List<TransaksiDetail> createTransaksiDetails(
            List<com.traitor.ambatushop_10.dto.TransaksiDetailRequest> detailRequests, Transaksi transaksi) {
        return detailRequests.stream().map(detailReq -> {
            Produk produk = produkRepository.findById(detailReq.getProdukId())
                    .orElseThrow(
                            () -> new RuntimeException("Produk tidak ditemukan dengan ID: " + detailReq.getProdukId()));

            TransaksiDetail detail = new TransaksiDetail();
            detail.setTransaksi(transaksi);
            detail.setProdukId(produk);
            detail.setJumlah(detailReq.getJumlah());
            detail.setHargaSatuan(detailReq.getHargaSatuan());
            detail.setSubtotal(detailReq.getSubtotal());

            return detail;
        }).toList();
    }

    public void updateOldTransactionsWithKasirName() {
        List<Transaksi> allTransactions = transaksiRepository.findAll();

        for (Transaksi transaksi : allTransactions) {
            if (transaksi.getKasirName() == null && transaksi.getAkun() != null) {
                // Set kasir name dari akun
                transaksi.setKasirName(transaksi.getAkun().getUsername());
                transaksiRepository.save(transaksi);
                System.out.println("Updated transaction " + transaksi.getIdTransaksi() +
                        " with kasir: " + transaksi.getAkun().getUsername());
            }
        }
    }

    private void updateProductStock(List<com.traitor.ambatushop_10.dto.TransaksiDetailRequest> details,
            boolean restore) {
        for (com.traitor.ambatushop_10.dto.TransaksiDetailRequest detail : details) {
            Produk produk = produkRepository.findById(detail.getProdukId())
                    .orElseThrow(() -> new RuntimeException("Produk tidak ditemukan"));

            short stockChange = (short) (restore ? detail.getJumlah() : -detail.getJumlah());
            produk.setStok((short) (produk.getStok() + stockChange));
            produkRepository.save(produk);
        }
    }

    private void updateProductStockFromEntity(List<TransaksiDetail> details, boolean restore) {
        for (TransaksiDetail detail : details) {
            Produk produk = detail.getProdukId();
            short stockChange = (short) (restore ? detail.getJumlah() : -detail.getJumlah());
            produk.setStok((short) (produk.getStok() + stockChange));
            produkRepository.save(produk);
        }
    }

    private String generateReferenceNumber() {
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String random = String.format("%03d", new Random().nextInt(1000));
        return "TRX-" + date + "-" + random;
    }

    /**
     * CREATE stock purchase - HANYA sebagai pengeluaran, BUKAN transaksi
     * Method ini diubah total logic-nya
     */
    public Keuangan createStockPurchase(StockPurchaseRequest request) {
        System.out.println("🛒 Creating stock purchase (PENGELUARAN only): " + request);

        // Validasi akun
        Akun akun = akunRepository.findById(request.getAkunId())
                .orElseThrow(() -> {
                    System.out.println("❌ Akun tidak ditemukan: " + request.getAkunId());
                    return new RuntimeException("Akun tidak ditemukan dengan ID: " + request.getAkunId());
                });

        System.out.println("✅ Akun ditemukan: " + akun.getUsername());

        // HANYA CREATE KEUANGAN ENTRY, BUKAN TRANSAKSI
        Keuangan keuangan = new Keuangan();
        keuangan.setJenis(Keuangan.JenisTransaksi.PENGELUARAN);

        // Buat keterangan yang informative
        String keterangan = "Pembelian stok: " + request.getProductName();
        if (request.getSupplierName() != null && !request.getSupplierName().isEmpty()) {
            keterangan += " (Supplier: " + request.getSupplierName() + ")";
        }
        if (request.getNotes() != null && !request.getNotes().isEmpty()) {
            keterangan += " - " + request.getNotes();
        }

        keuangan.setKeterangan(keterangan);
        keuangan.setNominal(request.getTotalAmount());
        keuangan.setTanggal(LocalDateTime.now());
        keuangan.setAkun(akun);

        Keuangan savedKeuangan = keuanganRepository.save(keuangan);

        System.out.println("✅ Pengeluaran stok dicatat: " + savedKeuangan.getIdKeuangan() +
                " - " + keterangan + " - Rp" + request.getTotalAmount());

        return savedKeuangan; // Return Keuangan, bukan Transaksi
    }

}