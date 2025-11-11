package com.traitor.ambatushop_10.controller;

import com.traitor.ambatushop_10.model.Keuangan;
import com.traitor.ambatushop_10.service.KeuanganService;
import lombok.AllArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/keuangan")
@AllArgsConstructor
public class KeuanganController {

    private final KeuanganService keuanganService;

    @GetMapping
    @PreAuthorize("hasAnyRole('MANAJER', 'ADMIN')")
    public List<Keuangan> getAllKeuangan() {
        return keuanganService.getAllKeuangan();
    }

    @PostMapping
    @PreAuthorize("hasRole('MANAJER')")
    public Keuangan createKeuangan(Keuangan keuangan) {
        return keuanganService.createKeuangan(keuangan);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAJER', 'ADMIN')")
    public Keuangan getKeuanganById(@PathVariable long id) {
        return keuanganService.getKeuanganById(id);
    }
}
