package com.traitor.ambatushop_10.controller;

import com.traitor.ambatushop_10.model.Transaksi;
import com.traitor.ambatushop_10.repository.TransaksiRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class TransaksiController {

    private final TransaksiRepository transaksiRepository;

    public TransaksiController(TransaksiRepository transaksiRepository) {
        this.transaksiRepository = transaksiRepository;
    }

    @GetMapping("/transaksi")
    public List<Transaksi> getTransaksi() {
        return transaksiRepository.findAll(); // menampilkan data dari database dengan format JSON
    }
}
