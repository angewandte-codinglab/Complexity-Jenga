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
    },
    Underside: {
        position: new THREE.Vector3(0, -90, 0),
        rotation: new THREE.Euler(1.57, 0, -4.71), // 1.57 ≈ π/2 and -4.71 ≈ -3π/2 to ensure continuity in rotation
        orbit: new THREE.Vector3(0, 0, 0)
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
        .range(['Lavender', 'Gold', 'DodgerBlue', 'Tomato', 'MediumSlateBlue'])
        .domain(['Oceania', 'Europe', 'Americas', 'Asia', 'Africa']),
    brick_layout: d3.scaleQuantize().range([1, 2, 3, 4]),
    brick_layout_label: d3.scaleOrdinal().domain([1, 2, 3, 4]).range(["Low", "Moderate", "Moderately high", "High"]),
    brick_icon: (layout, color) => {
        switch (layout) {
          case 1:
            return `
            <polygon points="50.6 5.2 3.7 28.65 18.67 35.93 64.24 12.49 50.6 5.2" style="fill: #fff; opacity: .1;"/>
            <polygon points="18.48 51.6 2.52 43.34 2.52 29.65 18.48 37.18 18.48 51.6" style="fill: #fff; opacity: .1;"/>
            <polygon points="66.27 13.33 19.75 36.59 34.72 43.87 80.29 20.43 66.27 13.33" style="fill: ${color};"/>
            <polygon points="82.36 21.21 35.71 44.53 49.9 51.6 96.69 28.15 82.36 21.21" style="fill: #fff; opacity: .1;"/>
            <polygon points="97.48 29.15 50.68 52.44 50.68 66.4 97.48 43.47 97.48 29.15" style="fill: #fff; opacity: .1;"/>
            <polygon points="81.93 21.21 34.82 44.89 34.82 58.86 81.93 35.53 81.93 21.21" style="fill: ${color};"/>
            <polygon points="33.97 58.61 19.29 51.85 19.29 37.56 33.97 44.98 33.97 58.61" style="fill: ${color};"/>
            <polygon points="49.9 66.4 34.82 58.86 34.82 45.33 49.9 52.81 49.9 66.4" style="fill: #fff; opacity: .1;"/>`
            break;
          case 2:
            return `
            <polygon points="50.6 5.2 3.7 28.65 18.67 35.93 64.24 12.49 50.6 5.2" style="fill: #fff; opacity: .1;"/>
            <polygon points="18.48 51.6 2.52 43.34 2.52 29.65 18.48 37.18 18.48 51.6" style="fill: #fff; opacity: .1;"/>
            <polygon points="66.27 13.33 19.75 36.59 34.72 43.87 80.29 20.43 66.27 13.33" style="fill:${color};"/>
            <polygon points="82.36 21.21 35.71 44.53 49.9 51.6 96.69 28.15 82.36 21.21" style="fill: ${color};"/>
            <polygon points="97.48 29.15 50.68 52.44 50.68 66.4 97.48 43.47 97.48 29.15" style="fill: ${color};"/>
            <polygon points="33.97 58.61 19.29 51.85 19.29 37.56 33.97 44.98 33.97 58.61" style="fill: ${color};"/>
            <polygon points="49.9 66.4 34.82 58.86 34.82 45.33 49.9 52.81 49.9 66.4" style="fill: ${color};"/>
            `
            break;
          case 3:
            return `
            <polygon points="50.6 5.2 3.7 28.65 18.67 35.93 64.24 12.49 50.6 5.2" style="fill: ${color};"/>
            <polygon points="18.48 51.6 2.52 43.34 2.52 29.65 18.48 37.18 18.48 51.6" style="fill: ${color};"/>
            <polygon points="66.27 13.33 19.75 36.59 34.72 43.87 80.29 20.43 66.27 13.33" style="fill: #fff; opacity: .1;"/>
            <polygon points="82.36 21.21 35.71 44.53 49.9 51.6 96.69 28.15 82.36 21.21" style="fill: ${color};"/>
            <polygon points="97.48 29.15 50.68 52.44 50.68 66.4 97.48 43.47 97.48 29.15" style="fill: ${color};"/>
            <polygon points="66.2 13.41 19.29 37.23 19.29 51.6 66.2 27.73 66.2 13.41" style="fill: ${color};"/>
            <polygon points="33.97 58.61 19.29 51.85 19.29 37.56 33.97 44.98 33.97 58.61" style="fill: #fff; opacity: .1;"/>
            <polygon points="49.9 66.4 34.82 58.86 34.82 45.33 49.9 52.81 49.9 66.4" style="fill: ${color};"/>
            `
            break;
          default:
            return `
            <polygon points="50.6 5.2 3.7 28.65 18.67 35.93 64.24 12.49 50.6 5.2" style="fill: ${color};"/>
            <polygon points="18.48 51.6 2.52 43.34 2.52 29.65 18.48 37.18 18.48 51.6" style="fill: ${color};"/>
            <polygon points="66.27 13.33 19.75 36.59 34.72 43.87 80.29 20.43 66.27 13.33" style="fill: ${color};"/>
            <polygon points="82.36 21.21 35.71 44.53 49.9 51.6 96.69 28.15 82.36 21.21" style="fill: ${color};"/>
            <polygon points="97.48 29.15 50.68 52.44 50.68 66.4 97.48 43.47 97.48 29.15" style="fill: ${color};"/>
            <polygon points="33.97 58.61 19.29 51.85 19.29 37.56 33.97 44.98 33.97 58.61" style="fill: ${color};"/>
            <polygon points="49.9 66.4 34.82 58.86 34.82 45.33 49.9 52.81 49.9 66.4" style="fill: ${color};"/>
            `
        }
    },
};

