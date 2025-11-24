package com.traitor.ambatushop_10.service;

import com.midtrans.Config;
import com.midtrans.httpclient.SnapApi;
import com.midtrans.httpclient.error.MidtransError;
import com.traitor.ambatushop_10.model.Transaksi;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
public class MidtransService {

    private final TransaksiService transaksiService;

    @Value("${midtrans.server.key:SB-Mid-server-your-key}")
    private String serverKey;

    @Value("${midtrans.client.key:SB-Mid-client-your-key}") 
    private String clientKey;

    @Value("${midtrans.is.production:false}")
    private boolean isProduction;

    public MidtransService(TransaksiService transaksiService) {
        this.transaksiService = transaksiService;
    }

    /**
     * Create QRIS Payment via Midtrans
     */
    public Map<String, String> createQRISPayment(Transaksi transaksi) {
        try {
            // Generate unique order ID
            String orderId = "AMBATU-" + transaksi.getIdTransaksi() + "-" + 
                           UUID.randomUUID().toString().substring(0, 8);
            
            Map<String, Object> params = new HashMap<>();
            
            // Transaction details
            Map<String, Object> transactionDetails = new HashMap<>();
            transactionDetails.put("order_id", orderId);
            transactionDetails.put("gross_amount", transaksi.getTotal());
            
            // Customer details
            Map<String, Object> customerDetails = new HashMap<>();
            customerDetails.put("first_name", "Customer");
            customerDetails.put("email", "customer@ambatushop.com");
            
            params.put("transaction_details", transactionDetails);
            params.put("customer_details", customerDetails);
            params.put("payment_type", "qris");
            
            log.info("Creating QRIS payment - Order: {}, Amount: {}", orderId, transaksi.getTotal());
            
            // ✅ FIXED: Gunakan constructor yang benar
            Config config = new Config(
                serverKey,      // serverKey
                clientKey,      // clientKey  
                isProduction    // isProduction
            );
            
            JSONObject response = SnapApi.createTransaction(params, config);
            
            log.info("Midtrans Response: {}", response.toString(2));
            
            // Update transaction
            transaksi.setPaymentGatewayId(orderId);
            transaksi.setPaymentMethodDetail("QRIS");
            transaksiService.updateTransaksi(transaksi);
            
            // Parse response
            Map<String, String> paymentData = parsePaymentResponse(response);
            paymentData.put("order_id", orderId);
            
            return paymentData;
            
        } catch (MidtransError e) {
            log.error("Midtrans API Error: {}", e.getMessage(), e);
            throw new RuntimeException("Gagal membuat pembayaran QRIS: " + e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error: {}", e.getMessage(), e);
            throw new RuntimeException("Error sistem pembayaran: " + e.getMessage());
        }
    }

    private Map<String, String> parsePaymentResponse(JSONObject response) {
        Map<String, String> paymentData = new HashMap<>();
        
        try {
            // Token dan redirect URL
            if (response.has("token")) {
                paymentData.put("token", response.getString("token"));
            }
            if (response.has("redirect_url")) {
                paymentData.put("payment_url", response.getString("redirect_url"));
            }
            
            // QR Code data
            if (response.has("qr_string")) {
                paymentData.put("qr_string", response.getString("qr_string"));
            }
            if (response.has("actions")) {
                response.getJSONArray("actions").forEach(action -> {
                    JSONObject actionObj = (JSONObject) action;
                    if ("qr-code".equals(actionObj.optString("name")) && 
                        actionObj.has("url")) {
                        paymentData.put("qr_code_url", actionObj.getString("url"));
                    }
                });
            }
            
        } catch (Exception e) {
            log.warn("Error parsing Midtrans response: {}", e.getMessage());
        }
        
        return paymentData;
    }

    public void handleWebhookNotification(Map<String, Object> payload) {
        try {
            log.info("Received Midtrans webhook: {}", payload);
            
            String orderId = (String) payload.get("order_id");
            String transactionStatus = (String) payload.get("transaction_status");
            String fraudStatus = (String) payload.get("fraud_status");
            
            Transaksi transaksi = transaksiService.findByPaymentGatewayId(orderId)
                    .orElseThrow(() -> new RuntimeException("Transaksi tidak ditemukan: " + orderId));
            
            Transaksi.PaymentStatus newStatus = mapMidtransStatus(transactionStatus, fraudStatus);
            transaksi.setPaymentStatus(newStatus);
            transaksi.setPaymentGatewayResponse(new JSONObject(payload).toString());
            
            transaksiService.updateTransaksi(transaksi);
            
            log.info("Updated transaction {} to status: {}", orderId, newStatus);
            
        } catch (Exception e) {
            log.error("Error handling Midtrans webhook: {}", e.getMessage(), e);
            throw new RuntimeException("Gagal memproses notifikasi pembayaran");
        }
    }
    
    private Transaksi.PaymentStatus mapMidtransStatus(String transactionStatus, String fraudStatus) {
        if ("capture".equals(transactionStatus)) {
            return "accept".equals(fraudStatus) ? Transaksi.PaymentStatus.PAID : Transaksi.PaymentStatus.FAILED;
        } else if ("settlement".equals(transactionStatus)) {
            return Transaksi.PaymentStatus.PAID;
        } else if ("pending".equals(transactionStatus)) {
            return Transaksi.PaymentStatus.PENDING;
        } else if ("deny".equals(transactionStatus) || 
                   "cancel".equals(transactionStatus) || 
                   "expire".equals(transactionStatus)) {
            return Transaksi.PaymentStatus.FAILED;
        } else {
            return Transaksi.PaymentStatus.PENDING;
        }
    }
    
    public Map<String, Object> checkPaymentStatus(String orderId) {
        try {
            Transaksi transaksi = transaksiService.findByPaymentGatewayId(orderId)
                    .orElseThrow(() -> new RuntimeException("Transaksi tidak ditemukan"));
            
            Map<String, Object> status = new HashMap<>();
            status.put("order_id", orderId);
            status.put("payment_status", transaksi.getPaymentStatus().name());
            status.put("transaction_id", transaksi.getIdTransaksi());
            status.put("reference_number", transaksi.getReferenceNumber());
            status.put("amount", transaksi.getTotal());
            
            return status;
            
        } catch (Exception e) {
            log.error("Error checking payment status: {}", e.getMessage());
            throw new RuntimeException("Gagal memeriksa status pembayaran");
        }
    }
}