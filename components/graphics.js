import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { state } from './state.js';

export function initGraphics() {
    // Set up container
    state.container = document.getElementById('container');

    // Set up camera
    state.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.2, 2000);
    state.camera.position.set(-12, 24, -12);

    // Set up scene
    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(0xCCCCCC);

    // Set up renderer
    state.renderer = new THREE.WebGLRenderer({ antialias: true });
    state.renderer.setPixelRatio(window.devicePixelRatio);
    state.renderer.setSize(window.innerWidth, window.innerHeight);
    state.renderer.shadowMap.enabled = true;
    state.container.appendChild(state.renderer.domElement);

    // Set up orbit controls
    state.orbitControls = new OrbitControls(state.camera, state.renderer.domElement);
    state.orbitControls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
    };
    state.orbitControls.target.set(0, 2, 0);
    state.orbitControls.enabled = true;
    state.orbitControls.update();

    // Set up texture loader
    state.textureLoader = new THREE.TextureLoader();

    // Set up lights
    setupLights();
    
    // Set up window resize handler
    window.addEventListener('resize', onWindowResize);
}

function setupLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xbbbbbb);
    state.scene.add(ambientLight);

    // Directional light
    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(-10, 10, 5);
    light.castShadow = true;
    
    // Shadow configuration
    const d = 10;
    light.shadow.camera.left = -d;
    light.shadow.camera.right = d;
    light.shadow.camera.top = d;
    light.shadow.camera.bottom = -d;
    light.shadow.camera.near = 2;
    light.shadow.camera.far = 50;
    light.shadow.mapSize.x = 1024;
    light.shadow.mapSize.y = 1024;

    state.scene.add(light);
}

export function onWindowResize() {
    state.camera.aspect = window.innerWidth / window.innerHeight;
    state.camera.updateProjectionMatrix();
    state.renderer.setSize(window.innerWidth, window.innerHeight);
}

export function render() {
    const deltaTime = state.clock.getDelta();
    
    if (state.runPhysics) {
        updatePhysics(deltaTime);
    }
    
    state.renderer.render(state.scene, state.camera);
}

function updatePhysics(deltaTime) {
    // Step world
    state.physicsWorld.stepSimulation(deltaTime / state.timeDiv, 100);

    // Update rigid bodies
    for (let i = 0; i < state.rigidBodies.length; i++) {
        const objThree = state.rigidBodies[i];
        const objPhys = objThree.userData.physicsBody;
        const ms = objPhys.getMotionState();
        
        if (ms) {
            ms.getWorldTransform(state.transformAux1);
            const p = state.transformAux1.getOrigin();
            const q = state.transformAux1.getRotation();
            objThree.position.set(p.x(), p.y(), p.z());
            objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
        }
    }
}