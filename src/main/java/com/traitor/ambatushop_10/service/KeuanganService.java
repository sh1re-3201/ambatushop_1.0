package com.traitor.ambatushop_10.service;

import com.traitor.ambatushop_10.model.Keuangan;
import com.traitor.ambatushop_10.repository.KeuanganRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class KeuanganService {

    private final KeuanganRepository keuanganRepository;

    // Get all stored keuangan data
    public List<Keuangan> getAllKeuangan() {
        return keuanganRepository.findAll();
    }

    public Keuangan createKeuangan(Keuangan keuangan) {
        if (keuangan.getKeterangan() == null || keuangan.getKeterangan().trim().isEmpty()) {
            throw new RuntimeException("Keterangan tidak boleh kosong");
        }
        return keuanganRepository.save(keuangan);
    }

    public Keuangan getKeuanganById(long id) {
        return keuanganRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Data keuangan dengan ID: " + id + " tidak ditemukan"));
    }

    public List<Keuangan> getByJenis(Keuangan.JenisTransaksi jenis) {
        return keuanganRepository.findByJenis(jenis);
    }

    public Double getTotalByJenis(Keuangan.JenisTransaksi jenis) {
        return keuanganRepository.findByJenis(jenis).stream()
                .mapToDouble(Keuangan::getNominal)
                .sum();
    }

    public void deleteKeuangan(long id) {
        Keuangan keuangan = getKeuanganById(id);
        keuanganRepository.delete(keuangan);
    }
}
