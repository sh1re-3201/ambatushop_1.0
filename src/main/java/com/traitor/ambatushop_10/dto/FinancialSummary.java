package com.traitor.ambatushop_10.dto;

// ===== DTO UNTUK RESPONSE =====
public class FinancialSummary {
    private double totalPemasukan;
    private double totalPengeluaran;
    private int totalRecords;

    public FinancialSummary(double totalPemasukan, double totalPengeluaran, int totalRecords) {
        this.totalPemasukan = totalPemasukan;
        this.totalPengeluaran = totalPengeluaran;
        this.totalRecords = totalRecords;
    }

    // Getters
    public double getTotalPemasukan() {
        return totalPemasukan;
    }

    public double getTotalPengeluaran() {
        return totalPengeluaran;
    }

    public int getTotalRecords() {
        return totalRecords;
    }
}