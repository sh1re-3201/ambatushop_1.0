package com.traitor.ambatushop_10.repository;

import com.traitor.ambatushop_10.model.Keuangan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

/**
 * KeuanganRepository akan extends JpaRepository untuk mendapatkan CRUD Operation-nya
 * <Keuangan, Long>
 * "Keuangan" adalah entity type and "Long" adalah ID type.
 */

@Repository
public interface KeuanganRepository extends JpaRepository<Keuangan, Long> {
    List<Keuangan> findByTanggalBetween(LocalDateTime start, LocalDateTime end);
}

