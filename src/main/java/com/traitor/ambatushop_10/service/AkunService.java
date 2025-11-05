package com.traitor.ambatushop_10.service;

import com.traitor.ambatushop_10.model.Akun;
import com.traitor.ambatushop_10.repository.AkunRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AkunService {

    private final AkunRepository akunRepository;
    private final PasswordEncoder passwordEncoder;
    private final ValidationService validationService;

    public AkunService(AkunRepository akunRepository, PasswordEncoder passwordEncoder, ValidationService validationService) {
        this.akunRepository = akunRepository;
        this.passwordEncoder = passwordEncoder;
        this.validationService = validationService;
    }

    // GET semua akun
    public List<Akun> getAllAkun() {
        return akunRepository.findAll();
    }

    // GET akun by ID
    public Akun getAkunById(Long id) {
        return akunRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Akun tidak ditemukan dengan ID: " + id));
    }

    // CREATE akun baru - DENGAN VALIDASI LENGKAP
    public Akun createAkun(Akun akun) {
        // Sanitize input
        akun.setUsername(validationService.sanitizeInput(akun.getUsername()));
        akun.setEmail(validationService.sanitizeInput(akun.getEmail()));
        akun.setPassword(validationService.sanitizeInput(akun.getPassword()));

        // Validasi input dasar
        if (akun.getUsername() == null || akun.getUsername().trim().isEmpty()) {
            throw new RuntimeException("Username tidak boleh kosong");
        }
        if (akun.getPassword() == null || akun.getPassword().trim().isEmpty()) {
            throw new RuntimeException("Password tidak boleh kosong");
        }
        if (akun.getEmail() == null || akun.getEmail().trim().isEmpty()) {
            throw new RuntimeException("Email tidak boleh kosong");
        }
        if (akun.getRole() == null) {
            throw new RuntimeException("Role harus dipilih");
        }

        // Validasi email format
        if (!validationService.isValidEmail(akun.getEmail())) {
            throw new RuntimeException("Format email tidak valid. Contoh: nama@domain.com");
        }

        // Validasi email disposable
        if (validationService.isDisposableEmail(akun.getEmail())) {
            throw new RuntimeException("Email temporary tidak diperbolehkan");
        }

        // Validasi password strength
        if (!validationService.isStrongPassword(akun.getPassword())) {
            String errorMsg = validationService.getPasswordErrorMessage(akun.getPassword());
            throw new RuntimeException("Password terlalu lemah: " + errorMsg);
        }

        // Cek username sudah ada
        if (akunRepository.existsByUsername(akun.getUsername())) {
            throw new RuntimeException("Username '" + akun.getUsername() + "' sudah digunakan");
        }

        // Cek email sudah ada
        if (akunRepository.findByEmail(akun.getEmail()).isPresent()) {
            throw new RuntimeException("Email '" + akun.getEmail() + "' sudah digunakan");
        }

        // Encode password
        akun.setPassword(passwordEncoder.encode(akun.getPassword()));

        return akunRepository.save(akun);
    }

    // UPDATE akun - DENGAN VALIDASI
    public Akun updateAkun(Long id, Akun akunUpdate) {
        Akun existing = getAkunById(id);

        // Sanitize input
        if (akunUpdate.getUsername() != null) {
            akunUpdate.setUsername(validationService.sanitizeInput(akunUpdate.getUsername()));
        }
        if (akunUpdate.getEmail() != null) {
            akunUpdate.setEmail(validationService.sanitizeInput(akunUpdate.getEmail()));
        }
        if (akunUpdate.getPassword() != null) {
            akunUpdate.setPassword(validationService.sanitizeInput(akunUpdate.getPassword()));
        }

        // Validasi username (jika diubah)
        if (akunUpdate.getUsername() != null && !akunUpdate.getUsername().equals(existing.getUsername())) {
            if (!akunUpdate.getUsername().trim().isEmpty()) {
                if (akunRepository.existsByUsername(akunUpdate.getUsername())) {
                    throw new RuntimeException("Username '" + akunUpdate.getUsername() + "' sudah digunakan");
                }
                existing.setUsername(akunUpdate.getUsername());
            }
        }

        // Validasi email (jika diubah)
        if (akunUpdate.getEmail() != null && !akunUpdate.getEmail().equals(existing.getEmail())) {
            if (!akunUpdate.getEmail().trim().isEmpty()) {
                // Validasi format email
                if (!validationService.isValidEmail(akunUpdate.getEmail())) {
                    throw new RuntimeException("Format email tidak valid. Contoh: nama@domain.com");
                }
                
                // Validasi email disposable
                if (validationService.isDisposableEmail(akunUpdate.getEmail())) {
                    throw new RuntimeException("Email temporary tidak diperbolehkan");
                }
                
                // Cek email unique
                Optional<Akun> emailExist = akunRepository.findByEmail(akunUpdate.getEmail());
                if (emailExist.isPresent() && emailExist.get().getIdPegawai() != id) {
                    throw new RuntimeException("Email '" + akunUpdate.getEmail() + "' sudah digunakan oleh akun lain");
                }
                existing.setEmail(akunUpdate.getEmail());
            }
        }

        // Update password (jika diubah)
        if (akunUpdate.getPassword() != null && !akunUpdate.getPassword().trim().isEmpty()) {
            // Validasi password strength
            if (!validationService.isStrongPassword(akunUpdate.getPassword())) {
                String errorMsg = validationService.getPasswordErrorMessage(akunUpdate.getPassword());
                throw new RuntimeException("Password terlalu lemah: " + errorMsg);
            }
            existing.setPassword(passwordEncoder.encode(akunUpdate.getPassword()));
        }

        // Update role (jika diubah)
        if (akunUpdate.getRole() != null) {
            existing.setRole(akunUpdate.getRole());
        }

        return akunRepository.save(existing);
    }

    // DELETE akun
    public void deleteAkun(Long id) {
        Akun akun = getAkunById(id);
        akunRepository.delete(akun);
    }

    // SEARCH akun by username/email
    public List<Akun> searchAkun(String keyword) {
        String searchTerm = validationService.sanitizeInput(keyword);
        return akunRepository.findAll().stream()
                .filter(akun -> akun.getUsername().toLowerCase().contains(searchTerm.toLowerCase()) ||
                               akun.getEmail().toLowerCase().contains(searchTerm.toLowerCase()))
                .toList();
    }
}