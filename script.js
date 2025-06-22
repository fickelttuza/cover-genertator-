// Configuration for Mage.Space API
let currentGenerationId = null;
let lastPrompt = "";
let lastParameters = {};
let isGenerating = false;
let selectedModel = "dreamlike-diffusion";

// DOM Elements
const generateBtn = document.getElementById('generateBtn');
const promptTextarea = document.getElementById('promptTextarea');
const coverPreview = document.getElementById('coverPreview');
const previewPlaceholder = document.querySelector('.preview-placeholder');
const downloadBtn = document.getElementById('downloadBtn');
const variationsBtn = document.getElementById('variationsBtn');
const enhancePromptBtn = document.getElementById('enhancePromptBtn');
const randomizePromptBtn = document.getElementById('randomizePromptBtn');
const cfgScale = document.getElementById('cfgScale');
const steps = document.getElementById('steps');
const sizeSelect = document.getElementById('sizeSelect');
const stylePresets = document.querySelectorAll('.style-preset');

// Initialize the app
function init() {
    setupEventListeners();
    updateSliderDisplays();
    selectFirstStyle();
}

function selectFirstStyle() {
    if (stylePresets.length > 0) {
        stylePresets[0].classList.add('active');
        selectedModel = stylePresets[0].dataset.model;
    }
}

function setupEventListeners() {
    // Sliders
    document.querySelectorAll('.slider').forEach(slider => {
        slider.addEventListener('input', updateSliderDisplays);
    });
    
    // Style presets
    stylePresets.forEach(preset => {
        preset.addEventListener('click', () => {
            stylePresets.forEach(p => p.classList.remove('active'));
            preset.classList.add('active');
            selectedModel = preset.dataset.model;
        });
    });

    // Buttons
    enhancePromptBtn.addEventListener('click', handleEnhancePrompt);
    randomizePromptBtn.addEventListener('click', handleRandomizePrompt);
    generateBtn.addEventListener('click', handleGenerateArt);
    downloadBtn.addEventListener('click', handleDownload);
    variationsBtn.addEventListener('click', handleCreateVariations);
    
    // Mobile menu
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navMenu = document.getElementById('navMenu');
    mobileMenuBtn.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        mobileMenuBtn.innerHTML = navMenu.classList.contains('active') ? 
            '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
    });
}

function updateSliderDisplays() {
    document.querySelectorAll('.slider').forEach(slider => {
        const valueElement = slider.previousElementSibling.querySelector('span:last-child');
        valueElement.textContent = slider.value;
    });
}

async function handleGenerateArt() {
    if (isGenerating) return;
    
    const prompt = promptTextarea.value.trim();
    if (!prompt) {
        showError("Please enter a prompt");
        return;
    }

    startGeneration();
    
    try {
        // Prepare parameters
        const [width, height] = sizeSelect.value.split('x').map(Number);
        const parameters = {
            cfg_scale: parseFloat(cfgScale.value),
            steps: parseInt(steps.value),
            width,
            height
        };
        
        // Store for variations
        lastPrompt = prompt;
        lastParameters = parameters;
        currentGenerationId = Date.now();
        
        const imageBlob = await queryMageSpace(selectedModel, prompt, parameters);
        displayGeneratedImage(imageBlob);
        
    } catch (error) {
        handleGenerationError(error);
    } finally {
        endGeneration();
    }
}

function startGeneration() {
    isGenerating = true;
    previewPlaceholder.innerHTML = '<i class="fas fa-spinner fa-spin"></i><p>Generating your art...</p>';
    previewPlaceholder.style.display = 'flex';
    coverPreview.style.display = 'none';
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
}

function endGeneration() {
    isGenerating = false;
    generateBtn.disabled = false;
    generateBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Generate Art';
}

async function queryMageSpace(model, prompt, parameters) {
    const API_URL = "https://api.mage.space/generate";
    
    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            prompt: prompt,
            model: model,
            negative_prompt: "",
            width: parameters.width,
            height: parameters.height,
            guidance_scale: parameters.cfg_scale,
            steps: parameters.steps,
            sampler: "Euler a",
            seed: -1, // Random seed
            upscale: false
        }),
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate image");
    }
    
    const data = await response.json();
    
    if (data.status !== "success" || !data.output || !data.output[0]) {
        throw new Error("Image generation failed");
    }
    
    // Fetch the actual image
    const imageResponse = await fetch(data.output[0]);
    if (!imageResponse.ok) {
        throw new Error("Failed to download generated image");
    }
    
    return await imageResponse.blob();
}

function displayGeneratedImage(imageBlob) {
    const imageUrl = URL.createObjectURL(imageBlob);
    coverPreview.onload = () => {
        URL.revokeObjectURL(imageUrl); // Clean up memory
    };
    coverPreview.src = imageUrl;
    coverPreview.style.display = 'block';
    previewPlaceholder.style.display = 'none';
}

function handleGenerationError(error) {
    console.error("Generation error:", error);
    let errorMessage = error.message || "Generation failed";
    
    // Handle specific errors
    if (errorMessage.includes("content policy")) {
        errorMessage = "Prompt violates content policy. Please modify your prompt.";
    } else if (errorMessage.includes("rate limit")) {
        errorMessage = "Too many requests. Please try again later.";
    }
    
    showError(errorMessage);
}

function showError(message) {
    previewPlaceholder.innerHTML = `<i class="fas fa-exclamation-triangle"></i><p>${message}</p>`;
    previewPlaceholder.style.display = 'flex';
    coverPreview.style.display = 'none';
}

function handleEnhancePrompt() {
    if (!promptTextarea.value.trim()) {
        showError("Please enter a prompt first");
        return;
    }
    
    promptTextarea.value = enhancePrompt(promptTextarea.value);
}

function enhancePrompt(prompt) {
    // Basic prompt enhancement
    let enhanced = prompt;
    
    if (!enhanced.includes("highly detailed")) {
        enhanced += ", highly detailed";
    }
    if (!enhanced.includes("professional")) {
        enhanced += ", professional artwork";
    }
    if (!enhanced.includes("trending on ArtStation")) {
        enhanced += ", trending on ArtStation";
    }
    
    return enhanced;
}

function handleRandomizePrompt() {
    const randomPrompts = [
        "A majestic lion with a golden mane standing on a cliff at sunset, ultra detailed, cinematic lighting",
        "Cyberpunk city street at night with neon signs reflecting on wet pavement, futuristic",
        "Fantasy castle floating in the clouds, magical atmosphere, intricate details",
        "Portrait of a steampunk inventor with intricate brass goggles, highly detailed",
        "Underwater scene with colorful coral reef and tropical fish, photorealistic"
    ];
    
    promptTextarea.value = randomPrompts[Math.floor(Math.random() * randomPrompts.length)];
}

function handleDownload() {
    if (coverPreview.style.display !== 'block') {
        showError("Please generate an image first");
        return;
    }
    
    const link = document.createElement('a');
    link.href = coverPreview.src;
    link.download = `coverforge-${currentGenerationId || Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function handleCreateVariations() {
    if (!lastPrompt) {
        showError("Please generate an image first");
        return;
    }
    
    // Generate with same parameters
    startGeneration();
    
    queryMageSpace(selectedModel, lastPrompt, lastParameters)
        .then(imageBlob => {
            displayGeneratedImage(imageBlob);
        })
        .catch(error => {
            handleGenerationError(error);
        })
        .finally(() => {
            endGeneration();
        });
}

// Initialize the app
init();