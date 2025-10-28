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

    public AkunService(AkunRepository akunRepository, PasswordEncoder passwordEncoder) {
        this.akunRepository = akunRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // GET semua akun (hanya tampilkan, tanpa password)
    public List<Akun> getAllAkun() {
        return akunRepository.findAll();
    }

    // GET akun by ID
    public Akun getAkunById(Long id) {
        return akunRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Akun tidak ditemukan dengan ID: " + id));
    }

    // CREATE akun baru
    public Akun createAkun(Akun akun) {
        // Validasi
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

        // Cek username sudah ada
        if (akunRepository.existsByUsername(akun.getUsername())) {
            throw new RuntimeException("Username sudah digunakan");
        }

        // Cek email sudah ada
        if (akunRepository.findByEmail(akun.getEmail()).isPresent()) {
            throw new RuntimeException("Email sudah digunakan");
        }

        // Encode password
        akun.setPassword(passwordEncoder.encode(akun.getPassword()));

        return akunRepository.save(akun);
    }

    // UPDATE akun
    public Akun updateAkun(Long id, Akun akunUpdate) {
        Akun existing = getAkunById(id);

        // Validasi username (jika diubah)
        if (akunUpdate.getUsername() != null && !akunUpdate.getUsername().equals(existing.getUsername())) {
            if (akunRepository.existsByUsername(akunUpdate.getUsername())) {
                throw new RuntimeException("Username sudah digunakan");
            }
            existing.setUsername(akunUpdate.getUsername());
        }

        // Validasi email (jika diubah) - FIX DI SINI HARUSNYA!! 
        if (akunUpdate.getEmail() != null && !akunUpdate.getEmail().equals(existing.getEmail())) {
            Optional<Akun> emailExist = akunRepository.findByEmail(akunUpdate.getEmail());
            if (emailExist.isPresent() && emailExist.get().getIdPegawai() != id) { 
                throw new RuntimeException("Email sudah digunakan");
            }
            existing.setEmail(akunUpdate.getEmail());
        }

        // Update password (jika diubah)
        if (akunUpdate.getPassword() != null && !akunUpdate.getPassword().trim().isEmpty()) {
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

        // Prevent delete self
        // Optional: bisa tambah validasi lain, misal cek apakah akun punya transaksi,
        // dll

        akunRepository.delete(akun);
    }

    // SEARCH akun by username
    public List<Akun> searchAkun(String keyword) {
        // Bisa extend repository nanti untuk search
        return akunRepository.findAll().stream()
                .filter(akun -> akun.getUsername().toLowerCase().contains(keyword.toLowerCase()) ||
                        akun.getEmail().toLowerCase().contains(keyword.toLowerCase()))
                .toList();
    }
}