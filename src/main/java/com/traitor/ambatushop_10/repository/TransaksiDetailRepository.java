package com.traitor.ambatushop_10.repository;

import com.traitor.ambatushop_10.model.TransaksiDetail;
import com.traitor.ambatushop_10.model.Transaksi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * TransaksiDetailRepository akan extends JpaRepository untuk mendapatkan CRUD Operation-nya
 * <TransaksiDetail, Long>
 * "TransaksiDetail" adalah entity type and "Long" adalah ID type.
 */

@Repository
public interface TransaksiDetailRepository extends JpaRepository<TransaksiDetail, Long> {
    List<TransaksiDetail> findByTransaksiId(Transaksi transaksi);
}