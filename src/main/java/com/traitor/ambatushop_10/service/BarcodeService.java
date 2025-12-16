// package com.traitor.ambatushop_10.service;

// import com.google.zxing.*;
// import com.google.zxing.client.j2se.BufferedImageLuminanceSource;
// import com.google.zxing.client.j2se.MatrixToImageWriter;
// import com.google.zxing.common.BitMatrix;
// import com.google.zxing.common.HybridBinarizer;
// import com.traitor.ambatushop_10.model.Produk;

// // import com.google.zxing.multi.qrcode.QRCodeMultiReader;
// import org.springframework.beans.factory.annotation.Value;
// import org.springframework.stereotype.Service;
// import org.springframework.web.multipart.MultipartFile;

// import javax.imageio.ImageIO;
// import java.awt.image.BufferedImage;
// import java.nio.file.Files;
// import java.nio.file.Path;
// import java.nio.file.Paths;
// import java.util.HashMap;
// import java.util.Map;

// @Service
// public class BarcodeService {

//     @Value("${app.barcode.image-path:./barcodes/}")
//     private String barcodeImagePath;

//     // GENERATE barcode image
//     public String generateBarcodeImage(String barcodeText, Long productId) {
//         try {
//             Path path = Paths.get(barcodeImagePath);
//             if (!Files.exists(path)) {
//                 Files.createDirectories(path);
//             }

//             String filename = "barcode-" + productId + ".png";
//             String fullPath = path.resolve(filename).toString(); // Gunakan resolve untuk path yang benar

//             Map<EncodeHintType, Object> hints = new HashMap<>();
//             hints.put(EncodeHintType.MARGIN, 2);

//             BitMatrix bitMatrix = new MultiFormatWriter().encode(
//                     barcodeText,
//                     BarcodeFormat.CODE_128,
//                     300,
//                     120,
//                     hints);

//             MatrixToImageWriter.writeToPath(bitMatrix, "PNG", Paths.get(fullPath));

//             System.out.println("Barcode generated: " + fullPath);
//             return filename;

//         } catch (Exception e) {
//             System.err.println("Barcode generation failed: " + e.getMessage());
//             throw new RuntimeException("Gagal generate barcode: " + e.getMessage());
//         }
//     }

//     // Tambahkan method untuk delete image by productId
//     public void deleteBarcodeImage(Long productId) {
//         try {
//             String filename = "barcode-" + productId + ".png";
//             Path imagePath = Paths.get(barcodeImagePath).resolve(filename);
            
//             if (Files.exists(imagePath)) {
//                 Files.delete(imagePath);
//                 System.out.println("Barcode image deleted: " + imagePath);
//             }
//         } catch (Exception e) {
//             System.err.println("Error deleting barcode image for product " + productId + ": " + e.getMessage());
//         }
//     }

//     // DECODE barcode dari image file
//     public String decodeBarcodeFromImage(MultipartFile imageFile) {
//         try {
//             // Convert MultipartFile to BufferedImage
//             BufferedImage bufferedImage = ImageIO.read(imageFile.getInputStream());

//             if (bufferedImage == null) {
//                 throw new RuntimeException("File gambar tidak valid atau corrupt");
//             }

//             // Convert to LuminanceSource
//             LuminanceSource source = new BufferedImageLuminanceSource(bufferedImage);
//             BinaryBitmap bitmap = new BinaryBitmap(new HybridBinarizer(source));

//             // Decode barcode
//             Map<DecodeHintType, Object> hints = new HashMap<>();
//             hints.put(DecodeHintType.TRY_HARDER, Boolean.TRUE);
//             hints.put(DecodeHintType.POSSIBLE_FORMATS, java.util.Arrays.asList(
//                     BarcodeFormat.CODE_128,
//                     BarcodeFormat.CODE_39,
//                     BarcodeFormat.EAN_13,
//                     BarcodeFormat.EAN_8,
//                     BarcodeFormat.UPC_A,
//                     BarcodeFormat.QR_CODE));

//             Result result = new MultiFormatReader().decode(bitmap, hints);
//             return result.getText();

//         } catch (NotFoundException e) {
//             throw new RuntimeException("Barcode tidak terdeteksi dalam gambar");
//         } catch (Exception e) {
//             throw new RuntimeException("Error decoding barcode: " + e.getMessage());
//         }
//     }

//     // GENERATE barcode text (auto)
//     public String generateBarcodeText(Produk produk) {
//         // Jika ID masih null (produk baru), gunakan timestamp temporary
//         String idPart;
//         if (produk.getIdProduk() == null) {
//             // Gunakan timestamp sebagai temporary ID
//             String timestamp = String.valueOf(System.currentTimeMillis());
//             idPart = "TEMP" + timestamp.substring(timestamp.length() - 5);
//         } else {
//             idPart = String.format("%05d", produk.getIdProduk());
//         }

//         String prefix = "AMBATU";
//         String category = extractCategory(produk.getNamaProduk());

//         return prefix + "-" + category + "-" + idPart;
//     }

//     // Untuk sementara menggunakan keyword sederhana untuk kategori, tetep ga kita pake tapi untuk jaga" aja
//     private String extractCategory(String productName) {
//         if (productName == null)
//             return "GEN";

//         String name = productName.toLowerCase();
//         if (name.contains("makanan") || name.contains("snack") || name.contains("makan"))
//             return "FOD";
//         if (name.contains("minuman") || name.contains("drink") || name.contains("air"))
//             return "BEV";
//         if (name.contains("rokok") || name.contains("cigarette") || name.contains("tembakau"))
//             return "CIG";
//         if (name.contains("sabun") || name.contains("shampoo") || name.contains("pasta gigi")
//                 || name.contains("sikat gigi"))
//             return "CARE";
//         if (name.contains("elektronik") || name.contains("electronic") || name.contains("kabel"))
//             return "ELC";
//         if (name.contains("obat") || name.contains("medicine") || name.contains("vitamin"))
//             return "MED";
//         return "GEN";
//     }
// }