import * as THREE from 'three';
import * as d3 from 'd3';

// Shared state object
export const state = {
    // Constants
    gravityConstant: -9.8,
    margin: 0.001,
    defaultTimeDiv: 2,
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
    viewContainer: d3.select('#viewContainer'),
    colorScale: d3.scaleOrdinal()
        .range(['#ff0000', '#ffff00', '#00ffff', '#0000ff', '#ff00ff'])
        .domain(['Oceania', 'Europe', 'Americas', 'Asia', 'Africa']),
    brick_layout: d3.scaleQuantize().range([1, 2, 3, 4])
};