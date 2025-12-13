package com.traitor.ambatushop_10.config;

import com.traitor.ambatushop_10.model.*;
import com.traitor.ambatushop_10.repository.AkunRepository;
import com.traitor.ambatushop_10.repository.TransaksiDetailRepository;
import com.traitor.ambatushop_10.repository.TransaksiRepository;
import com.traitor.ambatushop_10.repository.ProdukRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataLoader implements CommandLineRunner {

    private final AkunRepository akunRepository;
    private final ProdukRepository produkRepository;
    private final TransaksiRepository transaksiRepository;
    private final TransaksiDetailRepository transaksiDetailRepository;
    private final PasswordEncoder passwordEncoder;

    public DataLoader(AkunRepository akunRepository, ProdukRepository produkRepository,
            TransaksiRepository transaksiRepository,
            TransaksiDetailRepository transaksiDetailRepository,
            PasswordEncoder passwordEncoder) {
        this.akunRepository = akunRepository;
        this.produkRepository = produkRepository;
        this.transaksiRepository = transaksiRepository;
        this.transaksiDetailRepository = transaksiDetailRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {

        // Akun - PERBAIKAN: Tidak langsung set field baru
        if (akunRepository.count() == 0) {
            // Cara 1: Simpan dulu, lalu update field baru
            Akun admin = new Akun();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("Admin123"));
            admin.setEmail("admin@example.com");
            admin.setRole(Akun.Role.ADMIN);
            // Jangan set field baru dulu
            akunRepository.save(admin);

            Akun kasir = new Akun();
            kasir.setUsername("kasir");
            kasir.setPassword(passwordEncoder.encode("Kasir123"));
            kasir.setEmail("kasir@example.com");
            kasir.setRole(Akun.Role.KASIR);
            akunRepository.save(kasir);

            Akun manajer = new Akun();
            manajer.setUsername("manajer");
            manajer.setPassword(passwordEncoder.encode("Manajer123"));
            manajer.setEmail("manajer@example.com");
            manajer.setRole(Akun.Role.MANAJER);
            akunRepository.save(manajer);

            System.out.println("Data akun berhasil dibuat");
        }

        // Produk
        if (produkRepository.count() == 0) {
            /*
             * Jangan lupa casting argumen stok ke short, karena di model bertipe short
             * //
             */
            // produkRepository.save(new Produk("Pop Sea Soda", 12500.0, (short) 117));
            // produkRepository.save(new Produk("Marlboro Filter Black", 39000.0, (short)
            // 56));
            // produkRepository.save(new Produk("Tepung Lingkaran Hitam 1000G", 15000.0,
            // (short) 98));
        }

        // Dummy data for seeding, get the dummy kasir account
        // Akun kasir = akunRepository.findByUsername("kasir").orElseThrow(() -> new
        // IllegalStateException("Akun tidak ditemukan"));

        System.out.println("✅ DataLoader selesai");
    }
}