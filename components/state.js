import * as THREE from 'three';

const cameraPresets = {
    Untitled: {
        position: new THREE.Vector3(-110.15, 31.36, -79.78),
        rotation: new THREE.Euler(-2.91, -0.98, -2.95),
        quaternion: new THREE.Quaternion(-0.05, 0.9, 0.06, -0.5),
        orbit: new THREE.Vector3(4.81, 13.52, -4.62)
    },
    Against: {
        position: new THREE.Vector3(98.5, 40.00, -61.2),
        rotation: new THREE.Euler(-2.8, 1, 2.85),
        quaternion: new THREE.Quaternion(-0.05, 0.88, 0.09, 0.46),
        orbit: new THREE.Vector3(0.3, 15.2, 7.67)
    },
    Frontal: {
        position: new THREE.Vector3(-118.08, 45.50, -3.64),
        rotation: new THREE.Euler(-1.58, -1.30, -1.58),
        quaternion: new THREE.Quaternion(-0.1, -0.7, -0.1, 0.7),
        orbit: new THREE.Vector3(2.73, 11.70, -3.32)
    },
    Immersive: {
        position: new THREE.Vector3(-58.62, 62.64, -1.58),
        rotation: new THREE.Euler(-1.58, -1.15, -1.58),
        quaternion: new THREE.Quaternion(-0.15, -0.7, -0.15, 0.7),
        orbit: new THREE.Vector3(8.97, 32.43, -1.26)
    },
    FarAway: {
        position: new THREE.Vector3(-1377.41, 790.37, -1494.04),
        rotation: new THREE.Euler(-2.66, -0.69, -2.82),
        quaternion: new THREE.Quaternion(0.07, 0.9, 0.17, -0.35),
        orbit: new THREE.Vector3(4.67, 15.11, 0.58)
    },
};

// Shared state object
export const state = {
    // Constants
    gravityConstant: -9.8,
    margin: 0.001,
    defaultTimeDiv: 0.8,
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
    
    // Raycasting
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2(),

    //screen
    isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    
    // Data
    currentView: { id: "number_of_companies", name: 'Number of Companies' },
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

