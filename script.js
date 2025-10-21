class PneumoniaDetector {
    constructor() {
        this.model = null;
        this.isModelLoaded = false;
        this.initializeElements();
        this.setupEventListeners();
        this.loadModel();
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
    }

    setupEventListeners() {
        this.uploadArea.addEventListener('click', () => this.imageInput.click());
        this.imageInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files[0]));

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
            if (file && file.type.startsWith('image/')) this.handleFileSelect(file);
        });

        this.removeImage.addEventListener('click', () => this.clearImage());
        this.analyzeBtn.addEventListener('click', () => this.analyzeImage());
    }

    async loadModel() {
        try {
            console.log('Loading pneumonia detection model...');
            this.model = await tf.loadLayersModel('model_web/model.json');
            this.isModelLoaded = true;
            console.log('✅ Model loaded successfully!');
            this.updateAnalyzeButton();
        } catch (error) {
            console.log('❌ Detailed model load error:', error)
            console.error('❌ Detailed model load error:', error);
            alert('Failed to load the AI model. Check console for details.');
        }
    }


    handleFileSelect(file) {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            this.previewImage.src = e.target.result;
            this.imagePreview.style.display = 'block';
            this.uploadArea.style.display = 'none';
            this.updateAnalyzeButton();
        };
        reader.readAsDataURL(file);
    }

    clearImage() {
        this.imagePreview.style.display = 'none';
        this.uploadArea.style.display = 'block';
        this.results.style.display = 'none';
        this.imageInput.value = '';
        this.updateAnalyzeButton();
    }

    updateAnalyzeButton() {
        const hasImage = this.imagePreview.style.display !== 'none';
        this.analyzeBtn.disabled = !hasImage || !this.isModelLoaded;
    }

    async analyzeImage() {
        if (!this.isModelLoaded) {
            alert('Model is still loading. Please wait...');
            return;
        }

        this.setAnalyzingState(true);
        this.results.style.display = 'none';

        try {
            const prediction = await this.detectPneumonia(this.previewImage);
            this.displayResults(prediction);
        } catch (error) {
            console.error('Error analyzing image:', error);
            alert('Error analyzing the image. Please try again.');
        } finally {
            this.setAnalyzingState(false);
        }
    }

    async detectPneumonia(imageElement) {
        const tensor = tf.browser.fromPixels(imageElement, 1)
            .resizeNearestNeighbor([256, 256])
            .toFloat()
            .div(255.0)
            .expandDims(0); // [1, 256, 256, 1]

        const prediction = await this.model.predict(tensor).data();
        tensor.dispose();

        const pneumoniaProb = prediction[0];
        const hasPneumonia = pneumoniaProb > 0.5;

        return {
            hasPneumonia,
            confidence: (hasPneumonia ? pneumoniaProb : 1 - pneumoniaProb) * 100,
            probabilities: {
                normal: ((1 - pneumoniaProb) * 100).toFixed(2),
                pneumonia: (pneumoniaProb * 100).toFixed(2)
            }
        };
    }


    displayResults(prediction) {
        const { hasPneumonia, confidence } = prediction;
        this.resultStatus.textContent = hasPneumonia
            ? '⚠️ Pneumonia Detected'
            : '✅ Normal Chest X-ray';
        this.resultStatus.className = `result-status ${hasPneumonia ? 'pneumonia' : 'normal'}`;
        this.confidenceFill.style.width = `${confidence}%`;
        this.confidenceText.textContent = `${confidence}% confidence`;
        this.results.style.display = 'block';
        this.results.scrollIntoView({ behavior: 'smooth' });
    }

    setAnalyzingState(isAnalyzing) {
        const btnText = this.analyzeBtn.querySelector('.btn-text');
        const btnLoader = this.analyzeBtn.querySelector('.btn-loader');
        this.analyzeBtn.disabled = isAnalyzing;
        btnText.style.display = isAnalyzing ? 'none' : 'inline';
        btnLoader.style.display = isAnalyzing ? 'inline' : 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => new PneumoniaDetector());
