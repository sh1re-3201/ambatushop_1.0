package com.traitor.ambatushop_10.controller;

import com.traitor.ambatushop_10.dto.ErrorResponse;
import com.traitor.ambatushop_10.dto.StockPurchaseRequest;
import com.traitor.ambatushop_10.dto.TransaksiRequest;
import com.traitor.ambatushop_10.dto.TransaksiResponse;
import com.traitor.ambatushop_10.model.Transaksi;
import com.traitor.ambatushop_10.service.TransaksiService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transaksi")
public class TransaksiController {

    private final TransaksiService transaksiService;

    public TransaksiController(TransaksiService transaksiService) {
        this.transaksiService = transaksiService;
    }

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

    // CREATE transaksi - SUDAH SUPPORT NON_TUNAI,harusnya
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
     * Endpoint untuk pembelian stok (pengeluaran)
     */
    @PostMapping("/stock-purchase")
    @PreAuthorize("hasAnyRole('MANAJER', 'ADMIN')")
    public ResponseEntity<?> createStockPurchase(@RequestBody StockPurchaseRequest request) { // GANTI TYPE
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

            Transaksi transaksi = transaksiService.createStockPurchase(request);

            // Return response khusus
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Pembelian stok berhasil dicatat sebagai pengeluaran");
            response.put("transaksi", new TransaksiResponse(transaksi));

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

}
