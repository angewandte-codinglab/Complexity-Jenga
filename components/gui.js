import * as THREE from 'three';
import { GUI } from 'three/addons/lil-gui.module.min.js';
import { state } from './state.js';

// GUI state object
let gui;

export function initGUI() {
    // Create the GUI
    gui = new GUI();

    // Camera presets
    setupCameraGUI();
    
    // Create Tone Mapping folder
    setupToneMappingGUI();

    // Create Physics Controls folder
    // setupPhysicsGUI();

    // Add lights controls
    setupLightsGUI();
    
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
        toneMapping: 'ACES Filmic',
        exposure: 1.0
    };

    state.renderer.toneMapping = toneMappings[settings.toneMapping]
    
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

function setupLightsGUI() {
    const lightsFolder = gui.addFolder('Lights');

    // Find lights in the scene
    const ambientLight = state.scene.children.find(child => child instanceof THREE.AmbientLight);
    const hemisphereLight = state.scene.children.find(child => child instanceof THREE.HemisphereLight);
    const directionalLight = state.scene.children.find(child => child instanceof THREE.DirectionalLight);

    // Store initial light settings
    const lightSettings = {
        ambient: {
            enabled: true,
            color: '#f7f3ff',
            intensity: 1
        },
        hemisphere: {
            enabled: true,
            skyColor: '#596df9',
            groundColor: '#e5e4e4',
            intensity: 1
        },
        directional: {
            enabled: true,
            color: '#ffebc5',
            intensity: 3,
            position: {
                x: -40,
                y: 40,
                z: 20
            }
        }
    };

    // Ambient Light Controls
    const ambientFolder = lightsFolder.addFolder('Ambient Light');
    ambientFolder.add(lightSettings.ambient, 'enabled')
        .name('Enabled')
        .onChange(value => {
            ambientLight.visible = value;
        });
    ambientFolder.addColor(lightSettings.ambient, 'color')
        .name('Color')
        .onChange(value => {
            ambientLight.color.set(value);
        });
    ambientFolder.add(lightSettings.ambient, 'intensity', 0, 5)
        .name('Intensity')
        .onChange(value => {
            ambientLight.intensity = value;
        });

    // Hemisphere Light Controls
    const hemiFolder = lightsFolder.addFolder('Hemisphere Light');
    hemiFolder.add(lightSettings.hemisphere, 'enabled')
        .name('Enabled')
        .onChange(value => {
            hemisphereLight.visible = value;
        });
    hemiFolder.addColor(lightSettings.hemisphere, 'skyColor')
        .name('Sky Color')
        .onChange(value => {
            hemisphereLight.color.set(value);
        });
    hemiFolder.addColor(lightSettings.hemisphere, 'groundColor')
        .name('Ground Color')
        .onChange(value => {
            hemisphereLight.groundColor.set(value);
        });
    hemiFolder.add(lightSettings.hemisphere, 'intensity', 0, 5)
        .name('Intensity')
        .onChange(value => {
            hemisphereLight.intensity = value;
        });

    // Directional Light Controls
    const dirFolder = lightsFolder.addFolder('Directional Light');
    dirFolder.add(lightSettings.directional, 'enabled')
        .name('Enabled')
        .onChange(value => {
            directionalLight.visible = value;
        });
    dirFolder.addColor(lightSettings.directional, 'color')
        .name('Color')
        .onChange(value => {
            directionalLight.color.set(value);
        });
    dirFolder.add(lightSettings.directional, 'intensity', 0, 10)
        .name('Intensity')
        .onChange(value => {
            directionalLight.intensity = value;
        });
    
    // Directional Light Position Controls
    const posFolder = dirFolder.addFolder('Position');
    posFolder.add(lightSettings.directional.position, 'x', -100, 100)
        .onChange(() => updateDirectionalLightPosition());
    posFolder.add(lightSettings.directional.position, 'y', -100, 100)
        .onChange(() => updateDirectionalLightPosition());
    posFolder.add(lightSettings.directional.position, 'z', -100, 100)
        .onChange(() => updateDirectionalLightPosition());

    function updateDirectionalLightPosition() {
        directionalLight.position.set(
            lightSettings.directional.position.x,
            lightSettings.directional.position.y,
            lightSettings.directional.position.z
        );
    }

    // Open the lights folder by default
    lightsFolder.open();
}

function setupCameraGUI() {
    const cameraFolder = gui.addFolder('Camera');
    
    // Create dropdown options
    const presetOptions = Object.keys(state.cameraPresets);
    
    // Create settings object and store it in state for external access
    state.cameraSettings = {
        preset: state.currentPreset
    };

    // Add dropdown to GUI and store controller in state
    state.presetController = cameraFolder.add(state.cameraSettings, 'preset', presetOptions)
        .name('Camera Preset')
        .onChange((value) => {
            applyCameraPreset(value);
        });
        
    cameraFolder.open();
}

export function applyCameraPreset(presetName) {
    const preset = state.cameraPresets[presetName];
    if (!preset) return;
    
    // Set position and rotation
    state.camera.position.copy(preset.position);
    state.camera.rotation.set(
        preset.rotation.x,
        preset.rotation.y,
        preset.rotation.z,
        'XYZ'
    );
    
    // Update orbit controls target
    if (preset.orbit) {
        state.orbitControls.target.copy(preset.orbit);
    }
    
    // Update current preset and GUI
    state.currentPreset = presetName;
    if (state.cameraSettings) {
        state.cameraSettings.preset = presetName;
        state.presetController.updateDisplay();
    }
    
    state.orbitControls.update();
}