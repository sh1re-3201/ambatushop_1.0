package com.traitor.ambatushop_10.controller;

import com.traitor.ambatushop_10.model.Akun;
import com.traitor.ambatushop_10.repository.AkunRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class AkunController {

    private final AkunRepository akunRepository;

    public AkunController(AkunRepository akunRepository) {
        this.akunRepository = akunRepository;
    }

    @GetMapping("/akun")
    public List<Akun> getAkun() {
        return akunRepository.findAll(); // menampilkan data dari database dengan format JSON
    }
}
