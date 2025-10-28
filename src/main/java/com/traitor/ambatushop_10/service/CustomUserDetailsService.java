package com.traitor.ambatushop_10.service;

import com.traitor.ambatushop_10.model.Akun;
import com.traitor.ambatushop_10.repository.AkunRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final AkunRepository akunRepository;

    public CustomUserDetailsService(AkunRepository akunRepository) {
        this.akunRepository = akunRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        System.out.println("=== CustomUserDetailsService.loadUserByUsername ===");
        System.out.println("Looking for user: " + username);
        
        Akun akun = akunRepository.findByUsername(username)
            .orElseThrow(() -> {
                System.out.println("User not found: " + username);
                return new UsernameNotFoundException("User tidak ditemukan: " + username);
            });
        
        System.out.println("User found: " + akun.getUsername());
        System.out.println("Password: " + akun.getPassword());
        System.out.println("Role: " + akun.getRole());
        
        return new User(
            akun.getUsername(),
            akun.getPassword(),
            Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + akun.getRole()))
        );
    }
}