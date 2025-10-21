class PneumoniaDetectionApp {
    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.checkModelStatus();
    }

    initializeElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.imageInput = document.getElementById('imageInput');
        this.imagePreview = document.getElementById('imagePreview');
        this.previewImage = document.getElementById('previewImage');
        this.removeImage = document.getElementById('removeImage');
        this.analyzeBtn = document.getElementById('analyzeBtn');
        this.results = document.getElementById('results');
        this.resultStatus = document.getElementById('resultStatus');
        this.confidenceFill = document.getElementById('confidenceFill');
        this.confidenceText = document.getElementById('confidenceText');
        this.normalProb = document.getElementById('normalProb');
        this.pneumoniaProb = document.getElementById('pneumoniaProb');
        this.modelStatus = document.getElementById('modelStatus');
    }

    setupEventListeners() {
        // Upload area click
        this.uploadArea.addEventListener('click', () => {
            this.imageInput.click();
        });

        // File input change
        this.imageInput.addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files[0]);
        });

        // Drag and drop
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('dragover');
        });

        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('dragover');
        });

        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.handleFileSelect(file);
            }
        });

        // Remove image
        this.removeImage.addEventListener('click', () => {
            this.clearImage();
        });

        // Analyze button
        this.analyzeBtn.addEventListener('click', () => {
            this.analyzeImage();
        });
    }

    async checkModelStatus() {
        try {
            const response = await fetch('/health');
            const data = await response.json();
            
            if (data.model_loaded) {
                this.modelStatus.innerHTML = '<i class="fas fa-circle"></i> Model Ready';
                this.modelStatus.classList.add('loaded');
            } else {
                this.modelStatus.innerHTML = '<i class="fas fa-circle"></i> Model Loading...';
                this.modelStatus.classList.remove('loaded');
            }
        } catch (error) {
            console.error('Error checking model status:', error);
            this.modelStatus.innerHTML = '<i class="fas fa-circle"></i> Model Error';
            this.modelStatus.classList.add('error');
        }
    }

    handleFileSelect(file) {
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            this.showError('Please select a valid image file.');
            return;
        }

        // Check file size (16MB limit)
        if (file.size > 16 * 1024 * 1024) {
            this.showError('File size must be less than 16MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.previewImage.src = e.target.result;
            this.imagePreview.style.display = 'block';
            this.uploadArea.style.display = 'none';
            this.updateAnalyzeButton();
            this.hideMessages();
        };
        reader.readAsDataURL(file);
    }

    clearImage() {
        this.imagePreview.style.display = 'none';
        this.uploadArea.style.display = 'block';
        this.results.style.display = 'none';
        this.imageInput.value = '';
        this.updateAnalyzeButton();
        this.hideMessages();
    }

    updateAnalyzeButton() {
        const hasImage = this.imagePreview.style.display !== 'none';
        this.analyzeBtn.disabled = !hasImage;
    }

    async analyzeImage() {
        const file = this.imageInput.files[0];
        if (!file) return;

        this.setAnalyzingState(true);
        this.results.style.display = 'none';
        this.hideMessages();

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.displayResults(data.result);
            } else {
                this.showError(data.error || 'Error analyzing the image. Please try again.');
            }
        } catch (error) {
            console.error('Error analyzing image:', error);
            this.showError('Network error. Please check your connection and try again.');
        } finally {
            this.setAnalyzingState(false);
        }
    }

    displayResults(result) {
        const { has_pneumonia, confidence, probabilities } = result;
        
        // Update result status
        this.resultStatus.innerHTML = has_pneumonia ? 
            '<i class="fas fa-exclamation-triangle"></i> Pneumonia Detected' : 
            '<i class="fas fa-check-circle"></i> Normal Chest X-ray';
        this.resultStatus.className = `result-status ${has_pneumonia ? 'pneumonia' : 'normal'}`;
        
        // Update confidence meter
        this.confidenceFill.style.width = `${confidence}%`;
        this.confidenceText.textContent = `${confidence}% confidence`;
        
        // Update probability breakdown
        this.normalProb.textContent = `${probabilities.normal}%`;
        this.pneumoniaProb.textContent = `${probabilities.pneumonia}%`;
        
        // Show results
        this.results.style.display = 'block';
        
        // Scroll to results
        this.results.scrollIntoView({ behavior: 'smooth' });
        
        // Show success message
        this.showSuccess('Analysis completed successfully!');
    }

    setAnalyzingState(isAnalyzing) {
        const btnText = this.analyzeBtn.querySelector('.btn-text');
        const btnLoader = this.analyzeBtn.querySelector('.btn-loader');
        
        this.analyzeBtn.disabled = isAnalyzing;
        
        if (isAnalyzing) {
            btnText.style.display = 'none';
            btnLoader.style.display = 'flex';
        } else {
            btnText.style.display = 'flex';
            btnLoader.style.display = 'none';
        }
    }

    showError(message) {
        this.hideMessages();
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        errorDiv.style.display = 'block';
        
        const uploadSection = document.querySelector('.upload-section');
        uploadSection.appendChild(errorDiv);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    showSuccess(message) {
        this.hideMessages();
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        successDiv.style.display = 'block';
        
        const uploadSection = document.querySelector('.upload-section');
        uploadSection.appendChild(successDiv);
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 3000);
    }

    hideMessages() {
        const errorMessages = document.querySelectorAll('.error-message');
        const successMessages = document.querySelectorAll('.success-message');
        
        errorMessages.forEach(msg => {
            if (msg.parentNode) {
                msg.parentNode.removeChild(msg);
            }
        });
        
        successMessages.forEach(msg => {
            if (msg.parentNode) {
                msg.parentNode.removeChild(msg);
            }
        });
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PneumoniaDetectionApp();
});
