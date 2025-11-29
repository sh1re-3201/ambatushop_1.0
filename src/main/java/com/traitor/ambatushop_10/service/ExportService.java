// java
package com.traitor.ambatushop_10.service;

import com.traitor.ambatushop_10.model.Keuangan;
import com.traitor.ambatushop_10.repository.KeuanganRepository;
import jakarta.servlet.http.HttpServletResponse;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;

@Service
public class ExportService {

    @Autowired
    private KeuanganRepository keuanganRepository;

    public void generateExcel(HttpServletResponse response) throws IOException {
        // set XLSX content type and filename
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=laporan_keuangan.xlsx");

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Laporan Keuangan");

            // header style
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(headerFont);

            String[] headers = {"ID", "ID Pegawai", "Jenis", "Keterangan", "Nominal", "Tanggal"};
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // data rows
            List<Keuangan> items = keuanganRepository.findAll();
            CreationHelper createHelper = workbook.getCreationHelper();
            CellStyle dateStyle = workbook.createCellStyle();
            dateStyle.setDataFormat(createHelper.createDataFormat().getFormat("yyyy-mm-dd"));

            int rowIdx = 1;
            for (Keuangan k : items) {
                Row row = sheet.createRow(rowIdx++);

                // adjust getters to match your Keuangan entity
                Cell c0 = row.createCell(0);
                if (k.getIdKeuangan() != null) c0.setCellValue(k.getIdKeuangan());
                Cell c1 = row.createCell(1);
                if (k.getAkun() != null) c1.setCellValue(k.getAkun().getIdPegawai());
                row.createCell(2).setCellValue(String.valueOf(k.getJenis() == null ? "" : k.getJenis()));
                row.createCell(3).setCellValue(k.getKeterangan() == null ? "" : k.getKeterangan());
                if (k.getNominal() != null) {
                    row.createCell(4).setCellValue(k.getNominal().doubleValue());
                }
                Cell dateCell = row.createCell(5);
                if (k.getTanggal() != null) {
                    dateCell.setCellValue((String.valueOf(k.getTanggal())));
                    dateCell.setCellStyle(dateStyle);
                }
            }

            // autosize columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(response.getOutputStream());
            response.flushBuffer();
        }
    }
}
