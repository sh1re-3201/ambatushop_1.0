package com.traitor.ambatushop_10.repository;

import com.traitor.ambatushop_10.model.Produk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * ProdukRepository akan extends JpaRepository untuk mendapatkan CRUD Operation-nya
 * <Produk, Long>
 * "Produk" adalah entity type and "Long" adalah ID type.
 */

@Repository
public interface ProdukRepository extends JpaRepository<Produk, Long> {
    List<Produk> findByNamaProdukContainingIgnoreCase(String keyword);
}
