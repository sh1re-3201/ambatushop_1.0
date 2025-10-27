package com.traitor.ambatushop_10.controller;

import com.traitor.ambatushop_10.dto.AuthResponse;
import com.traitor.ambatushop_10.dto.LoginRequest;
import com.traitor.ambatushop_10.model.Akun;
import com.traitor.ambatushop_10.repository.AkunRepository;
import com.traitor.ambatushop_10.service.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
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

    public AuthController(AuthenticationManager authenticationManager, 
                         AkunRepository akunRepository, 
                         JwtService jwtService,
                         PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.akunRepository = akunRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        logger.info("=== LOGIN ATTEMPT STARTED ===");
        logger.info("Username: {}", request.username());
        
        try {
            // STEP 1: Cek apakah user ada di database
            logger.info("Step 1: Checking user in database...");
            Akun akun = akunRepository.findByUsername(request.username())
                .orElseThrow(() -> {
                    logger.error("User not found: {}", request.username());
                    return new RuntimeException("User tidak ditemukan");
                });
            
            logger.info("User found: {} with role: {}", akun.getUsername(), akun.getRole());
            logger.info("DB Password (hashed): {}", akun.getPassword());
            
            // STEP 2: Manual password check untuk debugging
            logger.info("Step 2: Manual password check...");
            boolean passwordMatches = passwordEncoder.matches(request.password(), akun.getPassword());
            logger.info("Password matches: {}", passwordMatches);
            
            if (!passwordMatches) {
                logger.error("Password does not match for user: {}", request.username());
                return ResponseEntity.status(401)
                    .body(new AuthResponse(null, null, null, "Password salah"));
            }

            // STEP 3: Try authentication dengan Spring Security
            logger.info("Step 3: Attempting Spring Security authentication...");
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password())
            );
            
            logger.info("Spring Security authentication successful");

            // STEP 4: Generate JWT token
            logger.info("Step 4: Generating JWT token...");
            String token = jwtService.generateToken(akun.getUsername(), akun.getRole().name());
            logger.info("JWT Token generated successfully");

            logger.info("=== LOGIN SUCCESSFUL ===");
            return ResponseEntity.ok(
                new AuthResponse(token, akun.getRole().name(), akun.getUsername(), "Login berhasil")
            );

        } catch (BadCredentialsException e) {
            logger.error("Bad credentials for user: {}", request.username(), e);
            return ResponseEntity.status(401)
                .body(new AuthResponse(null, null, null, "Username atau password salah"));
        } catch (AuthenticationException e) {
            logger.error("Authentication failed for user: {}", request.username(), e);
            return ResponseEntity.status(401)
                .body(new AuthResponse(null, null, null, "Autentikasi gagal: " + e.getMessage()));
        } catch (Exception e) {
            logger.error("UNEXPECTED ERROR during login: ", e);
            e.printStackTrace(); // Print full stack trace ke console
            return ResponseEntity.status(500)
                .body(new AuthResponse(null, null, null, "Terjadi kesalahan sistem: " + e.getMessage()));
        }
    }

    @GetMapping("/test")
    public String test() {
        return "Auth controller is working! Time: " + java.time.LocalDateTime.now();
    }
}