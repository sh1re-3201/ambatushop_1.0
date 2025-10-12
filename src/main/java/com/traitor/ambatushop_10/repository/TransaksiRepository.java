package com.traitor.ambatushop_10.repository;

import com.traitor.ambatushop_10.model.Transaksi;
import com.traitor.ambatushop_10.model.Akun;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

/**
 * TransaksiRepository akan extends JpaRepository untuk mendapatkan CRUD Operation-nya
 * <Transaksi, Long>
 * "Transaksi" adalah entity type and "Long" adalah ID type.
 */

@Repository
public interface TransaksiRepository extends JpaRepository<Transaksi, Long> {
    List<Transaksi> findByAkun(Akun akun); //nama property sesuai sama entitynya yaitu akun.
    List<Transaksi> findByTanggalBetween(LocalDateTime start, LocalDateTime end);
}