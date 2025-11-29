package com.traitor.ambatushop_10.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Entity @Table(name = "akun") 
@Getter @Setter @NoArgsConstructor
public class Akun {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
     @Column(name = "id_pegawai")
    private long idPegawai;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(unique = true, nullable = false)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "role")
    private Role role;

    public Akun(String username, String password, String email, Role role) {
        this.username = username;
        this.password = password;
        this.email = email;
        this.role = role;
    }

    public static Akun ref(long id)
    {
     Akun a = new Akun();
     a.setIdPegawai(id);
     return a;
    }

    public enum Role {
        KASIR,
        MANAJER,
        ADMIN
    }
}

