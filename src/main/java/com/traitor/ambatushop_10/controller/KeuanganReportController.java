package com.traitor.ambatushop_10.controller;

import com.traitor.ambatushop_10.service.KeuanganServiceReportImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/keuangan/report")
@RequiredArgsConstructor
public class KeuanganReportController {

    private final KeuanganServiceReportImpl keuanganServiceReport;

    @GetMapping("/download")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public ResponseEntity<byte[]> downloadReport() {
        try {
            // Generate the file (service writes `keuangan.xlsx` as implemented)
            keuanganServiceReport.generateExcel();

            Path file = Paths.get("keuangan.xls");
            if (!Files.exists(file)) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }

            byte[] content = Files.readAllBytes(file);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("application/vnd.ms-excel"));
            headers.setContentDispositionFormData("attachment", "keuangan.xls");
            headers.setContentLength(content.length);

            // Optionally remove the temporary file after reading
            Files.deleteIfExists(file);

            return new ResponseEntity<>(content, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
