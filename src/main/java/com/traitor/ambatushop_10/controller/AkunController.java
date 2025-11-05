package com.traitor.ambatushop_10.controller;

import com.traitor.ambatushop_10.model.Akun;
import com.traitor.ambatushop_10.service.AkunService;
import com.traitor.ambatushop_10.dto.ErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/akun")
public class AkunController {

    private final AkunService akunService;

    public AkunController(AkunService akunService) {
        this.akunService = akunService;
    }

    // GET semua akun - hanya ADMIN
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllAkun() {
        try {
            List<Akun> akunList = akunService.getAllAkun();
            return ResponseEntity.ok(akunList);
        } catch (Exception e) {
            ErrorResponse error = new ErrorResponse(
                500, "SERVER_ERROR", "Gagal mengambil data akun", 
                e.getMessage(), "/api/admin/akun"
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // GET akun by ID - hanya ADMIN
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAkunById(@PathVariable Long id) {
        try {
            Akun akun = akunService.getAkunById(id);
            return ResponseEntity.ok(akun);
        } catch (RuntimeException e) {
            ErrorResponse error = new ErrorResponse(
                404, "NOT_FOUND", "Akun tidak ditemukan", 
                e.getMessage(), "/api/admin/akun/" + id
            );
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            ErrorResponse error = new ErrorResponse(
                500, "SERVER_ERROR", "Gagal mengambil data akun", 
                e.getMessage(), "/api/admin/akun/" + id
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // SEARCH akun - hanya ADMIN
    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> searchAkun(@RequestParam String keyword) {
        try {
            List<Akun> akunList = akunService.searchAkun(keyword);
            return ResponseEntity.ok(akunList);
        } catch (Exception e) {
            ErrorResponse error = new ErrorResponse(
                500, "SERVER_ERROR", "Gagal mencari akun", 
                e.getMessage(), "/api/admin/akun/search"
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // CREATE akun baru - hanya ADMIN
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createAkun(@RequestBody Akun akun) {
        try {
            Akun createdAkun = akunService.createAkun(akun);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdAkun);
        } catch (RuntimeException e) {
            ErrorResponse error = new ErrorResponse(
                400, "VALIDATION_ERROR", "Data akun tidak valid", 
                e.getMessage(), "/api/admin/akun"
            );
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            ErrorResponse error = new ErrorResponse(
                500, "SERVER_ERROR", "Gagal membuat akun", 
                e.getMessage(), "/api/admin/akun"
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // UPDATE akun - hanya ADMIN
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateAkun(@PathVariable Long id, @RequestBody Akun akun) {
        try {
            Akun updatedAkun = akunService.updateAkun(id, akun);
            return ResponseEntity.ok(updatedAkun);
        } catch (RuntimeException e) {
            ErrorResponse error = new ErrorResponse(
                400, "VALIDATION_ERROR", "Data akun tidak valid", 
                e.getMessage(), "/api/admin/akun/" + id
            );
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            ErrorResponse error = new ErrorResponse(
                500, "SERVER_ERROR", "Gagal mengupdate akun", 
                e.getMessage(), "/api/admin/akun/" + id
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // DELETE akun - hanya ADMIN
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteAkun(@PathVariable Long id) {
        try {
            akunService.deleteAkun(id);
            return ResponseEntity.ok("Akun berhasil dihapus");
        } catch (RuntimeException e) {
            ErrorResponse error = new ErrorResponse(
                404, "NOT_FOUND", "Akun tidak ditemukan", 
                e.getMessage(), "/api/admin/akun/" + id
            );
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            ErrorResponse error = new ErrorResponse(
                500, "SERVER_ERROR", "Gagal menghapus akun", 
                e.getMessage(), "/api/admin/akun/" + id
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}