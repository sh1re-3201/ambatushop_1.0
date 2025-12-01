package com.traitor.ambatushop_10.config;

import com.traitor.ambatushop_10.service.CustomUserDetailsService;

import java.util.Arrays;
import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final CustomUserDetailsService userDetailsService;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter, CustomUserDetailsService userDetailsService) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.userDetailsService = userDetailsService;
    }

    // @Bean
    // public SecurityFilterChain securityFilterChain(HttpSecurity http) throws
    // Exception {
    // http
    // .csrf(csrf -> csrf.disable())
    // .sessionManagement(session -> session
    // .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
    // .authorizeHttpRequests(authz -> authz
    // // Public endpoints - HTML pages and static resources
    // .requestMatchers("/", "/login.html", "/register.html", "/css/**", "/js/**",
    // "/images/**")
    // .permitAll()
    // .requestMatchers("/api/auth/**").permitAll()

    // // Page routes - allow access to HTML pages (authentication will be handled
    // by
    // // frontend)
    // .requestMatchers("/admin", "/admin/**", "/manager", "/manager/**",
    // "/manajer", "/manajer/**")
    // .permitAll()
    // .requestMatchers("/kasir", "/kasir/**").permitAll()

    // // API endpoints - protected by role
    // .requestMatchers("/api/admin/**").hasRole("ADMIN")
    // .requestMatchers("/api/manajer/**").hasAnyRole("MANAJER", "ADMIN")
    // .requestMatchers("/api/kasir/**").hasAnyRole("KASIR", "MANAJER", "ADMIN")
    // .requestMatchers("/api/produk/**").hasAnyRole("KASIR", "MANAJER", "ADMIN")

    // // Default - butuh authentication untuk API lainnya
    // .anyRequest().authenticated())
    // .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

    // return http.build();
    // }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authz -> authz
                        // Static resources
                        .requestMatchers("/css/**", "/js/**", "/images/**").permitAll()

                        // HTML files - allow direct access
                        .requestMatchers("/*.html").permitAll()

                        // Controller routes - allow
                        .requestMatchers("/", "/login", "/admin", "/admin/**", "/manager/**", "/manajer/**",
                                "/kasir/**")
                        .permitAll()

                        // FIX: Allow Midtrans webhook without authentication
                        .requestMatchers("/api/payment/webhook").permitAll()

                        // Barcode endpoints 
                        .requestMatchers(HttpMethod.GET, "/api/barcode/produk/*/image").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/barcode/check/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/barcode/decode").permitAll()

                        // API auth
                        .requestMatchers("/api/auth/**").permitAll()
                        // .requestMatchers("/api/barcode/produk/*/image").permitAll()

                        .requestMatchers(HttpMethod.GET, "/api/export/download").permitAll()

                        // API Export
                        .requestMatchers("/api/export/**").hasAnyRole("MANAJER", "ADMIN")

                        // Protect API endpoints
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/manajer/**").hasAnyRole("MANAJER", "ADMIN")
                        .requestMatchers("/api/kasir/**").hasAnyRole("KASIR", "MANAJER", "ADMIN")
                        .requestMatchers("/api/produk/**").hasAnyRole("KASIR", "MANAJER", "ADMIN")

                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:8080"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    // @Bean
    // public WebSecurityCustomizer webSecurityCustomizer() {
    // return (web) -> web.ignoring().requestMatchers("/api/payment/webhook");
    // }
}