package com.traitor.ambatushop_10.controller;

import com.traitor.ambatushop_10.model.TransaksiDetail;
import com.traitor.ambatushop_10.repository.TransaksiDetailRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class TransaksiDetailController {

    private final TransaksiDetailRepository transaksiDetailRepository;

    public TransaksiDetailController(TransaksiDetailRepository transaksiDetailRepository) {
        this.transaksiDetailRepository = transaksiDetailRepository;
    }

    @GetMapping("/transaksi-detail")
    public List<TransaksiDetail> getTransaksiDetail() {
        return transaksiDetailRepository.findAll(); // menampilkan data dari database dengan format JSON
    }
}
