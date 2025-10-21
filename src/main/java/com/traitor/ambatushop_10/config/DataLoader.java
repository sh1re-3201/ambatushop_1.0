package com.traitor.ambatushop_10.config;

import com.traitor.ambatushop_10.model.Akun;
import com.traitor.ambatushop_10.model.Keuangan;
import com.traitor.ambatushop_10.model.Produk;
import com.traitor.ambatushop_10.model.Transaksi;
import com.traitor.ambatushop_10.repository.AkunRepository;
import com.traitor.ambatushop_10.repository.TransaksiRepository;
import com.traitor.ambatushop_10.repository.ProdukRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

@Component
public class DataLoader implements CommandLineRunner {

    private final AkunRepository akunRepository;
    private final ProdukRepository produkRepository;
    private final TransaksiRepository transaksiRepository;

    private final PasswordEncoder passwordEncoder;

    public DataLoader(AkunRepository akunRepository, ProdukRepository produkRepository, TransaksiRepository transaksiRepository) {
        this.akunRepository = akunRepository;
        this.produkRepository = produkRepository;
        this.transaksiRepository = transaksiRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    @Override
    public void run(String... args) throws Exception {

        // Akun
        if (akunRepository.count() == 0) {
            akunRepository.save(new Akun("admin", passwordEncoder.encode("admin123"), "admin@example.com", Akun.Role.ADMIN));
            akunRepository.save(new Akun("kasir", passwordEncoder.encode("kasir123"), "kasir@example.com", Akun.Role.KASIR));
            akunRepository.save(new Akun("manajer", passwordEncoder.encode("manajer123"), "manajer@example.com", Akun.Role.MANAJER));
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
        Akun kasir = akunRepository.findByUsername("kasir").orElseThrow();
        // Transaksi
        if (transaksiRepository.count() == 0) {
            Transaksi transaksi = transaksiRepository.save(new Transaksi(Transaksi.MetodePembayaran.TUNAI, LocalDateTime.now(), 27500.0, kasir));
            transaksiRepository.save(transaksi);
        }
    }
}
