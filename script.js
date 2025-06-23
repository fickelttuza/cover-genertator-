// Configuration
const API_KEY = "sk-HXSiw5jbg5XRcgo2FSAlNmKSdBhPhY07tfU3NrNWFZf6B597";
let currentGenerationId = null;
let lastPrompt = "";
let lastParameters = {};
let isGenerating = false;
let generationHistory = [];
let selectedModel = null;
let selectedStyles = new Set(["realistic"]);
let enhanceOutput = false;
let creativityLevel = 50;

// Art Style to Model Compatibility Mapping
const styleToModelMap = {
  "realistic": ["stable-diffusion-xl-1024-v1-0", "stable-diffusion-xl-1024-v0-9"],
  "anime": ["stable-diffusion-xl-1024-v1-0"],
  "cyberpunk": ["stable-diffusion-xl-1024-v1-0"],
  "pixar": ["stable-diffusion-xl-1024-v1-0"],
  "vector": ["stable-diffusion-xl-1024-v1-0"],
  "fantasy": ["stable-diffusion-xl-1024-v1-0", "stable-diffusion-xl-1024-v0-9"],
  "vaporwave": ["stable-diffusion-xl-1024-v1-0"],
  "gothic": ["stable-diffusion-xl-1024-v1-0"],
  "concept": ["stable-diffusion-xl-1024-v1-0"],
  "steampunk": ["stable-diffusion-xl-1024-v1-0"]
};

// Valid AI Models
const availableModels = [
  {
    id: "stable-diffusion-xl-1024-v1-0",
    name: "SDXL 1.0",
    resolutions: ["1024x1024", "1152x896", "1216x832", "1344x768", "1536x640", "640x1536", "768x1344", "832x1216", "896x1152"],
    strengths: "High detail, versatile styles",
    maxSteps: 50
  },
  {
    id: "stable-diffusion-xl-1024-v0-9",
    name: "SDXL 0.9",
    resolutions: ["1024x1024", "1152x896", "1216x832", "1344x768", "1536x640", "640x1536", "768x1344", "832x1216", "896x1152"],
    strengths: "Previous version of SDXL",
    maxSteps: 50
  }
];

// Style Presets
const stylePresets = [
  { 
    id: "realistic", 
    name: "Realistic", 
    prompt: "photo-realistic, ultra-detailed, natural lighting",
    icon: "fas fa-camera"
  },
  { 
    id: "anime", 
    name: "Anime", 
    prompt: "anime style, cel shading, expressive characters",
    icon: "fas fa-moon"
  },
  { 
    id: "cyberpunk", 
    name: "Cyberpunk", 
    prompt: "cyberpunk, neon lights, dystopian, cinematic lighting",
    icon: "fas fa-city"
  },
  { 
    id: "pixar", 
    name: "Pixar 3D", 
    prompt: "Pixar-style 3D render, cute, stylized, soft lighting",
    icon: "fas fa-cube"
  },
  { 
    id: "vector", 
    name: "Flat/Vector", 
    prompt: "flat vector art, minimalism, bold shapes",
    icon: "fas fa-shapes"
  },
  { 
    id: "fantasy", 
    name: "Fantasy", 
    prompt: "digital painting, fantasy, high detail, ethereal",
    icon: "fas fa-dragon"
  },
  { 
    id: "vaporwave", 
    name: "Vaporwave", 
    prompt: "vaporwave, synthwave, 1980s style, neon grid",
    icon: "fas fa-sun"
  },
  { 
    id: "gothic", 
    name: "Gothic", 
    prompt: "dark, gothic, moody, chiaroscuro, oil painting",
    icon: "fas fa-skull"
  },
  { 
    id: "concept", 
    name: "Concept Art", 
    prompt: "concept art, environment design, cinematic view",
    icon: "fas fa-mountain"
  },
  { 
    id: "steampunk", 
    name: "Steampunk", 
    prompt: "steampunk, mechanical, brass and gears, Victorian",
    icon: "fas fa-cogs"
  }
];

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
const creativitySlider = document.getElementById('creativitySlider');
const modelGrid = document.getElementById('modelGrid');
const styleGrid = document.getElementById('styleGrid');
const timelineScroll = document.getElementById('timelineScroll');
const themeToggle = document.getElementById('themeToggle');
const enhanceToggleControl = document.getElementById('enhanceToggleControl');
const typePresets = document.querySelectorAll('.type-preset');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const navMenu = document.getElementById('navMenu');
const customSizeControl = document.getElementById('customSizeControl');
const widthInput = document.getElementById('widthInput');
const heightInput = document.getElementById('heightInput');
const upscaleBtn = document.getElementById('upscaleBtn');
const styleSearch = document.getElementById('styleSearch');

// Initialize the app
function init() {
    setupEventListeners();
    updateSliderDisplays();
    setupModelCompatibility();
    setupStylePresets();
    loadThemePreference();
    loadHistory();
    
    // Set first model as default
    setTimeout(() => {
        if (!selectedModel && availableModels.length > 0) {
            const firstModel = document.querySelector('.model-preset');
            if (firstModel) {
                firstModel.classList.add('active');
                selectedModel = availableModels[0];
                steps.max = selectedModel.maxSteps;
            }
        }
    }, 100);
}

// Setup event listeners
function setupEventListeners() {
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Enhance toggle
    enhanceToggleControl.addEventListener('click', function() {
        this.classList.toggle('active');
        enhanceOutput = this.classList.contains('active');
    });
    
    // Sliders
    document.querySelectorAll('.slider').forEach(slider => {
        slider.addEventListener('input', updateSliderDisplays);
    });
    
    // Buttons
    generateBtn.addEventListener('click', handleGenerateArt);
    downloadBtn.addEventListener('click', handleDownload);
    variationsBtn.addEventListener('click', handleCreateVariations);
    enhancePromptBtn.addEventListener('click', handleEnhancePrompt);
    randomizePromptBtn.addEventListener('click', handleRandomizePrompt);
    upscaleBtn.addEventListener('click', handleUpscale);
    
    // Generation type presets
    typePresets.forEach(preset => {
        preset.addEventListener('click', function() {
            typePresets.forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            
            // Show/hide custom size controls
            if (this.dataset.type === 'custom') {
                customSizeControl.style.display = 'flex';
            } else {
                customSizeControl.style.display = 'none';
            }
            
            setupModelCompatibility();
        });
    });
    
    // Style search
    styleSearch.addEventListener('input', filterStyles);
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        const isClickInsideNav = navMenu.contains(e.target) || mobileMenuBtn.contains(e.target);
        if (!isClickInsideNav && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
            mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        }
    });
}

// Set up model compatibility
function setupModelCompatibility() {
    modelGrid.innerHTML = '';
    
    // Get current generation type
    const activeType = document.querySelector('.type-preset.active');
    const currentType = activeType ? activeType.dataset.type : 'cover';
    
    // Get resolution for current type
    let resolution = getResolutionForType(currentType);
    
    // For custom type, use the input values
    if (currentType === 'custom') {
        const width = widthInput.value || 1024;
        const height = heightInput.value || 1024;
        resolution = `${width}x${height}`;
    }
    
    // Get compatible models based on selected styles
    let compatibleModels = availableModels;
    if (selectedStyles.size > 0) {
        const styleCompatibleModels = new Set();
        
        selectedStyles.forEach(styleId => {
            const modelsForStyle = styleToModelMap[styleId] || [];
            modelsForStyle.forEach(modelId => styleCompatibleModels.add(modelId));
        });
        
        compatibleModels = availableModels.filter(model => 
            styleCompatibleModels.has(model.id)
        );
    }
    
    // Create model buttons
    compatibleModels.forEach(model => {
        const modelBtn = document.createElement('div');
        modelBtn.className = 'model-preset';
        modelBtn.dataset.modelId = model.id;
        
        // Disable if resolution not supported
        const isCompatible = model.resolutions.includes(resolution);
        if (!isCompatible) {
            modelBtn.classList.add('disabled');
        }
        
        modelBtn.innerHTML = `
            <div class="model-icon"><i class="fas fa-robot"></i></div>
            <div>${model.name}</div>
            <small>${model.strengths}</small>
        `;
        modelGrid.appendChild(modelBtn);
        
        modelBtn.addEventListener('click', () => {
            if (modelBtn.classList.contains('disabled')) return;
            document.querySelectorAll('.model-preset').forEach(p => p.classList.remove('active'));
            modelBtn.classList.add('active');
            selectedModel = model;
            steps.max = model.maxSteps;
        });
    });
    
    // Select first compatible model by default
    if (compatibleModels.length > 0) {
        const firstModel = document.querySelector(`.model-preset[data-model-id="${compatibleModels[0].id}"]`);
        if (firstModel) {
            firstModel.classList.add('active');
            selectedModel = compatibleModels[0];
            steps.max = selectedModel.maxSteps;
        }
    } else {
        selectedModel = null;
        const warning = document.getElementById('modelWarning');
        warning.style.display = 'flex';
    }
}

// Filter styles based on search input
function filterStyles() {
    const searchTerm = styleSearch.value.toLowerCase();
    const stylePresets = document.querySelectorAll('.style-preset');
    
    stylePresets.forEach(preset => {
        const styleName = preset.querySelector('div:not(.style-icon)').textContent.toLowerCase();
        if (styleName.includes(searchTerm)) {
            preset.style.display = 'block';
        } else {
            preset.style.display = 'none';
        }
    });
}

// Set up style presets
function setupStylePresets() {
    styleGrid.innerHTML = '';
    
    stylePresets.forEach(style => {
        const styleBtn = document.createElement('div');
        styleBtn.className = 'style-preset';
        styleBtn.dataset.styleId = style.id;
        styleBtn.innerHTML = `
            <div class="style-icon"><i class="${style.icon}"></i></div>
            <div>${style.name}</div>
        `;
        styleGrid.appendChild(styleBtn);
        
        styleBtn.addEventListener('click', () => {
            // Toggle selection
            if (selectedStyles.has(style.id)) {
                selectedStyles.delete(style.id);
                styleBtn.classList.remove('active');
            } else {
                selectedStyles.add(style.id);
                styleBtn.classList.add('active');
            }
            
            // Update model compatibility
            setupModelCompatibility();
        });
    });
    
    // Select first style by default
    if (stylePresets.length > 0) {
        const firstStyle = document.querySelector('.style-preset');
        if (firstStyle) {
            firstStyle.classList.add('active');
            selectedStyles.add(stylePresets[0].id);
        }
    }
}

// Validate custom size inputs
function validateSize() {
    let width = parseInt(widthInput.value) || 1024;
    let height = parseInt(heightInput.value) || 1024;
    
    // Apply constraints and round to nearest 64
    width = Math.max(256, Math.min(2048, Math.round(width / 64) * 64));
    height = Math.max(256, Math.min(2048, Math.round(height / 64) * 64));
    
    // Validate pixel area (max 1,048,576 pixels)
    if (width * height > 1048576) {
        // Calculate scaling factor
        const scale = Math.sqrt(1048576 / (width * height));
        width = Math.max(256, Math.min(2048, Math.round(width * scale / 64) * 64));
        height = Math.max(256, Math.min(2048, Math.round(height * scale / 64) * 64));
    }
    
    widthInput.value = width;
    heightInput.value = height;
    
    // Update model compatibility
    setupModelCompatibility();
}

// Get resolution based on generation type
function getResolutionForType(type) {
    switch(type) {
        case "cover": return "1024x1024";
        case "youtube": return "1280x720";
        case "story": return "768x1344";
        default: return "1024x1024";
    }
}

// Find closest allowed resolution
function findClosestResolution(model, desiredWidth, desiredHeight) {
    if (model.resolutions.includes(`${desiredWidth}x${desiredHeight}`)) {
        return { width: desiredWidth, height: desiredHeight };
    }
    
    let closest = null;
    let minDiff = Infinity;
    
    for (const res of model.resolutions) {
        const [w, h] = res.split('x').map(Number);
        const diff = Math.abs(w - desiredWidth) + Math.abs(h - desiredHeight);
        
        if (diff < minDiff) {
            minDiff = diff;
            closest = { width: w, height: h };
        }
    }
    
    return closest || { width: 1024, height: 1024 };
}

// Update slider displays
function updateSliderDisplays() {
    document.querySelectorAll('.slider').forEach(slider => {
        const valueElement = slider.previousElementSibling.querySelector('span:last-child');
        if (slider.id === 'creativitySlider') {
            creativityLevel = slider.value;
            valueElement.textContent = `${slider.value}%`;
        } else {
            valueElement.textContent = slider.value;
        }
    });
}

// Toggle theme
function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const isLightTheme = document.body.classList.contains('light-theme');
    localStorage.setItem('theme', isLightTheme ? 'light' : 'dark');
    
    // Update icon
    const icon = themeToggle.querySelector('i');
    if (isLightTheme) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
}

// Load theme preference
function loadThemePreference() {
    const savedTheme = localStorage.getItem('theme');
    const icon = themeToggle.querySelector('i');
    
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        document.body.classList.remove('light-theme');
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
        localStorage.setItem('theme', 'dark');
    }
}

// Handle generate art
async function handleGenerateArt() {
    if (isGenerating) return;
    
    const prompt = promptTextarea.value.trim();
    if (!prompt) {
        showError("Please enter a prompt");
        return;
    }
    
    if (!selectedModel) {
        showError("Please select an AI model");
        return;
    }

    startGeneration();
    
    try {
        // Get current generation type
        const activeType = document.querySelector('.type-preset.active');
        const currentType = activeType ? activeType.dataset.type : 'cover';
        
        // Determine resolution
        let width, height;
        if (currentType === 'custom') {
            width = parseInt(widthInput.value) || 1024;
            height = parseInt(heightInput.value) || 1024;
            
            // Validate dimensions for selected model
            if (!selectedModel.resolutions.includes(`${width}x${height}`)) {
                const closest = findClosestResolution(selectedModel, width, height);
                const useClosest = confirm(
                    `The selected dimensions (${width}x${height}) aren't supported by ${selectedModel.name}.\n\n` +
                    `Would you like to generate at ${closest.width}x${closest.height} instead?`
                );
                
                if (useClosest) {
                    width = closest.width;
                    height = closest.height;
                } else {
                    throw new Error("Unsupported dimensions for selected model");
                }
            }
        } else {
            const resolution = getResolutionForType(currentType).split('x');
            width = parseInt(resolution[0]);
            height = parseInt(resolution[1]);
            
            // Validate dimensions for selected model
            if (!selectedModel.resolutions.includes(`${width}x${height}`)) {
                const closest = findClosestResolution(selectedModel, width, height);
                width = closest.width;
                height = closest.height;
            }
        }
        
        // Prepare parameters
        const parameters = {
            cfg_scale: parseFloat(cfgScale.value),
            steps: parseInt(steps.value),
            width,
            height,
            seed: creativityLevel > 0 ? Math.floor(Math.random() * 1000000) : 12345
        };
        
        // Apply prompt enhancement if enabled
        let finalPrompt = prompt;
        if (enhanceOutput) {
            finalPrompt = enhancePromptWithAI(prompt);
        }
        
        // Apply style presets
        if (selectedStyles.size > 0) {
            const styles = Array.from(selectedStyles)
                .map(id => stylePresets.find(s => s.id === id)?.prompt)
                .filter(Boolean);
            
            if (styles.length > 0) {
                finalPrompt += ", " + styles.join(", ");
            }
        }
        
        // Store for variations
        lastPrompt = finalPrompt;
        lastParameters = parameters;
        currentGenerationId = Date.now();
        
        // Generate image
        const imageBlob = await queryStabilityAI(selectedModel.id, finalPrompt, parameters);
        const imageUrl = URL.createObjectURL(imageBlob);
        
        // Display image
        displayGeneratedImage(imageUrl);
        
        // Add to timeline
        addToTimeline(imageUrl, finalPrompt);
        saveHistory();
        
    } catch (error) {
        handleGenerationError(error);
    } finally {
        endGeneration();
    }
}

// Query Stability AI API
async function queryStabilityAI(model, prompt, parameters) {
    const API_URL = `https://api.stability.ai/v1/generation/${model}/text-to-image`;
    
    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
            "Accept": "image/png"
        },
        body: JSON.stringify({
            text_prompts: [{
                text: prompt,
                weight: 1.0
            }],
            cfg_scale: parameters.cfg_scale,
            height: parameters.height,
            width: parameters.width,
            samples: 1,
            steps: parameters.steps,
            seed: parameters.seed
        }),
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate image");
    }
    
    return await response.blob();
}

// Enhance prompt with AI
function enhancePromptWithAI(prompt) {
    const enhancements = [
        "highly detailed, professional digital artwork",
        "sharp focus, studio lighting, 8k resolution",
        "trending on ArtStation, cinematic composition",
        "intricate details, professional color grading"
    ];
    
    const randomEnhancement = enhancements[Math.floor(Math.random() * enhancements.length)];
    return `${prompt}, ${randomEnhancement}`;
}

// Start generation
function startGeneration() {
    isGenerating = true;
    previewPlaceholder.innerHTML = '<i class="fas fa-spinner fa-spin"></i><p>Generating your art...</p>';
    previewPlaceholder.style.display = 'flex';
    coverPreview.style.display = 'none';
    generateBtn.classList.add('loading');
    generateBtn.disabled = true;
    downloadBtn.disabled = true;
    variationsBtn.disabled = true;
    upscaleBtn.disabled = true;
}

// End generation
function endGeneration() {
    isGenerating = false;
    generateBtn.classList.remove('loading');
    generateBtn.disabled = false;
    downloadBtn.disabled = false;
    variationsBtn.disabled = false;
    upscaleBtn.disabled = false;
}

// Display generated image
function displayGeneratedImage(imageUrl) {
    coverPreview.onload = function() {
        URL.revokeObjectURL(this.src); // Free memory
    };
    coverPreview.src = imageUrl;
    coverPreview.style.display = 'block';
    previewPlaceholder.style.display = 'none';
}

// Handle generation error
function handleGenerationError(error) {
    console.error("Generation error:", error);
    let errorMessage = error.message || "Generation failed";
    
    // Handle specific API errors
    if (errorMessage.includes("content_policy_violation")) {
        errorMessage = "Prompt violates content policy. Please modify your prompt.";
    } else if (errorMessage.includes("rate limit")) {
        errorMessage = "API rate limit exceeded. Please try again later.";
    } else if (errorMessage.includes("model not found")) {
        errorMessage = "Model not available. Please try a different model.";
    } else if (errorMessage.includes("width and height must be multiples of 64")) {
        errorMessage = "Image dimensions must be multiples of 64. Please adjust size.";
    } else if (errorMessage.includes("height * width must result in at most 1,048,576 pixels")) {
        errorMessage = "Image dimensions too large. Maximum allowed is 1024x1024 pixels.";
    } else if (errorMessage.includes("engine not found")) {
        errorMessage = "Model not found. Please select a different model.";
    } else if (errorMessage.includes("Unsupported dimensions")) {
        errorMessage = "The selected dimensions aren't supported by this model. Please try different dimensions or another model.";
    }
    
    showError(errorMessage);
}

// Show error
function showError(message) {
    // Remove existing errors
    document.querySelectorAll('.error-message').forEach(el => el.remove());
    
    const errorEl = document.createElement('div');
    errorEl.className = 'error-message';
    errorEl.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
    document.body.appendChild(errorEl);
    
    setTimeout(() => {
        errorEl.classList.add('visible');
        setTimeout(() => errorEl.remove(), 5000);
    }, 10);
}

// Handle enhance prompt
function handleEnhancePrompt() {
    if (!promptTextarea.value.trim()) {
        showError("Please enter a prompt first");
        return;
    }
    
    promptTextarea.value = enhancePromptWithAI(promptTextarea.value);
}

// Handle randomize prompt
function handleRandomizePrompt() {
    const randomPrompts = [
        "A majestic lion with a golden mane standing on a cliff at sunset, ultra detailed, cinematic lighting, 8k",
        "Cyberpunk city street at night with neon signs reflecting on wet pavement, futuristic, highly detailed",
        "Fantasy castle floating in the clouds, magical atmosphere, intricate details, digital painting",
        "Portrait of a steampunk inventor with intricate brass goggles, highly detailed, dramatic lighting",
        "Underwater scene with colorful coral reef and tropical fish, photorealistic, 8k resolution"
    ];
    
    promptTextarea.value = randomPrompts[Math.floor(Math.random() * randomPrompts.length)];
}

// Handle download
function handleDownload() {
    if (coverPreview.style.display !== 'block') {
        showError("Please generate an image first");
        return;
    }
    
    // Create canvas for format conversion
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = coverPreview.naturalWidth;
    canvas.height = coverPreview.naturalHeight;
    ctx.drawImage(coverPreview, 0, 0);
    
    // Convert to JPG
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `coverforge-${currentGenerationId || Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Handle create variations
function handleCreateVariations() {
    if (!lastPrompt) {
        showError("Please generate an image first");
        return;
    }
    
    handleGenerateArt();
}

// Handle upscale image
function handleUpscale() {
    if (coverPreview.style.display !== 'block') {
        showError("Please generate an image first");
        return;
    }
    
    // Create canvas for upscaling
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas to 2x size
    canvas.width = coverPreview.naturalWidth * 2;
    canvas.height = coverPreview.naturalHeight * 2;
    
    // Draw image with smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(coverPreview, 0, 0, canvas.width, canvas.height);
    
    // Create download
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `coverforge-upscaled-${currentGenerationId || Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Add to timeline
function addToTimeline(imageUrl, prompt) {
    const historyItem = {
        id: Date.now(),
        imageUrl,
        prompt,
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };
    
    generationHistory.unshift(historyItem);
    if (generationHistory.length > 10) generationHistory.pop();
    
    renderTimeline();
}

// Save history to localStorage
function saveHistory() {
    localStorage.setItem('generationHistory', JSON.stringify(generationHistory));
}

// Load history from localStorage
function loadHistory() {
    const savedHistory = localStorage.getItem('generationHistory');
    if (savedHistory) {
        generationHistory = JSON.parse(savedHistory);
        renderTimeline();
    }
}

// Render timeline
function renderTimeline() {
    timelineScroll.innerHTML = '';
    
    generationHistory.forEach(item => {
        const timelineItem = document.createElement('div');
        timelineItem.className = 'timeline-item';
        timelineItem.innerHTML = `
            <img src="${item.imageUrl}" alt="Generated art" class="timeline-image">
            <div class="timeline-details">
                <p class="timeline-prompt" title="${item.prompt}">${item.prompt.substring(0, 30)}${item.prompt.length > 30 ? '...' : ''}</p>
                <p class="timeline-time">${item.timestamp}</p>
                <div class="timeline-actions">
                    <button class="regen-btn" data-id="${item.id}" aria-label="Regenerate"><i class="fas fa-redo"></i></button>
                    <button class="download-btn" data-url="${item.imageUrl}" aria-label="Download"><i class="fas fa-download"></i></button>
                    <button class="delete-btn" data-id="${item.id}" aria-label="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
        timelineScroll.appendChild(timelineItem);
    });
    
    // Add event listeners for timeline actions
    document.querySelectorAll('.regen-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemId = this.dataset.id;
            const item = generationHistory.find(i => i.id == itemId);
            if (item) {
                promptTextarea.value = item.prompt;
                handleGenerateArt();
            }
        });
    });
    
    document.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const imageUrl = this.dataset.url;
            const link = document.createElement('a');
            link.href = imageUrl;
            link.download = `coverforge-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemId = this.dataset.id;
            generationHistory = generationHistory.filter(i => i.id != itemId);
            renderTimeline();
            saveHistory();
        });
    });
}

// Initialize the app
init();