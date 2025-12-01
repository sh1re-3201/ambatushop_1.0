class CameraBarcodeScanner {
    constructor(kasirTransaksi) {
        this.kasirTransaksi = kasirTransaksi;
        this.stream = null;
        this.isScanning = false;
        this.scanInterval = null;

        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Start camera
        document.getElementById('start-camera-btn')?.addEventListener('click', () => {
            this.startCamera();
        });

        // Stop camera
        document.getElementById('stop-camera-btn')?.addEventListener('click', () => {
            this.stopCamera();
        });

        // Upload image
        document.getElementById('upload-image-btn')?.addEventListener('click', () => {
            document.getElementById('barcode-image-input').click();
        });

        // Handle image upload
        document.getElementById('barcode-image-input')?.addEventListener('change', (e) => {
            this.handleImageUpload(e.target.files[0]);
        });

        // Capture & scan
        document.getElementById('capture-scan-btn')?.addEventListener('click', () => {
            this.captureAndScan();
        });
    }

    async startCamera() {
        try {
            console.log('🔄 Starting camera...');

            const constraints = {
                video: {
                    facingMode: 'environment',
                    width: { min: 640, ideal: 1280, max: 1920 },
                    height: { min: 480, ideal: 720, max: 1080 },
                    frameRate: { ideal: 30, min: 15 },
                    focusMode: ['continuous', 'auto'], // Auto-focus
                    exposureMode: 'continuous',
                    whiteBalance: 'continuous'
                }
            };

            // Coba dengan constraints dasar dulu
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);

            // Tambahkan brightness/contrast filter ke video
            const video = document.getElementById('camera-stream');
            video.style.filter = 'contrast(1.2) brightness(1.1) saturate(1.3)';

            if (this.stream) {
                this.stopCamera();
            }

            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            video.srcObject = this.stream;

            // Tampilkan UI
            document.getElementById('camera-preview').style.display = 'block';
            document.getElementById('start-camera-btn').style.display = 'none';
            document.getElementById('stop-camera-btn').style.display = 'inline-block';

            console.log('Camera started');

            // Mulai auto-scan
            this.startAutoScan();

        } catch (error) {
            console.error('Camera error:', error);
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: true // Basic constraint
            });
            this.showError('Gagal mengakses kamera. Pastikan izin kamera sudah diberikan.');
        }
    }

    stopCamera() {
        console.log('🛑 Stopping camera...');

        this.stopAutoScan();

        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        // Reset UI
        document.getElementById('camera-preview').style.display = 'none';
        document.getElementById('start-camera-btn').style.display = 'inline-block';
        document.getElementById('stop-camera-btn').style.display = 'none';

        console.log('✅ Camera stopped');
    }

    startAutoScan() {
        this.isScanning = true;

        this.scanInterval = setInterval(async () => {
            await this.captureAndScan();
        }, 2000);
    }

    stopAutoScan() {
        this.isScanning = false;
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
        }
    }

    async captureAndScan() {
        if (!this.stream || !this.isScanning) return;

        try {
            const video = document.getElementById('camera-stream');

            // Tambahkan delay untuk auto-focus
            await new Promise(resolve => setTimeout(resolve, 100));

            // Capture multiple frames untuk meningkatkan accuracy
            const frames = [];
            for (let i = 0; i < 3; i++) {
                const frame = await this.captureFrame(video);
                frames.push(frame);
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Coba decode dari semua frame
            for (const frame of frames) {
                const barcode = await this.decodeFrame(frame);
                if (barcode) {
                    await this.handleBarcodeResult(barcode);
                    return;
                }
            }

        } catch (error) {
            console.error('Capture error:', error);
        }
    }

    async scanBarcodeFromBlob(blob) {
        try {
            const formData = new FormData();
            formData.append('image', blob, 'scan.jpg');

            console.log('📤 Sending to API...');

            const response = await fetch('http://localhost:8080/api/barcode/decode', {
                method: 'POST',
                body: formData
                // ❌ HAPUS AuthHelper.getAuthHeaders() karena endpoint sudah permitAll
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            console.log('API Result:', result);

            if (result.success && result.barcode) {
                this.handleBarcodeResult(result.barcode);
                this.stopAutoScan(); // Stop setelah berhasil
            } else {
                console.log('No barcode found or API error:', result.error);
            }

        } catch (error) {
            console.error('❌ Scan API error:', error);
        }
    }

    async handleImageUpload(file) {
        if (!file) return;

        try {
            console.log('📁 Processing uploaded image...');

            await this.scanBarcodeFromBlob(file);

        } catch (error) {
            console.error('❌ Upload scan error:', error);
            this.showError('Gagal memproses gambar');
        }
    }

    async handleBarcodeResult(barcode) {
        console.log('🎯 Handling barcode:', barcode);

        try {
            // Cek barcode di database
            const response = await fetch(`http://localhost:8080/api/barcode/check/${encodeURIComponent(barcode)}`);

            console.log('Check response status:', response.status);

            if (response.ok) {
                const result = await response.json();
                console.log('Check result:', result);

                if (result.success && result.exists && result.produk) {
                    // Tambahkan ke keranjang
                    this.kasirTransaksi.addToCart(result.produk.idProduk);
                    this.showSuccess(`✅ ${result.produk.namaProduk} ditambahkan`);
                } else {
                    this.showError('❌ Barcode tidak terdaftar');
                }
            } else {
                this.showError('❌ Gagal memeriksa barcode');
            }

        } catch (error) {
            console.error('❌ Barcode check error:', error);
            this.showError('❌ Error sistem');
        }
    }

    preprocessImage(imageData) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;

        // 1. Grayscale dengan bobot yang lebih baik
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Grayscale dengan luminance
            const gray = (r * 0.2126 + g * 0.7152 + b * 0.0722);

            // 2. Contrast enhancement (CLAHE sederhana)
            let enhanced;
            if (gray < 64) enhanced = gray * 0.5;      // Darken shadows
            else if (gray > 192) enhanced = gray * 1.2; // Brighten highlights
            else enhanced = gray;                       // Keep midtones

            // Clamp values
            const clamped = Math.max(0, Math.min(255, enhanced));

            data[i] = clamped;     // R
            data[i + 1] = clamped; // G  
            data[i + 2] = clamped; // B
        }

        // 3. Simple noise reduction (3x3 median filter)
        const tempData = new Uint8ClampedArray(data);
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;

                // Get 3x3 neighborhood
                const neighbors = [];
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const nIdx = ((y + dy) * width + (x + dx)) * 4;
                        neighbors.push(tempData[nIdx]);
                    }
                }

                // Get median
                neighbors.sort((a, b) => a - b);
                const median = neighbors[4]; // Middle of 9 values

                data[idx] = median;     // R
                data[idx + 1] = median; // G
                data[idx + 2] = median; // B
            }
        }

        return imageData;
    }

    showError(message) {
        // Gunakan alert sederhana dulu
        alert(message);
    }

    showSuccess(message) {
        // Tampilkan notifikasi
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b759;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}