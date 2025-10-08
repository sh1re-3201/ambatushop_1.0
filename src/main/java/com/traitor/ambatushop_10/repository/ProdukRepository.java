package com.traitor.ambatushop_10.repository;

import com.traitor.ambatushop_10.model.Produk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProdukRepository extends JpaRepository<Produk, Long> {
    List<Produk> findByNamaProdukContainingIgnoreCase(String keyword);
}
