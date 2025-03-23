import * as THREE from 'three';

const cameraPresets = {
    Untitled: {
        position: new THREE.Vector3(-110.15, 31.36, -79.78),
        rotation: new THREE.Euler(-2.91, -0.98, -2.95),
        orbit: new THREE.Vector3(4.81, 13.52, -4.62)
    },
    Against: {
        position: new THREE.Vector3(98.5, 40.00, -61.2),
        rotation: new THREE.Euler(-2.8, 1, 2.85),
        orbit: new THREE.Vector3(0.3, 15.2, 7.67)
    },
    Frontal: {
        position: new THREE.Vector3(-118.08, 45.50, -3.64),
        rotation: new THREE.Euler(-1.58, -1.30, -1.58),
        orbit: new THREE.Vector3(2.73, 11.70, -3.32)
    },
    Immersive: {
        position: new THREE.Vector3(-58.62, 62.64, -1.58),
        rotation: new THREE.Euler(-1.58, -1.15, -1.58),
        orbit: new THREE.Vector3(8.97, 32.43, -1.26)
    },
    Curious: {
        position: new THREE.Vector3(-69.51, 56.72, -79.64),
        rotation: new THREE.Euler(-2.66, -0.69, -2.82),
        orbit: new THREE.Vector3(4.67, 15.11, 0.58)
    },
    BottomUp: {
        position: new THREE.Vector3(-50, 4.6 -0.4),
        rotation: new THREE.Euler(1.60, -1.1, 1.60),
        orbit: new THREE.Vector3(8.60, 30.60, -0.35)
    }
};



// Shared state object
export const state = {
    // Constants
    gravityConstant: -9.8,
    margin: 0.001,
    defaultTimeDiv: 1,
    showAllBricks: false,
    
    // Graphics
    container: null,
    camera: null,
    scene: null,
    renderer: null,
    textureLoader: null,
    clock: new THREE.Clock(),
    
    // Controls
    orbitControls: null,
    dragControls: null,
    enableSelection: false,

    // Camera
    cameraPresets,
    currentPreset: 'untitled',
    
    // Physics
    physicsWorld: null,
    collisionConfiguration: null,
    dispatcher: null,
    broadphase: null,
    solver: null,
    softBodySolver: null,
    transformAux1: null,
    
    // Objects
    objects: [],
    rigidBodies: [],
    
    // Runtime state
    runPhysics: false,
    timeDiv: 2,
    
    // Raycasting
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2(),
    
    // Data
    currentView: null,
    viewContainer: d3.select('#dropdown-container'),
    colorScale: d3.scaleOrdinal()
        // .range(['#ff0000', '#ffff00', '#00ffff', '#0000ff', '#ff00ff'])
        .range(['Silver', 'Yellow', 'DodgerBlue', 'Tomato', 'MediumSlateBlue'])
        .domain(['Oceania', 'Europe', 'Americas', 'Asia', 'Africa']),
    brick_layout: d3.scaleQuantize().range([1, 2, 3, 4])
};

