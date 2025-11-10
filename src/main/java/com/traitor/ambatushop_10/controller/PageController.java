package com.traitor.ambatushop_10.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PageController {

    @GetMapping({"/manager", "/manajer", "/dashboard/manager", "/admin"})
    public String managerDashboard() {
        return "forward:/beranda_admin.html";
    }

    @GetMapping({"/manager/keuangan", "/admin/keuangan"})
    public String keuanganPage() {
        return "forward:/admin_keuangan.html";
    }

    @GetMapping({"/manager/stok", "/admin/stok"})
    public String stokPage() {
        return "forward:/admin_stok.html";
    }

    @GetMapping({"/manager/pengguna", "/admin/pengguna"})
    public String penggunaPage() {
        return "forward:/admin_pengguna.html";
    }

    // Manajer Pages (Read-Only)
    @GetMapping("/manajer/dashboard")
    public String manajerDashboard() {
        return "forward:/manajer_dashboard.html";
    }

    @GetMapping("/manajer/keuangan")
    public String manajerKeuangan() {
        return "forward:/manajer_keuangan.html";
    }

    @GetMapping("/manajer/stok")
    public String manajerStok() {
        return "forward:/manajer_stok.html";
    }

    @GetMapping("/manajer/pengguna")
    public String manajerPengguna() {
        return "forward:/manajer_pengguna.html";
    }

    // Kasir Pages
    @GetMapping({"/kasir", "/kasir/dashboard"})
    public String kasirDashboard() {
        return "forward:/kasir_dashboard.html";
    }

    @GetMapping("/kasir/transaksi")
    public String kasirTransaksi() {
        return "forward:/kasir_transaksi.html";
    }

    @GetMapping("/kasir/keuangan")
    public String kasirKeuangan() {
        return "forward:/kasir_keuangan.html";
    }
}
