import * as THREE from 'three';
import { GUI } from 'three/addons/lil-gui.module.min.js';
import { state } from './state.js';

// GUI state object
let gui;

export function initGUI() {
    // Create the GUI
    gui = new GUI();
    
    // Create Tone Mapping folder
    setupToneMappingGUI();

    // Create Physics Controls folder
    setupPhysicsGUI();
    
    // Create Material Controls folder 
    setupMaterialGUI();
}

function setupToneMappingGUI() {
    const toneMappingFolder = gui.addFolder('Tone Mapping');
    
    const toneMappings = {
        'None': THREE.NoToneMapping,
        'Linear': THREE.LinearToneMapping,
        'Reinhard': THREE.ReinhardToneMapping,
        'Cineon': THREE.CineonToneMapping,
        'ACES Filmic': THREE.ACESFilmicToneMapping,
        'AgX': THREE.AgXToneMapping,
        'Neutral': THREE.NeutralToneMapping
    };
    
    // Settings object for the controller
    const settings = { 
        toneMapping: 'None',
        exposure: 1.0
    };
    
    // Add tone mapping controller
    toneMappingFolder.add(settings, 'toneMapping', Object.keys(toneMappings))
        .name('Tone Mapping')
        .onChange((value) => {
            state.renderer.toneMapping = toneMappings[value];
            
            // Update all custom shader materials
            state.rigidBodies.forEach(obj => {
                if (obj.material && obj.material.uniforms && obj.material.uniforms.toneMapping) {
                    obj.material.uniforms.toneMapping.value = toneMappings[value];
                }
            });
            
            state.renderer.needsUpdate = true;
        });
    
    // Add exposure controller
    toneMappingFolder.add(settings, 'exposure', 0, 2, 0.01)
        .name('Exposure')
        .onChange((value) => {
            state.renderer.toneMappingExposure = value;
            
            // Update all custom shader materials
            state.rigidBodies.forEach(obj => {
                if (obj.material && obj.material.uniforms && obj.material.uniforms.toneMappingExposure) {
                    obj.material.uniforms.toneMappingExposure.value = value;
                }
            });
        });
    
    toneMappingFolder.open();
}
function setupPhysicsGUI() {
    const physicsFolder = gui.addFolder('Physics');
    
    physicsFolder.add(state, 'runPhysics')
        .name('Run Simulation')
        .onChange((value) => {
            // Optional: Add additional logic when physics is toggled
        });
        
    physicsFolder.add(state, 'timeDiv', 0.5, 10, 0.5)
        .name('Time Division')
        .onChange((value) => {
            state.timeDiv = value;
        });
    
    physicsFolder.open();
}

function setupMaterialGUI() {
    // Shader material options
    const materialFolder = gui.addFolder('Brick Material');
    
    // Add thickness control for brick outlines
    materialFolder.add({ thickness: 1.0 }, 'thickness', 0.5, 5, 0.1)
        .name('Outline Thickness')
        .onChange((value) => {
            // Update all existing materials
            state.rigidBodies.forEach(obj => {
                if (obj.material && obj.material.uniforms && obj.material.uniforms.thickness) {
                    obj.material.uniforms.thickness.value = value;
                }
            });
        });
    
    materialFolder.open();
}