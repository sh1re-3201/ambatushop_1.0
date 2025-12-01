class CameraBarcodeScanner {
    constructor(kasirTransaksi) {
        this.kasirTransaksi = kasirTransaksi;
        this.stream = null;
        this.isScanning = false;
        this.scanInterval = null;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupCameraPreview();
    }

    setupEventListeners() {
        // Start camera
        document.getElementById('start-camera-btn').addEventListener('click', () => {
            this.startCamera();
        });

        // Stop camera
        document.getElementById('stop-camera-btn').addEventListener('click', () => {
            this.stopCamera();
        });

        // Upload image
        document.getElementById('upload-image-btn').addEventListener('click', () => {
            document.getElementById('barcode-image-input').click();
        });

        // Handle image upload
        document.getElementById('barcode-image-input').addEventListener('change', (e) => {
            this.handleImageUpload(e.target.files[0]);
        });

        // Capture & scan
        document.getElementById('capture-scan-btn').addEventListener('click', () => {
            this.captureAndScan();
        });
    }

    async startCamera() {
        try {
            console.log('Starting camera...');
            
            // Stop existing stream
            if (this.stream) {
                this.stopCamera();
            }

            // Get camera access dengan konfigurasi optimal
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'environment', // Prioritize rear camera
                    frameRate: { ideal: 30 }
                },
                audio: false
            });

            const video = document.getElementById('camera-stream');
            video.srcObject = this.stream;
            
            // Tampilkan UI camera
            document.getElementById('camera-preview').style.display = 'block';
            document.getElementById('start-camera-btn').style.display = 'none';
            document.getElementById('stop-camera-btn').style.display = 'inline-block';

            console.log('Camera started successfully');

            // Auto-scan setiap 2 detik
            this.startAutoScan();

        } catch (error) {
            console.error('Camera error:', error);
            this.showError('Gagal mengakses kamera: ' + error.message);
        }
    }

    stopCamera() {
        console.log('Stopping camera...');
        
        // Stop auto-scan
        this.stopAutoScan();
        
        // Stop stream
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        // Reset UI
        document.getElementById('camera-preview').style.display = 'none';
        document.getElementById('start-camera-btn').style.display = 'inline-block';
        document.getElementById('stop-camera-btn').style.display = 'none';

        console.log('Camera stopped');
    }

    startAutoScan() {
        this.isScanning = true;
        
        this.scanInterval = setInterval(() => {
            this.captureAndScan();
        }, 2000); // Scan setiap 2 detik
    }

    stopAutoScan() {
        this.isScanning = false;
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
        }
    }

    async captureAndScan() {
        if (!this.stream) return;

        try {
            const video = document.getElementById('camera-stream');
            const barcodeData = await this.captureFrameAndScan(video);
            
            if (barcodeData) {
                console.log('Barcode detected:', barcodeData);
                this.handleBarcodeResult(barcodeData);
                this.stopAutoScan(); // Stop scanning setelah berhasil
            }

        } catch (error) {
            console.error('Scan error:', error);
        }
    }

    async captureFrameAndScan(video) {
        // Set canvas size sama dengan video
        this.canvas.width = video.videoWidth;
        this.canvas.height = video.videoHeight;
        
        // Draw video frame ke canvas
        this.ctx.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);
        
        // Dapatkan image data
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        // Process image untuk improve scan accuracy
        const processedImageData = this.preprocessImage(imageData);
        
        // Convert ke blob untuk API
        return new Promise((resolve) => {
            this.canvas.toBlob(async (blob) => {
                try {
                    const barcode = await this.scanBarcodeFromBlob(blob);
                    resolve(barcode);
                } catch (error) {
                    resolve(null);
                }
            }, 'image/jpeg', 0.8);
        });
    }

    preprocessImage(imageData) {
        // Basic image processing untuk improve barcode detection
        const data = imageData.data;
        
        // Convert to grayscale dan enhance contrast
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Grayscale
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            
            // Enhance contrast
            const enhanced = gray < 128 ? Math.max(0, gray - 40) : Math.min(255, gray + 40);
            
            data[i] = enhanced;     // R
            data[i + 1] = enhanced; // G  
            data[i + 2] = enhanced; // B
        }
        
        return imageData;
    }

    async scanBarcodeFromBlob(blob) {
        const formData = new FormData();
        formData.append('image', blob, 'scan.jpg');

        try {
            const response = await fetch('http://localhost:8080/api/barcode/decode', {
                method: 'POST',
                body: formData,
                headers: AuthHelper.getAuthHeaders()
            });

            if (response.ok) {
                const result = await response.json();
                return result.success ? result.barcode : null;
            }
            return null;
        } catch (error) {
            console.error('Scan API error:', error);
            return null;
        }
    }

    async handleImageUpload(file) {
        if (!file) return;

        try {
            console.log('Processing uploaded image...');
            
            const barcode = await this.scanBarcodeFromBlob(file);
            
            if (barcode) {
                this.handleBarcodeResult(barcode);
            } else {
                this.showError('Tidak dapat membaca barcode dari gambar');
            }

        } catch (error) {
            console.error('Upload scan error:', error);
            this.showError('Gagal memproses gambar: ' + error.message);
        }
    }

    async handleBarcodeResult(barcode) {
        console.log('Barcode result:', barcode);
        
        try {
            // Cek apakah barcode ada di database
            const response = await fetch(`http://localhost:8080/api/barcode/check/${encodeURIComponent(barcode)}`, {
                headers: AuthHelper.getAuthHeaders()
            });

            if (response.ok) {
                const result = await response.json();
                
                if (result.exists && result.produk) {
                    // Tambahkan produk ke keranjang
                    this.kasirTransaksi.addToCart(result.produk.idProduk);
                    this.showSuccess(`Produk ditemukan: ${result.produk.namaProduk}`);
                } else {
                    this.showError('Barcode tidak terdaftar dalam sistem');
                }
            } else {
                this.showError('Gagal memeriksa barcode');
            }

        } catch (error) {
            console.error('Barcode check error:', error);
            this.showError('Error sistem saat memproses barcode');
        }
    }

    showError(message) {
        alert('❌ ' + message);
    }

    showSuccess(message) {
        // Tampilkan notifikasi sukses
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--success);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        notification.textContent = '✅ ' + message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}