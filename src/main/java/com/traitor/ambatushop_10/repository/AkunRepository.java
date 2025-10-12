package com.traitor.ambatushop_10.repository;

import com.traitor.ambatushop_10.model.Akun;
import org.springframework.data.jpa.repository.JpaRepository; // Untuk ngedapetin CRUD Operation-nya
import org.springframework.stereotype.Repository;
import java.util.Optional; // Untuk menyertakan alternatif ketika mereferensikan sebuah objek dengan tipe T yang bisa saja null
                           // intinya nanti bakalan mencegah NullPointerException, bisa aja pas di findById tapi ga ada, nah nanti 
                           // - bakalan dihindari error saat dicompile maupun saat dirun

/**
 * AkunRepository akan extends JpaRepository untuk mendapatkan CRUD Operation-nya
 * <Akun, Long>
 * "Akun" adalah entity type and "Long" adalah ID type.
 */

@Repository
public interface AkunRepository extends JpaRepository<Akun, Long> {
    Optional<Akun> findByUsername(String username);
    Optional<Akun> findByEmail(String email);
    boolean existsByUsername(String username);
}