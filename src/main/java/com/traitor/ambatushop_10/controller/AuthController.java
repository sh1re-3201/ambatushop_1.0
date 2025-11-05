package com.traitor.ambatushop_10.controller;

import com.traitor.ambatushop_10.dto.AuthResponse;
import com.traitor.ambatushop_10.dto.LoginRequest;
import com.traitor.ambatushop_10.dto.ErrorResponse;
import com.traitor.ambatushop_10.model.Akun;
import com.traitor.ambatushop_10.repository.AkunRepository;
import com.traitor.ambatushop_10.service.JwtService;
import com.traitor.ambatushop_10.service.ValidationService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    
    private final AuthenticationManager authenticationManager;
    private final AkunRepository akunRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final ValidationService validationService;

    public AuthController(AuthenticationManager authenticationManager, 
                         AkunRepository akunRepository, 
                         JwtService jwtService,
                         PasswordEncoder passwordEncoder,
                         ValidationService validationService) {
        this.authenticationManager = authenticationManager;
        this.akunRepository = akunRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.validationService = validationService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            // Sanitize input
            String username = validationService.sanitizeInput(request.username());
            String password = validationService.sanitizeInput(request.password());

            logger.info("Login attempt for username: {}", username);
            
            // Authenticate user
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, password)
            );

            logger.info("Authentication successful for: {}", username);

            // Find user details
            Akun akun = akunRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User tidak ditemukan"));
                
            String token = jwtService.generateToken(akun.getUsername(), akun.getRole().name());
            
            logger.info("JWT Token generated for: {} with role: {}", akun.getUsername(), akun.getRole());
            
            return ResponseEntity.ok(
                new AuthResponse(token, akun.getRole().name(), akun.getUsername(), "Login berhasil")
            );

        } catch (BadCredentialsException e) {
            logger.error("Bad credentials for user: {}", request.username());
            ErrorResponse error = new ErrorResponse(
                401, "UNAUTHORIZED", "Username atau password salah", 
                "Pastikan username dan password benar", "/api/auth/login"
            );
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
            
        } catch (AuthenticationException e) {
            logger.error("Authentication failed for user: {}", request.username(), e);
            ErrorResponse error = new ErrorResponse(
                401, "AUTH_FAILED", "Autentikasi gagal", 
                e.getMessage(), "/api/auth/login"
            );
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
            
        } catch (Exception e) {
            logger.error("UNEXPECTED ERROR during login: ", e);
            ErrorResponse error = new ErrorResponse(
                500, "INTERNAL_ERROR", "Terjadi kesalahan sistem", 
                e.getMessage(), "/api/auth/login"
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping("/logout")
    @PreAuthorize("hasAnyRole('KASIR', 'MANAJER', 'ADMIN')")
    public String logout(HttpServletRequest request) {
        String token = extractTokenFromRequest(request);
        String username = jwtService.extractUsername(token);
        
        System.out.println("User logout: " + username);
        return "Logout berhasil. Silakan hapus token di client.";
    }

    private String extractTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    @GetMapping("/test")
    public String test() {
        return "Auth controller is working! Time: " + java.time.LocalDateTime.now();
    }
}