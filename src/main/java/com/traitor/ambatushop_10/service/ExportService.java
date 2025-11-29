package com.traitor.ambatushop_10.service;

import com.traitor.ambatushop_10.model.Keuangan;
import com.traitor.ambatushop_10.repository.KeuanganRepository;
import jakarta.servlet.ServletOutputStream;
import jakarta.servlet.http.HttpServletResponse;
import org.apache.poi.hssf.usermodel.HSSFCell;
import org.apache.poi.hssf.usermodel.HSSFRow;
import org.apache.poi.hssf.usermodel.HSSFSheet;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;


@Service
public class ExportService {

    @Autowired
    private KeuanganRepository keuanganRepository;

    public void generateExcel(HttpServletResponse response) throws IOException {

        List<Keuangan> daftarKeuangan = keuanganRepository.findAll();

        HSSFWorkbook workbook = new HSSFWorkbook();
        HSSFSheet sheet = workbook.createSheet("Laporan Keuangan");
        HSSFRow row = sheet.createRow(0);

        // Create header
        row.createCell(0).setCellValue("ID");
        row.createCell(1).setCellValue("Jenis");
        row.createCell(2).setCellValue("Keterangan");
        row.createCell(3).setCellValue("Nominal");
        row.createCell(4).setCellValue("Tanggal");
        row.createCell(5).setCellValue("Id Pegawai");

        int dataRowIndex = 1;
        for (Keuangan keuangan : daftarKeuangan) {
            HSSFRow dataRow = sheet.createRow(dataRowIndex);
            dataRow.createCell(0).setCellValue(keuangan.getIdKeuangan());
            dataRow.createCell(1).setCellValue(keuangan.getJenis());
            dataRow.createCell(2).setCellValue(keuangan.getKeterangan());
            dataRow.createCell(3).setCellValue(keuangan.getNominal());
            dataRow.createCell(4).setCellValue(keuangan.getTanggal());
            dataRow.createCell(5).setCellValue(keuangan.getAkun().getIdPegawai());
            dataRowIndex++;
        }

        ServletOutputStream out = response.getOutputStream();
        workbook.write(out);// Write workbook to output stream
        workbook.close();
        out.close();

    }
}
