class CameraBarcodeScanner {
    constructor(kasirTransaksiInstance) {
        this.kasirTransaksi = kasirTransaksiInstance;
        this.stream = null;
        this.video = null;
        this.canvas = null;
        this.ctx = null;
        this.isScanning = false;
        this.scanInterval = null;
        
        this.init();
    }
    
    init() {
        this.video = document.getElementById('camera-stream');
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.setupEventListeners();
        console.log('Camera Barcode Scanner initialized');
    }
    
    setupEventListeners() {
        // Start camera button
        document.getElementById('start-camera-btn').addEventListener('click', () => {
            this.startCamera();
        });
        
        // Stop camera button
        document.getElementById('stop-camera-btn').addEventListener('click', () => {
            this.stopCamera();
        });
        
        // Upload image button
        document.getElementById('upload-image-btn').addEventListener('click', () => {
            document.getElementById('barcode-image-input').click();
        });
        
        // Capture & scan button
        document.getElementById('capture-scan-btn').addEventListener('click', () => {
            this.captureAndScan();
        });
        
        // File upload handler
        document.getElementById('barcode-image-input').addEventListener('change', (e) => {
            this.handleImageUpload(e.target.files[0]);
        });
    }
    
    async startCamera() {
        try {
            // Request camera access
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment', // Prefer rear camera di mobile
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false 
            });
            
            // Show camera preview
            this.video.srcObject = this.stream;
            document.getElementById('camera-preview').style.display = 'block';
            
            // Toggle buttons
            document.getElementById('start-camera-btn').style.display = 'none';
            document.getElementById('stop-camera-btn').style.display = 'inline-block';
            
            // Start auto-scanning every 3 seconds
            this.startAutoScan();
            
            this.showSuccess('Kamera berhasil diaktifkan');
            
        } catch (error) {
            console.error('Camera error:', error);
            this.showError('Tidak dapat mengakses kamera: ' + error.message);
        }
    }
    
    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        // Hide camera preview
        document.getElementById('camera-preview').style.display = 'none';
        
        // Toggle buttons
        document.getElementById('start-camera-btn').style.display = 'inline-block';
        document.getElementById('stop-camera-btn').style.display = 'none';
        
        // Stop auto-scanning
        this.stopAutoScan();
        
        console.log('Camera stopped');
    }
    
    startAutoScan() {
        // Auto scan every 3 seconds
        this.scanInterval = setInterval(() => {
            this.captureAndScan();
        }, 3000);
    }
    
    stopAutoScan() {
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
        }
    }
    
    async captureAndScan() {
        if (!this.stream || !this.video.videoWidth) return;
        
        try {
            // Set canvas dimensions to match video
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;
            
            // Draw current video frame to canvas
            this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
            
            // Convert canvas to blob
            this.canvas.toBlob(async (blob) => {
                await this.scanBarcodeFromBlob(blob);
            }, 'image/jpeg', 0.8);
            
        } catch (error) {
            console.error('Capture error:', error);
        }
    }
    
    async handleImageUpload(file) {
        if (!file) return;
        
        try {
            await this.scanBarcodeFromBlob(file);
        } catch (error) {
            console.error('Upload scan error:', error);
            this.showError('Gagal memproses gambar: ' + error.message);
        }
    }
    
    async scanBarcodeFromBlob(blob) {
        try {
            // Show scanning indicator
            this.showScanningIndicator();
            
            // Create FormData for file upload
            const formData = new FormData();
            formData.append('image', blob, 'scan.jpg');
            
            // Send to backend for decoding
            const response = await fetch('http://localhost:8080/api/barcode/decode', {
                method: 'POST',
                headers: {
                    'Authorization': AuthHelper.getAuthHeaders().Authorization
                },
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success && result.barcode) {
                this.handleScanResult(result);
            } else {
                // Jangan show error untuk auto-scan (biasa terjadi)
                if (!this.scanInterval) {
                    this.showError(result.error || 'Barcode tidak terdeteksi');
                }
            }
            
        } catch (error) {
            console.error('Scan error:', error);
            if (!this.scanInterval) {
                this.showError('Error scanning barcode: ' + error.message);
            }
        } finally {
            this.hideScanningIndicator();
        }
    }
    
    handleScanResult(result) {
        console.log('📦 Scan result:', result);
        
        if (result.found && result.produk) {
            // Produk ditemukan - tambahkan ke cart
            this.kasirTransaksi.addToCart(result.produk.idProduk);
            this.showSuccess(`✓ ${result.produk.namaProduk} ditambahkan!`);
            
            // Stop auto-scan setelah berhasil scan (optional)
            this.stopAutoScan();
            
        } else if (result.barcode) {
            // Barcode terdeteksi tapi produk tidak ditemukan
            this.showError(`✗ Produk dengan barcode "${result.barcode}" tidak ditemukan`);
        }
    }
    
    showScanningIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'scanning-indicator';
        indicator.innerHTML = '🔍 Scanning...';
        indicator.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            font-weight: bold;
            z-index: 10;
        `;
        
        document.getElementById('camera-preview').appendChild(indicator);
    }
    
    hideScanningIndicator() {
        const indicator = document.getElementById('scanning-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    showSuccess(message) {
        this.showFeedback(message, 'success');
    }
    
    showError(message) {
        this.showFeedback(message, 'error');
    }
    
    showFeedback(message, type) {
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'success' ? '#10b759' : '#ef4444'};
            color: white;
            border-radius: 8px;
            font-weight: 600;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        feedback.textContent = message;
        
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            feedback.remove();
        }, 3000);
    }
}