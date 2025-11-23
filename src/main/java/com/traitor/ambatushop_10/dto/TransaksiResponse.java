package com.traitor.ambatushop_10.dto;

import com.traitor.ambatushop_10.model.Transaksi;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter
public class TransaksiResponse {
    private Long idTransaksi;
    private String referenceNumber;
    private LocalDateTime tanggal;
    private Double total;
    private String metodePembayaran;
    private String paymentStatus;
    private String namaKasir;
    private List<TransaksiDetailResponse> details;
    
    // Constructor dari Entity
    public TransaksiResponse(Transaksi transaksi) {
        this.idTransaksi = transaksi.getIdTransaksi();
        this.referenceNumber = transaksi.getReferenceNumber();
        this.tanggal = transaksi.getTanggal();
        this.total = transaksi.getTotal();
        this.metodePembayaran = transaksi.getMetode_pembayaran().name();
        this.paymentStatus = transaksi.getPaymentStatus().name();
        this.namaKasir = transaksi.getAkun().getUsername();
        
        if (transaksi.getDetails() != null) {
            this.details = transaksi.getDetails().stream()
                .map(TransaksiDetailResponse::new)
                .toList();
        }
    }
}

@Getter @Setter
class TransaksiDetailResponse {
    private String namaProduk;
    private short jumlah;
    private double hargaSatuan;
    private double subtotal;
    
    public TransaksiDetailResponse(com.traitor.ambatushop_10.model.TransaksiDetail detail) {
        this.namaProduk = detail.getProdukId().getNamaProduk();
        this.jumlah = detail.getJumlah();
        this.hargaSatuan = detail.getHargaSatuan();
        this.subtotal = detail.getSubtotal();
    }
}