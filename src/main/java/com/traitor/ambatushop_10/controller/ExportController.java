package com.traitor.ambatushop_10.controller;

import com.traitor.ambatushop_10.service.ExportService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.io.IOException;

@Controller
@RequestMapping("/api/export")
public class ExportController {

    @Autowired
    private ExportService exportService;

    @GetMapping("/download")
    public void generateExcelExport(HttpServletResponse response) throws IOException {

        response.setContentType("application/octet-stream");
        String headerKey = "Content-Disposition";
        String headerValue = "attachment; filename=laporan_keuangan.xlsx";

        response.setHeader(headerKey, headerValue);

        exportService.generateExcel(response);
    }
}
