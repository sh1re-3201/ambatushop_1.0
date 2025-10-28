package com.traitor.ambatushop_10.controller;

import com.traitor.ambatushop_10.model.Akun;
import com.traitor.ambatushop_10.service.AkunService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/akun") // Hanya admin yang bisa akses
public class AkunController {

    private final AkunService akunService;

    public AkunController(AkunService akunService) {
        this.akunService = akunService;
    }

    // crud akun untuk admin aja

    // GET semua akun - hanya ADMIN
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<Akun> getAllAkun() {
        return akunService.getAllAkun();
    }

    // GET akun by ID - hanya ADMIN
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Akun getAkunById(@PathVariable Long id) {
        return akunService.getAkunById(id);
    }

    // SEARCH akun - hanya ADMIN
    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    public List<Akun> searchAkun(@RequestParam String keyword) {
        return akunService.searchAkun(keyword);
    }

    // CREATE akun baru - hanya ADMIN
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Akun createAkun(@RequestBody Akun akun) {
        return akunService.createAkun(akun);
    }

    // UPDATE akun - hanya ADMIN
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Akun updateAkun(@PathVariable Long id, @RequestBody Akun akun) {
        return akunService.updateAkun(id, akun);
    }

    // DELETE akun - hanya ADMIN
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public String deleteAkun(@PathVariable Long id) {
        akunService.deleteAkun(id);
        return "Akun berhasil dihapus";
    }
}