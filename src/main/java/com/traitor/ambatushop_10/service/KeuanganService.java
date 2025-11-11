package com.traitor.ambatushop_10.service;

import com.traitor.ambatushop_10.model.Keuangan;
import com.traitor.ambatushop_10.repository.KeuanganRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service @AllArgsConstructor
public class KeuanganService {

    private final KeuanganRepository keuanganRepository;

    // Get all stored keuangan data
    public List<Keuangan> getAllKeuangan() {
        return keuanganRepository.findAll();
    }

//    public Keuangan createKeuangan(Keuangan keuangan) {
//
//    }
}
