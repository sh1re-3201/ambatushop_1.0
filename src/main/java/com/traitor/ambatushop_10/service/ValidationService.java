package com.traitor.ambatushop_10.service;

import org.springframework.stereotype.Service;
import java.util.regex.Pattern;

@Service
public class ValidationService {

    // Regex pattern untuk validasi email
    private static final String EMAIL_REGEX = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$";
    private static final Pattern EMAIL_PATTERN = Pattern.compile(EMAIL_REGEX);

    // List domain email disposable/temporary (bisa ditambah)
    private static final String[] DISPOSABLE_DOMAINS = {
        "tempmail.com", "trashmail.com", "guerrillamail.com", 
        "mailinator.com", "10minutemail.com", "yopmail.com"
    };

    /**
     * Validasi format email
     */
    public boolean isValidEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }
        
        String trimmedEmail = email.trim().toLowerCase();
        return EMAIL_PATTERN.matcher(trimmedEmail).matches();
    }

    /**
     * Cek apakah email disposable/temporary
     */
    public boolean isDisposableEmail(String email) {
        if (email == null) return false;
        
        String domain = email.toLowerCase().split("@")[1];
        for (String disposable : DISPOSABLE_DOMAINS) {
            if (domain.equals(disposable)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Validasi strength password
     */
    public boolean isStrongPassword(String password) {
        if (password == null || password.length() < 8) {
            return false;
        }

        // Check untuk kombinasi huruf besar, kecil, dan angka
        boolean hasUpper = false;
        boolean hasLower = false;
        boolean hasDigit = false;

        for (char c : password.toCharArray()) {
            if (Character.isUpperCase(c)) hasUpper = true;
            if (Character.isLowerCase(c)) hasLower = true;
            if (Character.isDigit(c)) hasDigit = true;
        }

        return hasUpper && hasLower && hasDigit;
    }

    /**
     * Sanitize input - trim dan normalize
     */
    public String sanitizeInput(String input) {
        if (input == null) return null;
        return input.trim();
    }

    /**
     * Dapatkan pesan error untuk password
     */
    public String getPasswordErrorMessage(String password) {
        if (password == null || password.length() < 8) {
            return "Password harus minimal 8 karakter";
        }

        StringBuilder error = new StringBuilder();
        if (!password.matches(".*[A-Z].*")) {
            error.append("Harus mengandung huruf besar, ");
        }
        if (!password.matches(".*[a-z].*")) {
            error.append("Harus mengandung huruf kecil, ");
        }
        if (!password.matches(".*\\d.*")) {
            error.append("Harus mengandung angka, ");
        }

        if (error.length() > 0) {
            return error.substring(0, error.length() - 2); // Remove last comma
        }

        return null;
    }
}