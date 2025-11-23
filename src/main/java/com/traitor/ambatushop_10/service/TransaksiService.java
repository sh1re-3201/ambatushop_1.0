package com.traitor.ambatushop_10.service;

import com.traitor.ambatushop_10.dto.TransaksiDetailRequest;
import com.traitor.ambatushop_10.dto.TransaksiRequest;
import com.traitor.ambatushop_10.model.Akun;
import com.traitor.ambatushop_10.model.Produk;
import com.traitor.ambatushop_10.model.Transaksi;
import com.traitor.ambatushop_10.model.TransaksiDetail;
import com.traitor.ambatushop_10.repository.AkunRepository;
import com.traitor.ambatushop_10.repository.ProdukRepository;
import com.traitor.ambatushop_10.repository.TransaksiRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Random;

@Service
public class TransaksiService {

    private final TransaksiRepository transaksiRepository;
    private final ProdukRepository produkRepository;
    private final AkunRepository akunRepository;

    public TransaksiService(TransaksiRepository transaksiRepository,
            ProdukRepository produkRepository,
            AkunRepository akunRepository) {
        this.transaksiRepository = transaksiRepository;
        this.produkRepository = produkRepository;
        this.akunRepository = akunRepository;
    }

    public List<Transaksi> getAllTransaksi() {
        return transaksiRepository.findAll();
    }

    public Transaksi getTransaksiById(Long id) {
        return transaksiRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaksi tidak ditemukan dengan ID: " + id));
    }

    public Transaksi createTransaksi(TransaksiRequest request) {
        // Validasi akun exists
        Akun akun = akunRepository.findById(request.getAkunId())
                .orElseThrow(() -> new RuntimeException("Akun tidak ditemukan dengan ID: " + request.getAkunId()));

        Transaksi.MetodePembayaran metodePembayaran;
        try {
            metodePembayaran = Transaksi.MetodePembayaran.valueOf(request.getMetodePembayaran().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Metode pembayaran tidak valid: " + request.getMetodePembayaran());
        }

        // Create transaksi entity
        Transaksi transaksi = new Transaksi();
        transaksi.setMetode_pembayaran(metodePembayaran);
        transaksi.setTotal(request.getTotal());
        transaksi.setAkun(akun);
        transaksi.setPaymentStatus(Transaksi.PaymentStatus.PENDING);
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

    private List<TransaksiDetail> createTransaksiDetails(List<TransaksiDetailRequest> detailRequests, Transaksi transaksi) {
        return detailRequests.stream().map(detailReq -> {
            Produk produk = produkRepository.findById(detailReq.getProdukId())
                    .orElseThrow(() -> new RuntimeException("Produk tidak ditemukan dengan ID: " + detailReq.getProdukId()));

            TransaksiDetail detail = new TransaksiDetail();
            detail.setTransaksi(transaksi);
            detail.setProdukId(produk); 
            detail.setJumlah(detailReq.getJumlah());
            detail.setHargaSatuan(detailReq.getHargaSatuan());
            detail.setSubtotal(detailReq.getSubtotal());
            
            return detail;
        }).toList();
    }

    public void deleteTransaksi(Long id) {
        Transaksi transaksi = getTransaksiById(id);

        // Kembalikan stok jika transaksi dihapus
        if (transaksi.getDetails() != null) {
            updateProductStockFromEntity(transaksi.getDetails(), true);
        }

        transaksiRepository.delete(transaksi);
    }

    private void validateStockAvailability(List<TransaksiDetailRequest> details) {
        for (TransaksiDetailRequest detail : details) {
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

    //  Update stok dari DTO
    private void updateProductStock(List<TransaksiDetailRequest> details, boolean restore) {
        for (TransaksiDetailRequest detail : details) {
            Produk produk = produkRepository.findById(detail.getProdukId())
                    .orElseThrow(() -> new RuntimeException("Produk tidak ditemukan"));

            short stockChange = (short) (restore ? detail.getJumlah() : -detail.getJumlah());
            produk.setStok((short) (produk.getStok() + stockChange));
            produkRepository.save(produk);
        }
    }

    // Update stok dari Entity (untuk delete)
    private void updateProductStockFromEntity(List<TransaksiDetail> details, boolean restore) {
        for (TransaksiDetail detail : details) {
            Produk produk = detail.getProdukId();
            short stockChange = (short) (restore ? detail.getJumlah() : -detail.getJumlah());
            produk.setStok((short) (produk.getStok() + stockChange));
            produkRepository.save(produk);
        }
    }

    // Update payment status untuk Midtrans webhook
    public Transaksi updatePaymentStatus(String paymentGatewayId, Transaksi.PaymentStatus status) {
        Transaksi transaksi = transaksiRepository.findByPaymentGatewayId(paymentGatewayId)
                .orElseThrow(
                        () -> new RuntimeException("Transaksi tidak ditemukan dengan payment ID: " + paymentGatewayId));

        transaksi.setPaymentStatus(status);
        return transaksiRepository.save(transaksi);
    }

    private String generateReferenceNumber() {
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String random = String.format("%03d", new Random().nextInt(1000));
        return "TRX-" + date + "-" + random;
    }

    // Sementara dikomen dulu aja ini 
    // private Transaksi.MetodePembayaran parseMetodePembayaran(String metode) {
    //     if (metode == null) {
    //         throw new RuntimeException("Metode pembayaran tidak boleh null");
    //     }

    //     switch (metode.toUpperCase()) {
    //         case "TUNAI":
    //             return Transaksi.MetodePembayaran.TUNAI;
    //         case "NON_TUNAI":
    //         case "QRIS":
    //         case "E-WALLET":
    //             return Transaksi.MetodePembayaran.NON_TUNAI;
    //         default:
    //             throw new RuntimeException("Metode pembayaran tidak valid: " + metode +
    //                     ". Gunakan: TUNAI atau NON_TUNAI");
    //     }
    // }
}