// import { InferenceClient } from "@huggingface/inference";

import { InferenceClient } from "https://cdn.jsdelivr.net/npm/@huggingface/inference@4.13.18/+esm";

// Hugging Face token
const HF_TOKEN = "";

const client = new InferenceClient(HF_TOKEN);

const generateBtn = document.getElementById('generateBtn');
const promptInput = document.getElementById('prompt');
const modelSelect = document.getElementById('modelSelect');
const stepsInput = document.getElementById('steps');
const guidanceInput = document.getElementById('guidance');
const imageCountInput = document.getElementById('imageCount');
const providerSelect = document.getElementById('provider');
const loadingDiv = document.getElementById('loading');
const resultDiv = document.getElementById('result');
const errorDiv = document.getElementById('error');

let currentImageBlobs = [];
let currentImageUrls = [];

generateBtn.addEventListener('click', generateImage);
resultDiv.addEventListener('click', (event) => {
    const button = event.target.closest('.download-btn');
    if (!button) return;

    downloadImage(Number(button.dataset.index));
});

async function generateImage() {
    const prompt = promptInput.value.trim();

    if (!prompt) {
        showError('Please write a prompt first!');
        return;
    }

    if (HF_TOKEN === "YOUR_HUGGING_FACE_TOKEN_HERE") {
        showError('Please set your Hugging Face token first!');
        return;
    }

    hideError();
    hideResult();
    showLoading();
    generateBtn.disabled = true;

    try {
        const model = modelSelect.value;
        const steps = parseInt(stepsInput.value, 10);
        const guidance = parseFloat(guidanceInput.value);
        const provider = providerSelect.value;
        const imageCount = Math.max(parseInt(imageCountInput.value, 10) || 1, 1);

        clearGeneratedImages();
        prepareImagesGrid();
        showResult();

        for (let i = 0; i < imageCount; i++) {
            setLoadingMessage(`Generating image ${i + 1} of ${imageCount}...`);

            const imageBlob = await requestImage({
                prompt,
                model,
                steps,
                guidance,
                provider
            });

            addGeneratedImage(imageBlob, i);
        }

        hideLoading();
    } catch (error) {
        console.error('Generation failed:', error);
        hideLoading();
        showError(`Failed to generate image: ${error.message}`);
    } finally {
        generateBtn.disabled = false;
    }
}

function requestImage({ prompt, model, steps, guidance, provider }) {
    const request = {
        model,
        inputs: prompt,
        parameters: {
            num_inference_steps: steps,
            guidance_scale: guidance
        }
    };

    if (provider === "wavespeed") {
        request.provider = "wavespeed";
    }

    return client.textToImage(request);
}

function prepareImagesGrid() {
    resultDiv.innerHTML = '<div class="images-grid" id="generatedImages"></div>';
}

function addGeneratedImage(imageBlob, index) {
    const imageUrl = URL.createObjectURL(imageBlob);
    const imagesGrid = document.getElementById('generatedImages');
    const imageCard = document.createElement('div');

    currentImageBlobs[index] = imageBlob;
    currentImageUrls[index] = imageUrl;

    imageCard.className = 'image-container';
    imageCard.innerHTML = `
        <img src="${imageUrl}" alt="Generated Image ${index + 1}">
        <button class="download-btn" data-index="${index}">Download Image ${index + 1}</button>
    `;

    imagesGrid.appendChild(imageCard);
}

function clearGeneratedImages() {
    currentImageUrls.forEach((url) => URL.revokeObjectURL(url));
    currentImageBlobs = [];
    currentImageUrls = [];
    resultDiv.innerHTML = '';
}

function downloadImage(index) {
    const imageBlob = currentImageBlobs[index];

    if (!imageBlob) {
        showError('No image available to download!');
        return;
    }

    const url = URL.createObjectURL(imageBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `generated-image-${index + 1}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function showLoading() {
    loadingDiv.classList.add('active');
}

function hideLoading() {
    loadingDiv.classList.remove('active');
}

function setLoadingMessage(message) {
    const messageElement = loadingDiv.querySelector('p');
    if (messageElement) {
        messageElement.textContent = message;
    }
}

function showResult() {
    resultDiv.classList.add('active');
}

function hideResult() {
    resultDiv.classList.remove('active');
}

function showError(message) {
    errorDiv.textContent = message;
    errorDiv.classList.add('active');
    setTimeout(() => {
        errorDiv.classList.remove('active');
    }, 5000);
}

function hideError() {
    errorDiv.classList.remove('active');
}

promptInput.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
        generateImage();
    }
});

console.log('Text-to-Image Generator Ready!');
