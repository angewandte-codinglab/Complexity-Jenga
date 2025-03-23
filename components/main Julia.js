import * as THREE from 'three';
import { state } from './state.js';
import { initGraphics, render } from './graphics.js';
import { initPhysics, createObjects } from './physics.js';
import { initInput } from './input.js';
import { initGUI, applyCameraPreset } from './gui.js';  // Import the GUI
import { loadCentralityGraph, loadPageRankGraph, loagTilesGraph } from './legend.js';


// Initialize Ammo.js physics engine and start the application
Ammo().then(function(AmmoLib) {
    Ammo = AmmoLib; // Store Ammo globally for use in other modules
    init();
});

function init() {
    // Initialize graphics (scene, camera, renderer, lights)
    initGraphics();
    
    // Initialize physics world
    initPhysics();
    
    // Initialize input handlers and UI
    initInput();
    
    // Initialize GUI controls
    initGUI();
    
    // Select random camera preset
    const presets = Object.keys(state.cameraPresets);
    const randomPreset = presets[Math.floor(Math.random() * presets.length)];
    applyCameraPreset(randomPreset);

   // Load the centrality or page rank graph when the "Legend" modal is shown
	const legendModal = document.getElementById('legend-modal');
	legendModal.addEventListener('show.bs.modal', function () {
		// Clear any existing graph to prevent duplicates
		const container = document.getElementById('legend-graph');
		if (container) {
			container.innerHTML = '';

			// Default to centrality graph initially
			loadCentralityGraph('#legend-graph');
		}
	});

	// Load the relevant information when "About" modal is shown
	const aboutModal = document.getElementById('about-modal');
	aboutModal.addEventListener('show.bs.modal', function () {
		//to fill if needed
	});


		// Create initial objects (ground plane, Jenga tower)
		createObjects();
		
		// Start animation loop
		state.renderer.setAnimationLoop(animate);
	}
	

function animate() {
    // Log camera position
    const pos = state.camera.position;
    const rot = state.camera.rotation;
    const orb = state.orbitControls.target;
    console.log(
        `Camera Position: x: ${pos.x.toFixed(2)}, y: ${pos.y.toFixed(2)}, z: ${pos.z.toFixed(2)}`,
        `\nRotation: x: ${rot.x.toFixed(2)}, y: ${rot.y.toFixed(2)}, z: ${rot.z.toFixed(2)}`,
        `\nOrbit: x: ${orb.x.toFixed(2)}, y: ${orb.y.toFixed(2)}, z: ${orb.z.toFixed(2)}`
    );
    
    render();
    
    // Stats update if needed
    // if (stats) stats.update();
}
function showGraph(type) {
    const container = document.getElementById('legend-graph');
    if (container) {
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
