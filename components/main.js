import * as THREE from 'three';
import { state } from './state.js';
import { initGraphics, render } from './graphics.js';
import { initPhysics, createObjects } from './physics.js';
import { initInput } from './input.js';
import { initGUI } from './gui.js';  // Import the GUI


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
    // initGUI();
    
    
    // Create initial objects (ground plane, Jenga tower)
    createObjects();
    
    // Start animation loop
    state.renderer.setAnimationLoop(animate);
}

function animate() {
    // Render the scene
    render();
    
    // Stats update if needed
    // if (stats) stats.update();
}