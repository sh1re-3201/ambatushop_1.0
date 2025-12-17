package com.traitor.ambatushop_10.service;

import com.traitor.ambatushop_10.dto.StockPurchaseRequest;
import com.traitor.ambatushop_10.dto.TransaksiRequest;
import com.traitor.ambatushop_10.model.*;
import com.traitor.ambatushop_10.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private final TransaksiDetailRepository transaksiDetailRepository;

    public TransaksiService(TransaksiRepository transaksiRepository,
            ProdukRepository produkRepository,
            AkunRepository akunRepository, 
            KeuanganRepository keuanganRepository,
            TransaksiDetailRepository transaksiDetailRepository) {
        this.transaksiRepository = transaksiRepository;
        this.produkRepository = produkRepository;
        this.akunRepository = akunRepository;
        this.keuanganRepository = keuanganRepository;
        this.transaksiDetailRepository = transaksiDetailRepository;
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

    // CREATE transaksi dengan DTO - TANPA UPDATE STOK DULU
    @Transactional
    public Transaksi createTransaksi(TransaksiRequest request) {
        System.out.println("🛒 Creating transaction for akunId: " + request.getAkunId());
        
        // Validasi akun exists
        Akun akun = akunRepository.findById(request.getAkunId())
                .orElseThrow(() -> {
                    System.out.println("❌ Akun tidak ditemukan: " + request.getAkunId());
                    return new RuntimeException("Akun tidak ditemukan dengan ID: " + request.getAkunId());
                });

        System.out.println("✅ Akun ditemukan: " + akun.getUsername());

        // Convert String to Enum
        Transaksi.MetodePembayaran metodePembayaran;
        try {
            metodePembayaran = Transaksi.MetodePembayaran.valueOf(request.getMetodePembayaran().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Metode pembayaran tidak valid: " + request.getMetodePembayaran());
        }

        // Untuk TUNAI langsung PAID, untuk NON_TUNAI tetap PENDING
        Transaksi.PaymentStatus initialStatus = Transaksi.PaymentStatus.PENDING;
        
        // Hanya jika tunai langsung paid
        if (metodePembayaran == Transaksi.MetodePembayaran.TUNAI) {
            initialStatus = Transaksi.PaymentStatus.PAID;
        }

        // Create transaksi entity
        Transaksi transaksi = new Transaksi();
        transaksi.setMetode_pembayaran(metodePembayaran);
        transaksi.setTotal(request.getTotal());
        transaksi.setAkun(akun);
        transaksi.setKasirName(request.getKasirName());
        transaksi.setPaymentStatus(initialStatus);
        transaksi.setReferenceNumber(generateReferenceNumber());
        transaksi.setTanggal(LocalDateTime.now());

        System.out.println("📝 Transaction created with reference: " + transaksi.getReferenceNumber());

        // Validasi stock availability TAPI JANGAN UPDATE STOK DULU
        if (request.getDetails() != null && !request.getDetails().isEmpty()) {
            validateStockAvailability(request.getDetails());
            
            // Simpan transaksi dulu untuk mendapatkan ID
            Transaksi savedTransaksi = transaksiRepository.save(transaksi);
            
            // Create details
            List<TransaksiDetail> details = createTransaksiDetails(request.getDetails(), savedTransaksi);
            transaksiDetailRepository.saveAll(details);
            savedTransaksi.setDetails(details);
            
            // JANGAN UPDATE STOK DI SINI! Stok hanya dikurangi saat pembayaran berhasil
            
            return savedTransaksi;
        }

        return transaksiRepository.save(transaksi);
    }

    // Method baru: Update payment status DAN kurangi stok jika berhasil
    @Transactional
    public Transaksi updatePaymentStatus(Long transactionId, Transaksi.PaymentStatus newStatus) {
        Transaksi transaksi = transaksiRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaksi tidak ditemukan: " + transactionId));

        Transaksi.PaymentStatus oldStatus = transaksi.getPaymentStatus();
        transaksi.setPaymentStatus(newStatus);

        // HANYA jika status berubah dari PENDING ke PAID, maka kurangi stok
        if (oldStatus == Transaksi.PaymentStatus.PENDING && newStatus == Transaksi.PaymentStatus.PAID) {
            System.out.println("✅ Payment successful, reducing stock for transaction: " + transactionId);
            reduceProductStock(transaksi.getDetails());
        }
        // Jika transaksi dibatalkan (FAILED/EXPIRED) dan sebelumnya PAID, kembalikan stok
        else if (oldStatus == Transaksi.PaymentStatus.PAID && 
                (newStatus == Transaksi.PaymentStatus.FAILED || newStatus == Transaksi.PaymentStatus.EXPIRED)) {
            System.out.println("🔄 Transaction cancelled, restoring stock for transaction: " + transactionId);
            restoreProductStock(transaksi.getDetails());
        }

        return transaksiRepository.save(transaksi);
    }

    // Method untuk konfirmasi pembayaran tunai
    @Transactional
    public Transaksi confirmCashPayment(Long transactionId) {
        Transaksi transaksi = transaksiRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaksi tidak ditemukan: " + transactionId));

        if (transaksi.getMetode_pembayaran() != Transaksi.MetodePembayaran.TUNAI) {
            throw new RuntimeException("Hanya transaksi tunai yang bisa dikonfirmasi");
        }

        if (transaksi.getPaymentStatus() != Transaksi.PaymentStatus.PENDING) {
            throw new RuntimeException("Transaksi sudah diproses sebelumnya");
        }

        // Update status ke PAID dan kurangi stok
        transaksi.setPaymentStatus(Transaksi.PaymentStatus.PAID);
        
        // Kurangi stok
        if (transaksi.getDetails() != null) {
            reduceProductStock(transaksi.getDetails());
        }

        return transaksiRepository.save(transaksi);
    }

    // Method untuk mengurangi stok saat pembayaran berhasil
    private void reduceProductStock(List<TransaksiDetail> details) {
        if (details == null) return;
        
        for (TransaksiDetail detail : details) {
            Produk produk = detail.getProdukId();
            if (produk == null) {
                // Load produk dari repository jika null
                produk = produkRepository.findById(detail.getProdukId().getIdProduk())
                        .orElseThrow(() -> new RuntimeException("Produk tidak ditemukan"));
            }
            
            short requestedQty = detail.getJumlah();
            short currentStock = produk.getStok();
            
            System.out.println("📦 Reducing stock for product: " + produk.getNamaProduk() + 
                             ", Current: " + currentStock + ", Requested: " + requestedQty);
            
            if (currentStock < requestedQty) {
                throw new RuntimeException("Stok " + produk.getNamaProduk() + " tidak mencukupi. " +
                        "Stok tersedia: " + currentStock + ", diminta: " + requestedQty);
            }
            
            produk.setStok((short)(currentStock - requestedQty));
            produkRepository.save(produk);
            
            System.out.println("✅ Stock reduced to: " + produk.getStok());
        }
    }

    // Method untuk mengembalikan stok jika transaksi dibatalkan
    private void restoreProductStock(List<TransaksiDetail> details) {
        if (details == null) return;
        
        for (TransaksiDetail detail : details) {
            Produk produk = detail.getProdukId();
            if (produk == null) {
                produk = produkRepository.findById(detail.getProdukId().getIdProduk())
                        .orElseThrow(() -> new RuntimeException("Produk tidak ditemukan"));
            }
            
            short returnedQty = detail.getJumlah();
            short currentStock = produk.getStok();
            
            System.out.println("🔄 Restoring stock for product: " + produk.getNamaProduk() + 
                             ", Current: " + currentStock + ", Restored: " + returnedQty);
            
            produk.setStok((short)(currentStock + returnedQty));
            produkRepository.save(produk);
            
            System.out.println("✅ Stock restored to: " + produk.getStok());
        }
    }

    // Validasi stok (hanya cek, tidak kurangi)
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

    // UPDATE transaksi
    public Transaksi updateTransaksi(Transaksi transaksi) {
        return transaksiRepository.save(transaksi);
    }

    // DELETE transaksi - kembalikan stok jika sudah paid
    @Transactional
    public void deleteTransaksi(Long id) {
        Transaksi transaksi = getTransaksiById(id);

        // Kembalikan stok jika transaksi dihapus dan sudah paid
        if (transaksi.getDetails() != null && transaksi.getPaymentStatus() == Transaksi.PaymentStatus.PAID) {
            restoreProductStock(transaksi.getDetails());
        }

        transaksiRepository.delete(transaksi);
    }

    // FIND by payment gateway ID
    public Optional<Transaksi> findByPaymentGatewayId(String paymentGatewayId) {
        return transaksiRepository.findByPaymentGatewayId(paymentGatewayId);
    }

    public void updateOldTransactionsWithKasirName() {
        List<Transaksi> allTransactions = transaksiRepository.findAll();

        for (Transaksi transaksi : allTransactions) {
            if (transaksi.getKasirName() == null && transaksi.getAkun() != null) {
                transaksi.setKasirName(transaksi.getAkun().getUsername());
                transaksiRepository.save(transaksi);
                System.out.println("Updated transaction " + transaksi.getIdTransaksi() +
                        " with kasir: " + transaksi.getAkun().getUsername());
            }
        }
    }

    private String generateReferenceNumber() {
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String random = String.format("%03d", new Random().nextInt(1000));
        return "TRX-" + date + "-" + random;
    }

    /**
     * CREATE stock purchase - HANYA sebagai pengeluaran, BUKAN transaksi
     */
    public Keuangan createStockPurchase(StockPurchaseRequest request) {
        System.out.println("🛒 Creating stock purchase (PENGELUARAN only): " + request);

        Akun akun = akunRepository.findById(request.getAkunId())
                .orElseThrow(() -> {
                    System.out.println("❌ Akun tidak ditemukan: " + request.getAkunId());
                    return new RuntimeException("Akun tidak ditemukan dengan ID: " + request.getAkunId());
                });

        System.out.println("✅ Akun ditemukan: " + akun.getUsername());

        Keuangan keuangan = new Keuangan();
        keuangan.setJenis(Keuangan.JenisTransaksi.PENGELUARAN);

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

        return savedKeuangan;
    }
}