package com.traitor.ambatushop_10.controller;

import com.traitor.ambatushop_10.model.Transaksi;
import com.traitor.ambatushop_10.service.TransaksiService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transaksi")
public class TransaksiController {

    private final TransaksiService transaksiService;

    public TransaksiController(TransaksiService transaksiService) {
        this.transaksiService = transaksiService;
    }

    // @PostMapping
    // @PreAuthorize("hasAnyRole('KASIR')")
    // public Transaksi createTransaksi(@RequestBody Transaksi transaksi) {
    //     return transaksiService.createTransakksi(transaksi);
    // }

    // @GetMapping
    // @PreAuthorize("hasAnyRole('KASIR','MANAJER')")
    // public List<Transaksi> getTransaksi() {
    //     return transaksiService.getAllTransaksi();
    // }

    // @DeleteMapping
    // @PreAuthorize("hasAnyRole('ADMIN')")
    // public String deleteTransaksi(@PathVariable long id) {
    //     transaksiService.deleteTransakksi(id);
    //     return "Transaksi Berhasil dihapus";
    // }
}
