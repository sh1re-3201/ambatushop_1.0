package com.traitor.ambatushop_10.service;

import com.traitor.ambatushop_10.model.Transaksi;
import com.traitor.ambatushop_10.repository.TransaksiRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TransaksiService {

    private final TransaksiRepository transaksiRepository;

    public TransaksiService(TransaksiRepository transaksiRepository) {
        this.transaksiRepository = transaksiRepository;
    }

    // GET all trans
    public List<Transaksi> getAllTransaksi() {
        return transaksiRepository.findAll();
    }

    // GET trans by ID
    protected Transaksi getTransaksiById(long id) {
        return transaksiRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaksi tidak ditemukan dengan ID: " + id));
    }

    // CREATE akun
    public Transaksi createTransakksi(Transaksi transaksi) {
        // Validasi
//        if (transaksi.getIdTransaksi() == null || transaksi.getIdTransaksi() == 0) {
//            throw new RuntimeException("ID Transaksi kosong");
//        }
//        if (transaksi.getTanggal() == null) {
//            throw new RuntimeException("Tanggal tidak boleh kosong");
//        }
        return transaksiRepository.save(transaksi);
    }

    public void deleteTransakksi(long id) {
        Transaksi transaksi = getTransaksiById(id);
        transaksiRepository.delete(transaksi);
    }

//    public Transaksi updateTransaksi (long id, Transaksi transaksiUpdate) {
//        Transaksi existingTransaksi = getTransaksiById(id);
//
//        if (transaksiUpdate)
//    }

//    public List<Transaksi> searchTransaksi(long keyword) {
//        return transaksiRepository.findById(keyword);
//    }
}
