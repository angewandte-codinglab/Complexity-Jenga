import * as THREE from 'three';
import { state } from './state.js';
import { initGraphics, render } from './graphics.js';
import { initPhysics, createObjects } from './physics.js';
import { initInput } from './input.js';
import { initGUI, applyCameraPreset } from './gui.js'; // Import the GUI
import { loadCentralityGraph, loadPageRankGraph } from './legend.js';
import { loadGlobalNetworkGraph } from './infographics.js';

// Utility functions for loading and error management
function updateLoadingText(text, detail = '') {
    const loadingText = document.getElementById('loading-text');
    const loadingDetail = document.getElementById('loading-detail');
    if (loadingText) loadingText.textContent = text;
    if (loadingDetail) loadingDetail.textContent = detail;
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.style.display = 'none', 300);
    }
}

function showError(title, message) {
    const errorBanner = document.getElementById('error-banner');
    const errorTitle = document.getElementById('error-title');
    const errorMessage = document.getElementById('error-message');
    
    if (errorBanner && errorTitle && errorMessage) {
        errorTitle.textContent = title;
        errorMessage.textContent = message;
        errorBanner.classList.remove('d-none');
    }
    
    // Also log to console for debugging
    console.error(`${title}: ${message}`);
}

// Initialize Ammo.js physics engine and start the application
updateLoadingText('Loading Physics Engine...', 'Initializing Bullet Physics via WebAssembly');

Ammo().then(function(AmmoLib) {
    try {
        Ammo = AmmoLib; // Store Ammo globally for use in other modules
        updateLoadingText('Physics Engine Loaded', 'Initializing 3D environment...');
        init();
    } catch (error) {
        showError('Physics Engine Error', 'Failed to initialize Bullet Physics: ' + error.message);
        hideLoading();
    }
}).catch(function(error) {
    showError('Loading Error', 'Failed to load physics engine. Please refresh the page.');
    hideLoading();
});

function init() {
    try {
        updateLoadingText('Setting up 3D Graphics...', 'Initializing WebGL renderer and scene');
        initGraphics();
        
        updateLoadingText('Configuring Physics World...', 'Setting up collision detection and dynamics');
        initPhysics();
        
        updateLoadingText('Setting up User Interface...', 'Initializing controls and interactions');
        initInput();
        initGUI();

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

        updateLoadingText('Loading Data and Creating Tower...', 'Building the complexity tower from supply chain data');
        
        // Create initial objects (ground plane, tower)
        createObjects();
        
        // Start animation loop
        state.renderer.setAnimationLoop(animate);
        
        // Hide loading overlay after everything is ready
        setTimeout(() => {
            hideLoading();
        }, 500); // Small delay to ensure everything is rendered
        
    } catch (error) {
        showError('Initialization Error', 'Failed to initialize the application: ' + error.message);
        hideLoading();
    }
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