package com.traitor.ambatushop_10.controller;

import com.traitor.ambatushop_10.dto.AuthResponse;
import com.traitor.ambatushop_10.dto.ErrorResponse;
import com.traitor.ambatushop_10.dto.LoginRequest;
import com.traitor.ambatushop_10.dto.RegisterRequest;
import com.traitor.ambatushop_10.dto.RegisterResponse;
import com.traitor.ambatushop_10.model.Akun;
import com.traitor.ambatushop_10.repository.AkunRepository;
import com.traitor.ambatushop_10.service.JwtService;
import com.traitor.ambatushop_10.service.ValidationService;
import com.traitor.ambatushop_10.service.UserSessionService;
import jakarta.servlet.http.HttpServletRequest;

import java.util.HashMap;
import java.util.Map;

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

    private final AuthenticationManager authenticationManager;
    private final AkunRepository akunRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final ValidationService validationService;
    private final UserSessionService userSessionService;

    public AuthController(AuthenticationManager authenticationManager,
            AkunRepository akunRepository,
            JwtService jwtService,
            PasswordEncoder passwordEncoder,
            ValidationService validationService,
            UserSessionService userSessionService) {
        this.authenticationManager = authenticationManager;
        this.akunRepository = akunRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.validationService = validationService;
        this.userSessionService = userSessionService;
    }

    // ========== EXISTING LOGIN METHOD ==========
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        try {
            // Sanitize input
            String username = validationService.sanitizeInput(request.username());
            String password = validationService.sanitizeInput(request.password());

            System.out.println("Login attempt for username: " + username);

            // Authenticate user
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password));

            System.out.println("Authentication successful for: " + username);

            // Find user details
            Akun akun = akunRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User tidak ditemukan"));

            // TRACK USER LOGIN
            userSessionService.userLoggedIn(
                    akun.getIdPegawai(),
                    akun.getUsername(),
                    httpRequest);

            String token = jwtService.generateToken(
                    akun.getUsername(),
                    akun.getRole().name(),
                    akun.getIdPegawai());

            // System.out.println("JWT Token generated for: {} (ID: {}) with role: {}",
            // akun.getUsername(), akun.getIdPegawai(), akun.getRole());

            return ResponseEntity.ok(
                    new AuthResponse(token, akun.getRole().name(), akun.getUsername(), akun.getIdPegawai(),
                            "Login berhasil"));

        } catch (BadCredentialsException e) {
            System.err.println("Bad credentials for user: " + request.username());
            ErrorResponse error = new ErrorResponse(
                    401, "UNAUTHORIZED", "Username atau password salah",
                    "Pastikan username dan password benar", "/api/auth/login");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);

        } catch (AuthenticationException e) {
            System.err.println("Authentication failed for user: " + request.username());
            ErrorResponse error = new ErrorResponse(
                    401, "AUTH_FAILED", "Autentikasi gagal",
                    e.getMessage(), "/api/auth/login");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);

        } catch (Exception e) {
            System.err.println("UNEXPECTED ERROR during login: " + e.getMessage());
            ErrorResponse error = new ErrorResponse(
                    500, "INTERNAL_ERROR", "Terjadi kesalahan sistem",
                    e.getMessage(), "/api/auth/login");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // ========== EXISTING OTHER METHODS ==========
    @PostMapping("/logout")
    @PreAuthorize("hasAnyRole('KASIR', 'MANAJER', 'ADMIN')")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        try {
            String token = extractTokenFromRequest(request);

            if (token != null && jwtService.isTokenValid(token)) {
                Long userId = jwtService.extractUserId(token);

                // MARK USER AS OFFLINE di database
                akunRepository.findById(userId).ifPresent(akun -> {
                    akun.setOnline(false);
                    akun.setLastActivityAt(java.time.LocalDateTime.now());
                    akun.setSessionId(null);
                    akunRepository.save(akun);
                    System.out.println("✅ User " + akun.getUsername() + " marked as offline (logout)");
                });

                // Juga hapus dari session cache di UserSessionService
                userSessionService.userLoggedOut(userId);
            }

            return ResponseEntity.ok("Logout berhasil");

        } catch (Exception e) {
            System.err.println("❌ Error during logout: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error during logout");
        }
    }

    @PostMapping("/activity")
    @PreAuthorize("hasAnyRole('KASIR', 'MANAJER', 'ADMIN')")
    public ResponseEntity<?> updateActivity(HttpServletRequest request) {
        try {
            String token = extractTokenFromRequest(request);
            if (token != null && jwtService.isTokenValid(token)) {
                Long userId = jwtService.extractUserId(token);
                userSessionService.updateUserActivity(userId);
                return ResponseEntity.ok("Activity updated");
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating activity");
        }
    }

    @GetMapping("/test")
    public String test() {
        return "Auth controller is working! Time: " + java.time.LocalDateTime.now();
    }

    // ========== HELPER METHODS ==========
    private String extractTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
