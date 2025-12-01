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

            const video = document.getElementById('camera-stream');
            video.srcObject = this.stream;
            
            // Tampilkan UI
            document.getElementById('camera-preview').style.display = 'block';
            document.getElementById('start-camera-btn').style.display = 'none';
            document.getElementById('stop-camera-btn').style.display = 'inline-block';

            console.log('✅ Camera started');
            
            // Mulai auto-scan
            this.startAutoScan();

        } catch (error) {
            console.error('❌ Camera error:', error);
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
            
            // Pastikan video sudah siap
            if (video.videoWidth === 0 || video.videoHeight === 0) {
                console.log('Video not ready yet');
                return;
            }

            console.log('📸 Capturing frame...');
            
            // Buat canvas temporary
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Convert ke blob
            const blob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/jpeg', 0.7);
            });

            if (blob) {
                console.log('🔍 Scanning barcode...');
                await this.scanBarcodeFromBlob(blob);
            }

        } catch (error) {
            console.error('❌ Capture error:', error);
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
            
            const barcode = await this.scanBarcodeFromBlob(file);
            
            if (barcode) {
                console.log('✅ Barcode from upload:', barcode);
            } else {
                this.showError('Tidak dapat membaca barcode dari gambar');
            }

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