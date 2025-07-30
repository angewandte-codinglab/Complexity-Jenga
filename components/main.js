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
        overlay.style.pointerEvents = 'none'; // Disable pointer events immediately
        setTimeout(() => {
            overlay.style.display = 'none';
            overlay.remove(); // Completely remove from DOM
        }, 300);
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

function debugSettings() {
    console.group('🔧 Complexity-Jenga Debug Settings');
    
    console.group('⚛️ Physics Settings');
    console.log('Gravity:', state.gravityConstant);
    console.log('Collision Margin:', state.margin);
    console.log('Time Division:', state.timeDiv || state.defaultTimeDiv);
    console.log('Show All Bricks:', state.showAllBricks);
    console.groupEnd();
    
    console.group('📦 Brick Dimensions');
    const brickLength = 1.2 * 4;
    const brickDepth = brickLength / 3;
    const brickHeight = brickLength / 4;
    const brickMass = 100;
    console.log('Length:', brickLength);
    console.log('Depth:', brickDepth);
    console.log('Height:', brickHeight);
    console.log('Mass:', brickMass);
    console.log('Volume:', brickLength * brickDepth * brickHeight);
    console.groupEnd();
    
    console.group('🎮 Physics Body Settings');
    console.log('Friction:', 0.5);
    console.log('Restitution:', 0.4);
    console.log('Linear Damping:', 0.01);
    console.log('Angular Damping:', 0.4);
    console.log('CCD Motion Threshold:', 0.1);
    console.log('CCD Swept Sphere Radius:', 0.05);
    console.log('Sleeping Thresholds:', '0.01, 0.01');
    console.log('Activation State:', '4 (DISABLE_DEACTIVATION)');
    console.log('Force Activate on Creation:', 'true');
    console.groupEnd();
    
    console.group('🎨 Graphics Settings');
    console.log('Renderer Size:', state.renderer ? `${state.renderer.domElement.width}x${state.renderer.domElement.height}` : 'Not initialized');
    console.log('Shadow Map Type:', 'PCFSoftShadowMap');
    console.log('Shadow Map Size:', '1024x1024');
    console.log('Camera FOV:', 60);
    console.log('Camera Near:', 1);
    console.log('Camera Far:', 1000);
    console.groupEnd();
    
    console.group('🏗️ Tower Construction');
    console.log('Layer Height Formula:', 'j * brickHeight + brickHeight / 2');
    console.log('Height Offset:', 0);
    console.log('Bricks Per Layer:', 3);
    console.log('Layer Rotation:', 'Alternating 90° (odd layers)');
    console.groupEnd();
    
    console.group('🎯 Performance Settings');
    console.log('Physics Solver Iterations:', 60);
    console.log('Physics Step Max Sub Steps:', 100);
    console.log('Animation Loop:', 'requestAnimationFrame');
    console.groupEnd();
    
    console.groupEnd();
}

function init() {
    try {
        updateLoadingText('Setting up 3D Graphics...', 'Initializing WebGL renderer and scene');
        initGraphics();
        
        updateLoadingText('Configuring Physics World...', 'Setting up collision detection and dynamics');
        initPhysics();
        
        // Output debug settings after physics initialization
        debugSettings();
        
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