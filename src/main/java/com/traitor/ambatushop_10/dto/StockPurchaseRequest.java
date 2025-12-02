package com.traitor.ambatushop_10.dto;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class StockPurchaseRequest {
    private Long akunId;
    private String productName;
    private Double totalAmount;
    private String supplierName; // optional
    private String notes; // optional

    // Constructor kosong (untuk deserialization JSON)
    public StockPurchaseRequest() {}

    // Constructor dengan parameter
    public StockPurchaseRequest(Long akunId, String productName, Double totalAmount, 
                                String supplierName, String notes) {
        this.akunId = akunId;
        this.productName = productName;
        this.totalAmount = totalAmount;
        this.supplierName = supplierName;
        this.notes = notes;
    }
}