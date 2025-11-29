package com.traitor.ambatushop_10.controller;

import com.traitor.ambatushop_10.dto.ErrorResponse;
import com.traitor.ambatushop_10.model.Transaksi;
import com.traitor.ambatushop_10.service.MidtransService;
import com.traitor.ambatushop_10.service.TransaksiService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@Slf4j
public class PaymentController {

    private final MidtransService midtransService;
    private final TransaksiService transaksiService;

    public PaymentController(MidtransService midtransService, TransaksiService transaksiService) {
        this.midtransService = midtransService;
        this.transaksiService = transaksiService;
    }

    /**
     * Create QRIS Payment for existing transaction
     */
    @PostMapping("/qris/{transactionId}")
    @PreAuthorize("hasAnyRole('KASIR')")
    public ResponseEntity<?> createQRISPayment(@PathVariable Long transactionId) {
        try {
            log.info("Creating QRIS payment for transaction: {}", transactionId);
            
            Transaksi transaksi = transaksiService.getTransaksiById(transactionId);
            
            // Validasi: hanya transaksi NON_TUNAI yang bisa pakai QRIS
            if (transaksi.getMetode_pembayaran() != Transaksi.MetodePembayaran.NON_TUNAI) {
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse(400, "INVALID_PAYMENT_METHOD", 
                          "Metode pembayaran tidak support QRIS", 
                          "Hanya NON_TUNAI yang support QRIS",
                          "/api/payment/qris/" + transactionId));
            }
            
            // Validasi: hanya transaksi PENDING yang bisa create payment
            if (transaksi.getPaymentStatus() != Transaksi.PaymentStatus.PENDING) {
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse(400, "INVALID_STATUS", 
                          "Transaksi sudah diproses", 
                          "Status transaksi: " + transaksi.getPaymentStatus(),
                          "/api/payment/qris/" + transactionId));
            }
            
            Map<String, String> paymentData = midtransService.createQRISPayment(transaksi);
            log.info("QRIS payment created successfully for transaction: {}", transactionId);
            
            return ResponseEntity.ok(paymentData);
            
        } catch (RuntimeException e) {
            log.error("Error creating QRIS payment for transaction {}: {}", transactionId, e.getMessage());
            return ResponseEntity.badRequest()
                .body(new ErrorResponse(400, "PAYMENT_ERROR", "Gagal membuat pembayaran QRIS", 
                      e.getMessage(), "/api/payment/qris/" + transactionId));
        } catch (Exception e) {
            log.error("Unexpected error creating QRIS payment for transaction {}: {}", transactionId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse(500, "SERVER_ERROR", "Error sistem pembayaran", 
                      e.getMessage(), "/api/payment/qris/" + transactionId));
        }
    }

    /**
     * Midtrans webhook endpoint - untuk receive payment status updates
     * NOTE: Ini public endpoint, Midtrans akan POST ke sini
     */
    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(@RequestBody Map<String, Object> payload) {
        try {
            log.info("Received Midtrans webhook notification");
            log.debug("Webhook payload: {}", payload);
            
            midtransService.handleWebhookNotification(payload);
            
            log.info("Webhook processed successfully");
            return ResponseEntity.ok("OK");
            
        } catch (RuntimeException e) {
            log.error("Webhook processing failed: {}", e.getMessage());
            // Tetap return 200 ke Midtrans, karena mereka expect 200
            return ResponseEntity.ok("OK");
        } catch (Exception e) {
            log.error("Unexpected error in webhook: {}", e.getMessage(), e);
            // Tetap return 200 ke Midtrans
            return ResponseEntity.ok("OK");
        }
    }

    /**
     * Check payment status manually (untuk frontend polling)
     */
    @GetMapping("/status/{orderId}")
    @PreAuthorize("hasAnyRole('KASIR', 'MANAJER', 'ADMIN')")
    public ResponseEntity<?> checkPaymentStatus(@PathVariable String orderId) {
        try {
            log.info("Checking payment status for order: {}", orderId);
            
            Map<String, Object> status = midtransService.checkPaymentStatus(orderId);
            
            return ResponseEntity.ok(status);
            
        } catch (RuntimeException e) {
            log.error("Error checking payment status for order {}: {}", orderId, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse(404, "NOT_FOUND", "Transaksi tidak ditemukan", 
                      e.getMessage(), "/api/payment/status/" + orderId));
        } catch (Exception e) {
            log.error("Unexpected error checking payment status for order {}: {}", orderId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse(500, "SERVER_ERROR", "Gagal memeriksa status pembayaran", 
                      e.getMessage(), "/api/payment/status/" + orderId));
        }
    }

    /**
     * Get all transactions with payment status (untuk monitoring)
     */
    @GetMapping("/transactions")
    @PreAuthorize("hasAnyRole('MANAJER', 'ADMIN')")
    public ResponseEntity<?> getAllPaymentTransactions() {
        try {
            var transactions = transaksiService.getAllTransaksi().stream()
                .map(t -> Map.of(
                    "id", t.getIdTransaksi(),
                    "referenceNumber", t.getReferenceNumber(),
                    "total", t.getTotal(),
                    "paymentStatus", t.getPaymentStatus(),
                    "paymentGatewayId", t.getPaymentGatewayId(),
                    "paymentMethod", t.getMetode_pembayaran(),
                    "createdAt", t.getTanggal()
                ))
                .toList();
            
            return ResponseEntity.ok(transactions);
            
        } catch (Exception e) {
            log.error("Error getting payment transactions: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse(500, "SERVER_ERROR", "Gagal mengambil data transaksi", 
                      e.getMessage(), "/api/payment/transactions"));
        }
    }
}