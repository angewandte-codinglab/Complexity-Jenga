import * as THREE from 'three';
import { state } from './state.js';
import { initGraphics, render } from './graphics.js';
import { initPhysics, createObjects } from './physics.js';
import { initInput } from './input.js';
import { initGUI, applyCameraPreset } from './gui.js'; // Import the GUI
import { loadCentralityGraph, loadPageRankGraph } from './legend.js';
import { loadGlobalNetworkGraph } from './infographics.js';

// Error handling utility functions
export function showUserError(message, type = 'warning') {
    const errorBanner = document.getElementById('error-banner');
    const errorMessage = document.getElementById('error-message');
    
    if (errorBanner && errorMessage) {
        errorMessage.textContent = message;
        errorBanner.className = `alert alert-${type === 'critical' ? 'danger' : 'warning'} alert-dismissible`;
        errorBanner.style.display = 'block';
        
        // Auto-hide non-critical errors after 5 seconds
        if (type !== 'critical') {
            setTimeout(() => {
                errorBanner.style.display = 'none';
            }, 5000);
        }
    } else {
        // Fallback to console if banner doesn't exist
        console.error(`USER ERROR (${type}):`, message);
        alert(message);
    }
}

function checkWebGLSupport() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        return !!gl;
    } catch (e) {
        return false;
    }
}

// Loading state management
const DISABLE_LOADING_SCREEN = false; // Set to true to disable loading screen for debugging

export function updateLoadingState(text, details = '') {
    console.log(`🔄 Loading state: ${text} - ${details}`);
    const loadingText = document.getElementById('loading-text');
    const loadingDetails = document.getElementById('loading-details');
    
    if (loadingText) loadingText.textContent = text;
    if (loadingDetails) loadingDetails.textContent = details;
}

export function hideLoadingOverlay() {
    console.log('🚫 Attempting to hide loading overlay...');
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        if (DISABLE_LOADING_SCREEN) {
            console.log('⚠️ Loading screen disabled - hiding immediately');
            overlay.style.setProperty('display', 'none', 'important');
            overlay.style.setProperty('visibility', 'hidden', 'important');
            overlay.style.setProperty('opacity', '0', 'important');
            return;
        }
        
        console.log('✅ Loading overlay found, hiding now');
        console.log('Current overlay styles:', {
            display: overlay.style.display,
            visibility: overlay.style.visibility,
            opacity: overlay.style.opacity,
            zIndex: overlay.style.zIndex
        });
        
        // Use multiple methods to ensure hiding works
        overlay.style.setProperty('display', 'none', 'important');
        overlay.style.setProperty('visibility', 'hidden', 'important');
        overlay.style.setProperty('opacity', '0', 'important');
        overlay.classList.add('d-none'); // Bootstrap utility class
        
        console.log('✅ Loading overlay hidden successfully');
        console.log('New overlay styles:', {
            display: overlay.style.display,
            visibility: overlay.style.visibility,
            opacity: overlay.style.opacity
        });
    } else {
        console.error('❌ Loading overlay element not found!');
    }
}

export function showLoadingOverlay() {
    if (DISABLE_LOADING_SCREEN) {
        console.log('⚠️ Loading screen disabled - not showing');
        return;
    }
    
    console.log('🔄 Showing loading overlay...');
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.setProperty('display', 'flex', 'important');
        overlay.style.setProperty('visibility', 'visible', 'important');
        overlay.style.setProperty('opacity', '1', 'important');
        overlay.classList.remove('d-none');
        console.log('✅ Loading overlay shown');
    } else {
        console.error('❌ Loading overlay element not found!');
    }
}

// Manual loading screen control for debugging - accessible from browser console
window.debugLoading = {
    hide: () => {
        console.log('🛠️ Manual hide loading screen');
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.style.display = 'none !important';
    },
    show: () => {
        console.log('🛠️ Manual show loading screen');
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.style.display = 'flex';
    },
    toggle: () => {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            const isVisible = overlay.style.display !== 'none';
            overlay.style.display = isVisible ? 'none !important' : 'flex';
            console.log(`🛠️ Loading screen ${isVisible ? 'hidden' : 'shown'}`);
        }
    }
};

// Initialize Ammo.js physics engine and start the application
Ammo().then(function(AmmoLib) {
    Ammo = AmmoLib; // Store Ammo globally for use in other modules
    
    // Check WebGL support before initializing
    if (!checkWebGLSupport()) {
        showUserError('Your browser does not support WebGL, which is required for 3D visualization. Please use a modern browser like Chrome, Firefox, or Safari.', 'critical');
        return;
    }
    
    init();
}).catch(function(error) {
    console.error('Failed to initialize Ammo.js physics engine:', error);
    showUserError('Failed to load 3D physics engine. Please refresh the page or try a different browser.', 'critical');
});

function init() {
    try {
        updateLoadingState('Setting up 3D graphics...', 'Creating scene and renderer');
        initGraphics();
        
        updateLoadingState('Initializing physics simulation...', 'Setting up collision detection');
        initPhysics();
        
        updateLoadingState('Loading data...', 'Processing semiconductor network data');
        initInput();
        initGUI();
    } catch (error) {
        console.error('Initialization failed:', error);
        showUserError('Failed to initialize the application. Please refresh the page.', 'critical');
        return;
    }


    // Load the centrality or page rank graph when click to uncollapseAdd commentMore actions
    const legendBetweenness = document.getElementById('legend-betweenness');
    legendBetweenness.addEventListener('show.bs.collapse', function() {
        loadCentralityGraph(legendBetweenness);
    })
    const legendPageRank = document.getElementById('legend-pagerank');
    legendPageRank.addEventListener('show.bs.collapse', function() {
        loadPageRankGraph(legendPageRank);
    })

    // Load the relevant information when "About" modal is shown
    const aboutModal = document.getElementById('about-modal');
    aboutModal.addEventListener('show.bs.modal', function() {
        //to fill if needed
        d3.select('#color-legend').selectAll('.color-legend').data(state.colorScale.domain())
            .join('div').attr('class', 'color-legend me-2 d-flex align-items-center')
            .html(d => `<span class="me-1" style="background-color:${state.colorScale(d)}"></span>${d}`)
    });

    // Create initial objects (ground plane, tower)
    updateLoadingState('Loading...', 'Loading....');
    createObjects();
    
    // Start animation loop
    state.renderer.setAnimationLoop(animate);
}


function animate() {
    render();
}

function showGraph(type) {
    const container = document.getElementById('legend-graph');
    if (container) {
        container.parentNode.querySelectorAll('button').forEach(button => {
            if (button.getAttribute('data-name') === type) {
                button.classList.add('enable');
            } else {
                button.classList.remove('enable');
            }
        });
        container.innerHTML = '';
        if (type === 'centrality') {
            loadCentralityGraph('#legend-graph');
        } else if (type === 'pagerank') {
            loadPageRankGraph('#legend-graph');
        }
    }
}

// Attach functions to the window to make them accessible globally
window.showGraph = showGraph;
window.loadCentralityGraph = loadCentralityGraph;
window.loadPageRankGraph = loadPageRankGraph;
window.loadGlobalNetworkGraph = loadGlobalNetworkGraph;  