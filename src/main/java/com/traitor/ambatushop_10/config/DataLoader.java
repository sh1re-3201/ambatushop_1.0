package com.traitor.ambatushop_10.config;

import com.traitor.ambatushop_10.model.*;
import com.traitor.ambatushop_10.repository.*;
import lombok.AllArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

@Component @AllArgsConstructor
public class DataLoader implements CommandLineRunner {

    private final AkunRepository akunRepository;
    private final ProdukRepository produkRepository;
    private final TransaksiRepository transaksiRepository;
    private final TransaksiDetailRepository transaksiDetailRepository;
    private final KeuanganRepository keuanganRepository;

    private final PasswordEncoder passwordEncoder;

//    public DataLoader(AkunRepository akunRepository, ProdukRepository produkRepository, TransaksiRepository transaksiRepository, TransaksiDetailRepository transaksiDetailRepository, KeuanganRepository keuanganRepository, PasswordEncoder passwordEncoder) {
//        this.akunRepository = akunRepository;
//        this.produkRepository = produkRepository;
//        this.transaksiRepository = transaksiRepository;
//        this.transaksiDetailRepository = transaksiDetailRepository;
//        this.keuanganRepository = keuanganRepository;
//        this.passwordEncoder = passwordEncoder;
//    }

    @Override
    public void run(String... args) throws Exception {

        // Akun
        if (akunRepository.count() == 0) {
            akunRepository.save(new Akun("admin", passwordEncoder.encode("Admin123"), "admin@example.com", Akun.Role.ADMIN));
            akunRepository.save(new Akun("kasir", passwordEncoder.encode("Kasir123"), "kasir@example.com", Akun.Role.KASIR));
            akunRepository.save(new Akun("manajer", passwordEncoder.encode("Manajer123"), "manajer@example.com", Akun.Role.MANAJER));
        }

        // Produk
        if (produkRepository.count() == 0) {
            /*
            Jangan lupa casting argumen stok ke short, karena di model bertipe short
             */
            produkRepository.save(new Produk("Pop Sea Soda", 12500.0, (short) 117));
            produkRepository.save(new Produk("Marlboro Filter Black", 39000.0, (short) 56));
            produkRepository.save(new Produk("Tepung Lingkaran Hitam 1000G", 15000.0, (short) 98));
        }

        // Dummy data for seeding, get the dummy kasir account
        Akun kasir = akunRepository.findByUsername("kasir").orElseThrow(() -> new IllegalStateException("Akun tidak ditemukan"));
        // Transaksi
        if (transaksiRepository.count() == 0) {
            transaksiRepository.save(new Transaksi(Transaksi.MetodePembayaran.TUNAI, LocalDateTime.now(), 27500.0, kasir));
            transaksiRepository.save(new Transaksi(Transaksi.MetodePembayaran.TUNAI, LocalDateTime.now(), 15000.0, kasir));
        }

        // TEST KEUANGAN DENGAN ARSITEKTUR SEBELUM DIPERBAIKI
        if (keuanganRepository.count() == 0) {
            keuanganRepository.save(new Keuangan(true, "Test1", 10000009L, LocalDateTime.now(), kasir));
            keuanganRepository.save(new Keuangan(false, "Test1", 100331009L, LocalDateTime.now(), kasir));

        }
        // Transaksi Detail
//        if (transaksiDetailRepository.count() == 0) {
//            transaksiDetailRepository.save(new TransaksiDetail());
//        }
    }
}
