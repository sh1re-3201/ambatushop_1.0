package com.traitor.ambatushop_10.service;

import com.traitor.ambatushop_10.model.Produk;
import com.traitor.ambatushop_10.model.Transaksi;
import com.traitor.ambatushop_10.model.Transaksi.PaymentStatus;
import com.traitor.ambatushop_10.model.TransaksiDetail;
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
    private final ProdukService produkService;

    public TransaksiService(TransaksiRepository transaksiRepository, ProdukService produkService) {
        this.transaksiRepository = transaksiRepository;
        this.produkService = produkService;
    }

    public Transaksi createTransaksi(Transaksi transaksi) {
        // Validasi stok sebelum transaksi
        validateStockAvailability(transaksi.getDetails());
        
        // Kurangi stok produk
        updateProductStock(transaksi.getDetails(), false); // false = reduce stock
        
        // Generate reference number jika belum ada
        if (transaksi.getReferenceNumber() == null) {
            transaksi.setReferenceNumber(generateReferenceNumber());
        }
        
        return transaksiRepository.save(transaksi);
    }
    
    private void validateStockAvailability(List<TransaksiDetail> details) {
        for (TransaksiDetail detail : details) {
            Produk produk = produkService.getProdukById(detail.getProdukId().getIdProduk());
            if (produk.getStok() < detail.getJumlah()) {
                throw new RuntimeException(
                    "Stok " + produk.getNamaProduk() + " tidak mencukupi. " +
                    "Stok tersedia: " + produk.getStok() + ", diminta: " + detail.getJumlah()
                );
            }
        }
    }
    
    private void updateProductStock(List<TransaksiDetail> details, boolean restore) {
        for (TransaksiDetail detail : details) {
            Produk produk = produkService.getProdukById(detail.getProdukId().getIdProduk());
            short stockChange = (short) (restore ? detail.getJumlah() : -detail.getJumlah());
            produk.setStok((short) (produk.getStok() + stockChange));
            produkService.updateProduk(produk.getIdProduk(), produk);
        }
    }
    
    public Transaksi updatePaymentStatus(String paymentGatewayId, PaymentStatus status) {
        Transaksi transaksi = transaksiRepository.findByPaymentGatewayId(paymentGatewayId)
                .orElseThrow(() -> new RuntimeException("Transaksi tidak ditemukan"));
        
        transaksi.setPaymentStatus(status);
        return transaksiRepository.save(transaksi);
    }
    
    public Optional<Transaksi> findByPaymentGatewayId(String paymentGatewayId) {
        return transaksiRepository.findByPaymentGatewayId(paymentGatewayId);
    }
    
    private String generateReferenceNumber() {
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String random = String.format("%03d", new Random().nextInt(1000));
        return "TRX-" + date + "-" + random;
    }
}