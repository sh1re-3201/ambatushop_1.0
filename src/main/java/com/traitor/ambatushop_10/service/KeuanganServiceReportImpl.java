package com.traitor.ambatushop_10.service;

import com.traitor.ambatushop_10.model.Keuangan;
import lombok.RequiredArgsConstructor;
import org.apache.poi.hssf.usermodel.*;
import org.springframework.stereotype.Service;

import java.io.FileOutputStream;
import java.util.List;

@Service
@RequiredArgsConstructor
public class KeuanganServiceReportImpl {

    private final KeuanganService keuanganService;

    public void generateExcel() {
        List<Keuangan> keuangan = keuanganService.getAllKeuangan();

        HSSFWorkbook keuanganWorkbook = new HSSFWorkbook();
        HSSFSheet keuanganSheet = keuanganWorkbook.createSheet("Laporan Keuangan");
        HSSFRow headerRow = keuanganSheet.createRow(0);

        headerRow.createCell(0).setCellValue("ID");
        headerRow.createCell(1).setCellValue("Jenis");
        headerRow.createCell(2).setCellValue("Keterangan");
        headerRow.createCell(3).setCellValue("Nominal");
        headerRow.createCell(4).setCellValue("Tanggal");
        headerRow.createCell(5).setCellValue("ID Pegawai");

        // UNtuk cell style tanggal
        HSSFCellStyle dateCellStyle = keuanganWorkbook.createCellStyle();
        HSSFDataFormat dateFormat = keuanganWorkbook.createDataFormat();
        dateCellStyle.setDataFormat(dateFormat.getFormat("dd-MM-yyyy HH:mm:ss"));

        int dataRowIndex = 1;
        for (Keuangan k : keuangan) {
            HSSFRow row = keuanganSheet.createRow(dataRowIndex++);

            row.createCell(0).setCellValue(k.getIdKeuangan());
            row.createCell(1).setCellValue(k.getJenis());
            row.createCell(2).setCellValue(k.getKeterangan());
            row.createCell(3).setCellValue(k.getNominal());

            HSSFCell dateCell = row.createCell(4);
            if (k.getTanggal() != null) {
                dateCell.setCellValue(k.getTanggal());
                dateCell.setCellStyle(dateCellStyle);
            }

            row.createCell(5).setCellValue(k.getAkun().getIdPegawai());
        }

        // Auto-size columns
        for (int i = 0; i <= 5; i++) {
            keuanganSheet.autoSizeColumn(i);
        }


        // Testing purposes
        try (FileOutputStream fos = new FileOutputStream("keuangan.xls")) {
            keuanganWorkbook.write(fos);
        } catch (Exception e) {
            e.printStackTrace();
        }

    }
}
