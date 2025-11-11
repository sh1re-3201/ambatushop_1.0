/*  
 * Untuk view pengguna oleh manajer (read-only) aja sebenernya ini
 */
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
@RequestMapping("/api/manajer")
public class ManajerController {

    private final AkunService akunService;

    public ManajerController(AkunService akunService) {
        this.akunService = akunService;
    }

    // GET semua akun untuk Manajer (read-only)
    @GetMapping("/akun")
    @PreAuthorize("hasAnyRole('MANAJER', 'ADMIN')")
    public ResponseEntity<?> getAllAkunForManager() {
        try {
            List<Akun> akunList = akunService.getAllAkun();
            return ResponseEntity.ok(akunList);
        } catch (Exception e) {
            ErrorResponse error = new ErrorResponse(
                500, "SERVER_ERROR", "Gagal mengambil data akun",
                e.getMessage(), "/api/manajer/akun"
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // GET akun by ID untuk Manajer (read-only)  
    @GetMapping("/akun/{id}")
    @PreAuthorize("hasAnyRole('MANAJER', 'ADMIN')")
    public ResponseEntity<?> getAkunByIdForManager(@PathVariable Long id) {
        try {
            Akun akun = akunService.getAkunById(id);
            return ResponseEntity.ok(akun);
        } catch (RuntimeException e) {
            ErrorResponse error = new ErrorResponse(
                404, "NOT_FOUND", "Akun tidak ditemukan", 
                e.getMessage(), "/api/manajer/akun/" + id
            );
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            ErrorResponse error = new ErrorResponse(
                500, "SERVER_ERROR", "Gagal mengambil data akun", 
                e.getMessage(), "/api/manajer/akun/" + id
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}