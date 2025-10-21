class PneumoniaDetectionApp {
  constructor() {
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
    this.imageInput.addEventListener('change', e => this.handleFileSelect(e.target.files[0]));
    this.uploadArea.addEventListener('dragover', e => {
      e.preventDefault();
      this.uploadArea.classList.add('dragover');
    });
    this.uploadArea.addEventListener('dragleave', () => this.uploadArea.classList.remove('dragover'));
    this.uploadArea.addEventListener('drop', e => {
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
      this.model = await tf.loadLayersModel('model_web/model.json');
      this.modelLoaded = true;
      console.log("✅ Model loaded successfully");
    } catch (err) {
      console.error("❌ Model failed to load", err);
      alert("Model failed to load. Please refresh.");
    }
  }

  handleFileSelect(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => {
      this.previewImage.src = e.target.result;
      this.imagePreview.style.display = 'block';
      this.uploadArea.style.display = 'none';
      this.analyzeBtn.disabled = false;
    };
    reader.readAsDataURL(file);
  }

  clearImage() {
    this.imagePreview.style.display = 'none';
    this.uploadArea.style.display = 'block';
    this.results.style.display = 'none';
    this.imageInput.value = '';
    this.analyzeBtn.disabled = true;
  }

  async analyzeImage() {
    if (!this.modelLoaded) {
      alert('Model is still loading. Please wait.');
      return;
    }

    const file = this.imageInput.files[0];
    if (!file) return;

    this.analyzeBtn.disabled = true;

    const imageTensor = await this.fileToTensor(file);
    const prediction = this.model.predict(imageTensor);
    const score = (await prediction.data())[0];
    prediction.dispose();
    imageTensor.dispose();

    const hasPneumonia = score > 0.5;
    const confidence = Math.round(Math.abs(score - 0.5) * 200);
    this.displayResults(hasPneumonia, confidence);
    this.analyzeBtn.disabled = false;
  }

  async fileToTensor(file) {
    const img = document.createElement('img');
    const dataUrl = await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
    img.src = dataUrl;
    await new Promise(res => (img.onload = res));

    return tf.browser
      .fromPixels(img, 1)
      .resizeBilinear([256, 256])
      .toFloat()
      .div(255)
      .expandDims(0)
      .expandDims(-1);
  }

  displayResults(hasPneumonia, confidence) {
    this.resultStatus.innerHTML = hasPneumonia
      ? '<i class="fas fa-exclamation-triangle"></i> Pneumonia Detected'
      : '<i class="fas fa-check-circle"></i> Normal Chest X-ray';
    this.resultStatus.className = `result-status ${hasPneumonia ? 'pneumonia' : 'normal'}`;
    this.confidenceFill.style.width = `${confidence}%`;
    this.confidenceText.textContent = `${confidence}% confidence`;
    this.results.style.display = 'block';
    this.results.scrollIntoView({ behavior: 'smooth' });
  }
}

document.addEventListener('DOMContentLoaded', () => new PneumoniaDetectionApp());
