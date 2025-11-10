package com.traitor.ambatushop_10.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PageController {

    // Root path redirect to login
    @GetMapping("/")
    public String root() {
        return "forward:/login.html";
    }

    // Login page
    @GetMapping("/login")
    public String login() {
        return "forward:/login.html";
    }

    // Admin Pages
    @GetMapping({"/admin", "/admin/dashboard"})
    public String adminDashboard() {
        return "forward:/beranda_admin.html";
    }

    @GetMapping("/admin/keuangan")
    public String adminKeuangan() {
        return "forward:/admin_keuangan.html";
    }

    @GetMapping("/admin/stok")
    public String adminStok() {
        return "forward:/admin_stok.html";
    }

    @GetMapping("/admin/pengguna")
    public String adminPengguna() {
        return "forward:/admin_pengguna.html";
    }

    // Manager Pages 
    @GetMapping({"/manager", "/manager/dashboard", "/manajer", "/manajer/dashboard"})
    public String managerDashboard() {
        return "forward:/manajer_dashboard.html"; 
    }

    @GetMapping({"/manager/keuangan", "/manajer/keuangan"})
    public String managerKeuangan() {
        return "forward:/manajer_keuangan.html";
    }

    @GetMapping({"/manager/stok", "/manajer/stok"})
    public String managerStok() {
        return "forward:/manajer_stok.html";
    }

    @GetMapping({"/manager/pengguna", "/manajer/pengguna"})
    public String managerPengguna() {
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
