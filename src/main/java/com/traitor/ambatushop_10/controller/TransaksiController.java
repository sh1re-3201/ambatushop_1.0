package com.traitor.ambatushop_10.controller;

import com.traitor.ambatushop_10.dto.ErrorResponse;
import com.traitor.ambatushop_10.dto.StockPurchaseRequest;
import com.traitor.ambatushop_10.dto.TransaksiRequest;
import com.traitor.ambatushop_10.dto.TransaksiResponse;
import com.traitor.ambatushop_10.model.Keuangan;
import com.traitor.ambatushop_10.model.Transaksi;
import com.traitor.ambatushop_10.service.TransaksiService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transaksi")
@RequiredArgsConstructor
@Slf4j
public class TransaksiController {

    private final TransaksiService transaksiService;

    @GetMapping
    @PreAuthorize("hasAnyRole('KASIR','MANAJER','ADMIN')")
    public ResponseEntity<?> getAllTransaksi() {
        try {
            List<Transaksi> transaksis = transaksiService.getAllTransaksi();

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

    // CREATE transaksi
    @PostMapping
    @PreAuthorize("hasAnyRole('KASIR')")
    public ResponseEntity<?> createTransaksi(@RequestBody TransaksiRequest request) {
        try {
            // Validasi metode pembayaran
            if (!isValidPaymentMethod(request.getMetodePembayaran())) {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse(400, "INVALID_PAYMENT_METHOD",
                                "Metode pembayaran tidak valid",
                                "Gunakan: TUNAI atau NON_TUNAI",
                                "/api/transaksi"));
            }

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

    // Helper method untuk validasi payment method
    private boolean isValidPaymentMethod(String metode) {
        return "TUNAI".equalsIgnoreCase(metode) || "NON_TUNAI".equalsIgnoreCase(metode);
    }

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

    /**
     * Endpoint untuk pembelian stok
     */
    @PostMapping("/stock-purchase")
    @PreAuthorize("hasAnyRole('MANAJER', 'ADMIN')")
    public ResponseEntity<?> createStockPurchase(@RequestBody StockPurchaseRequest request) {
        try {
            // Validasi input
            if (request.getAkunId() == null) {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse(400, "VALIDATION_ERROR", "Akun ID tidak boleh kosong",
                                "Field 'akunId' required", "/api/transaksi/stock-purchase"));
            }

            if (request.getProductName() == null || request.getProductName().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse(400, "VALIDATION_ERROR", "Nama produk tidak boleh kosong",
                                "Field 'productName' required", "/api/transaksi/stock-purchase"));
            }

            if (request.getTotalAmount() == null || request.getTotalAmount() <= 0) {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse(400, "VALIDATION_ERROR", "Total amount harus lebih dari 0",
                                "Field 'totalAmount' harus > 0", "/api/transaksi/stock-purchase"));
            }

            Keuangan keuangan = transaksiService.createStockPurchase(request);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Pembelian stok berhasil dicatat sebagai pengeluaran");
            response.put("keuangan", keuangan);
            response.put("type", "PENGELUARAN");

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse(400, "VALIDATION_ERROR", "Data pembelian tidak valid",
                            e.getMessage(), "/api/transaksi/stock-purchase"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse(500, "SERVER_ERROR", "Gagal mencatat pembelian stok",
                            e.getMessage(), "/api/transaksi/stock-purchase"));
        }
    }

    /**
     * Konfirmasi pembayaran tunai
     */
    @PostMapping("/{id}/confirm-cash")
    @PreAuthorize("hasAnyRole('KASIR')")
    public ResponseEntity<?> confirmCashPayment(@PathVariable Long id) {
        try {
            log.info("💰 Konfirmasi pembayaran tunai untuk transaksi: {}", id);

            // Cek apakah transaksi ada
            Transaksi transaksi = transaksiService.getTransaksiById(id);
            log.info("✅ Transaksi ditemukan: {}, Status: {}, Metode: {}",
                    transaksi.getReferenceNumber(),
                    transaksi.getPaymentStatus(),
                    transaksi.getMetode_pembayaran());

            // Validasi: hanya transaksi TUNAI yang bisa dikonfirmasi
            if (transaksi.getMetode_pembayaran() != Transaksi.MetodePembayaran.TUNAI) {
                log.error("❌ Bukan transaksi tunai: {}", transaksi.getMetode_pembayaran());
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse(400, "INVALID_METHOD",
                                "Bukan transaksi tunai",
                                "Hanya transaksi TUNAI yang bisa dikonfirmasi",
                                "/api/transaksi/" + id + "/confirm-cash"));
            }

            // Validasi: hanya transaksi PENDING yang bisa dikonfirmasi
            if (transaksi.getPaymentStatus() != Transaksi.PaymentStatus.PENDING) {
                log.error("❌ Status bukan PENDING: {}", transaksi.getPaymentStatus());
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse(400, "INVALID_STATUS",
                                "Transaksi sudah diproses",
                                "Status transaksi: " + transaksi.getPaymentStatus(),
                                "/api/transaksi/" + id + "/confirm-cash"));
            }

            // Konfirmasi pembayaran
            Transaksi confirmedTransaksi = transaksiService.confirmCashPayment(id);

            log.info("✅ Pembayaran tunai berhasil dikonfirmasi: {}, Status baru: {}",
                    id, confirmedTransaksi.getPaymentStatus());

            // Return response yang lebih informative
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Pembayaran tunai berhasil dikonfirmasi");
            response.put("transaction", new TransaksiResponse(confirmedTransaksi));
            response.put("status", confirmedTransaksi.getPaymentStatus().name());
            response.put("referenceNumber", confirmedTransaksi.getReferenceNumber());

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            log.error("❌ Error konfirmasi pembayaran tunai: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(400, "PAYMENT_ERROR", "Gagal mengkonfirmasi pembayaran",
                            e.getMessage(), "/api/transaksi/" + id + "/confirm-cash"));
        } catch (Exception e) {
            log.error("❌ Unexpected error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse(500, "SERVER_ERROR", "Error sistem",
                            e.getMessage(), "/api/transaksi/" + id + "/confirm-cash"));
        }
    }

    /**
     * Update payment status (untuk webhook atau manual)
     */
    @PutMapping("/{id}/payment-status")
    @PreAuthorize("hasAnyRole('KASIR', 'MANAJER', 'ADMIN')")
    public ResponseEntity<?> updatePaymentStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        try {
            log.info("🔄 Update payment status untuk transaksi {}: {}", id, status);

            Transaksi.PaymentStatus paymentStatus;
            try {
                paymentStatus = Transaksi.PaymentStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse(400, "INVALID_STATUS",
                                "Status tidak valid",
                                "Gunakan: PENDING, PAID, FAILED, EXPIRED",
                                "/api/transaksi/" + id + "/payment-status"));
            }

            Transaksi transaksi = transaksiService.updatePaymentStatus(id, paymentStatus);

            log.info("✅ Status pembayaran diupdate: {} -> {}", id, status);

            return ResponseEntity.ok(new TransaksiResponse(transaksi));

        } catch (RuntimeException e) {
            log.error("❌ Error update payment status: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(400, "UPDATE_ERROR", "Gagal update status",
                            e.getMessage(), "/api/transaksi/" + id + "/payment-status"));
        } catch (Exception e) {
            log.error("❌ Unexpected error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse(500, "SERVER_ERROR", "Error sistem",
                            e.getMessage(), "/api/transaksi/" + id + "/payment-status"));
        }
    }

    /**
     * Cek stok produk untuk transaksi
     */
    @GetMapping("/{id}/check-stock")
    @PreAuthorize("hasAnyRole('KASIR', 'MANAJER', 'ADMIN')")
    public ResponseEntity<?> checkStockAvailability(@PathVariable Long id) {
        try {
            log.info("📦 Cek stok untuk transaksi: {}", id);

            Transaksi transaksi = transaksiService.getTransaksiById(id);

            if (transaksi.getDetails() == null || transaksi.getDetails().isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("available", true);
                response.put("message", "Transaksi tidak memiliki item");
                response.put("transactionId", id);
                return ResponseEntity.ok(response);
            }

            final boolean[] allInStock = { true }; // Gunakan array untuk mutable reference
            StringBuilder stockInfo = new StringBuilder();

            for (var detail : transaksi.getDetails()) {
                var produk = detail.getProdukId();
                stockInfo.append(String.format("%s: %d/%d\n",
                        produk.getNamaProduk(),
                        detail.getJumlah(),
                        produk.getStok()));

                if (produk.getStok() < detail.getJumlah()) {
                    allInStock[0] = false;
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("available", allInStock[0]);
            response.put("stockDetails", stockInfo.toString());
            response.put("transactionId", id);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ Error cek stok: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse(500, "SERVER_ERROR", "Gagal cek stok",
                            e.getMessage(), "/api/transaksi/" + id + "/check-stock"));
        }
    }
}