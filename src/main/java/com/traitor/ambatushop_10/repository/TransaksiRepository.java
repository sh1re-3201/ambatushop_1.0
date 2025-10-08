package com.traitor.ambatushop_10.repository;

import com.traitor.ambatushop_10.model.Transaksi;
import com.traitor.ambatushop_10.model.Akun;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TransaksiRepository extends JpaRepository<Transaksi, Long> {
    List<Transaksi> findByIdPegawai(Akun akun);
    List<Transaksi> findByTanggalBetween(LocalDateTime start, LocalDateTime end);
}