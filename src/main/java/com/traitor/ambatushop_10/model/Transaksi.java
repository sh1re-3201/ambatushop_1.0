package com.traitor.ambatushop_10.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Random;

@Entity
@Table(name = "transaksi")
@Getter
@Setter
@NoArgsConstructor
public class Transaksi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long idTransaksi;

    @Column(name = "payment_gateway_id")
    private String paymentGatewayId; // Midtrans order_id/session_id

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false)
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @Column(name = "payment_gateway_response", columnDefinition = "TEXT")
    private String paymentGatewayResponse; // Raw response from Midtrans

    @Column(name = "reference_number", unique = true)
    private String referenceNumber; // No. referensi: TRX-20240115-001

    @Column(name = "payment_method_detail")
    private String paymentMethodDetail; // "QRIS_GOPAY", "QRIS_SHOPEEPAY", dll

    public Transaksi(MetodePembayaran metode_pembayaran, LocalDateTime tanggal, Double total, Akun akun, String kasirName) {
        this.metode_pembayaran = metode_pembayaran;
        this.tanggal = tanggal;
        this.total = total;
        this.akun = akun;
        this.kasirName = kasirName;
        this.paymentStatus = PaymentStatus.PENDING;
        this.referenceNumber = generateReferenceNumber();
    }

    @Column(nullable = false)
    private LocalDateTime tanggal = LocalDateTime.now();

    @Column(name = "kasir_name", length = 100)
    private String kasirName;

    @Column(nullable = false)
    private Double total;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, name = "metode_pembayaran")
    private MetodePembayaran metode_pembayaran; // true = tunai, false = QRIS

    @ManyToOne
    @JoinColumn(name = "akun_id", nullable = false) // Sesuai dengan dbnya, dikita itu base columnnya akun_id di db
                                                    // transaksi liquibase
    private Akun akun; // Menggunakan akun agar nanti dipakainya bukan langsung idPegawad tapi
                       // akundPegawai

    public void setAkunId(Long akunId) {
        this.akun = Akun.ref(akunId);
    }

    // nunjuk ke field transaksi di TransaksiDetail
    @OneToMany(mappedBy = "transaksi", cascade = CascadeType.ALL)
    private List<TransaksiDetail> details;

    // Generate reference number: TRX-YYYYMMDD-XXX_
    private String generateReferenceNumber() {
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String random = String.format("%03d", new Random().nextInt(1000));
        return "TRX-" + date + "-" + random;
    }

    public enum MetodePembayaran {
        TUNAI,
        NON_TUNAI // Untuk QRIS/Midtrans
    }

    public enum PaymentStatus {
        PENDING, // Menunggu pembayaran
        PAID, // Pembayaran sukses
        FAILED, // Pembayaran gagal
        EXPIRED // Kadaluarsa
    }

}
