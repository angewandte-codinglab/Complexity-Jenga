import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { state } from './state.js';

export function initGraphics() {
    // Set up container
    state.container = document.getElementById('container');
    
    // Set up camera
    state.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.2, 2000);
    const initialPreset = state.cameraPresets['FarAway'];
    state.camera.position.copy(initialPreset.position);
    state.camera.quaternion.copy(initialPreset.quaternion); // Use quaternion for orientation
    if (state.orbitControls) {
        state.orbitControls.target.copy(initialPreset.orbit);
        state.orbitControls.update();
    }

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
    state.orbitControls.target.copy(initialPreset.orbit);
    state.orbitControls.enabled = true;
    state.orbitControls.update();
    
    setupLights();
    loadTable();
    window.addEventListener('resize', onWindowResize);
}

function setupLights() {
    // Ambient light to softly illuminate all objects
    const ambientLightFill = new THREE.AmbientLight(0xf7f3ff, 0.8);
    state.scene.add(ambientLightFill);
    
    // Hemisphere light to simulate sky and ground light
    const hemisphereLight = new THREE.HemisphereLight( 0x596df9, 0xe5e4e4, 1.5);
    state.scene.add(hemisphereLight);
    
    // Directional light (main light with shadows)
    const light = new THREE.DirectionalLight(0xffebc5, 4.3);
    light.position.set(-26, 24, 16);
    light.castShadow = true;
    
    // Shadow configuration
    const d = 40;
    light.shadow.camera.left = -d;
    light.shadow.camera.right = d;
    light.shadow.camera.top = d;
    light.shadow.camera.bottom = -d;
    light.shadow.camera.near = 1;
    light.shadow.camera.far = 200;
    
    // Increase shadow map resolution
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    
    // Improve shadow quality
    light.shadow.bias = -0.001;
    light.shadow.normalBias = 0.02;
    
    state.scene.add(light);
    
    // Optional: Add helper to visualize shadow camera
    // const helper = new THREE.CameraHelper(light.shadow.camera);
    // state.scene.add(helper);
}


function loadTable() {
    const loader = new GLTFLoader();
    // Pre-load the texture
    // const texture = state.textureLoader.load('./textures/bg4_low.jpg');
    // texture.colorSpace = THREE.SRGBColorSpace;
    // texture.wrapS = THREE.RepeatWrapping;
    // texture.wrapT = THREE.RepeatWrapping;
    // texture.repeat.set(1, 1);
    
    loader.load(
        'models/table/scene.gltf',  // Make sure this path matches your file location
        function (gltf) {
            const table = gltf.scene;
            
            // // Scale and position the table
            // table.scale.set(50, 50, 50);  // Adjust scale as needed
            // table.position.set(11, -5.35, 0);  // Adjust y position to match ground plane
            
            // Get the table's bounding box
            const boundingBox = new THREE.Box3().setFromObject(table);
            const center = boundingBox.getCenter(new THREE.Vector3());
            const size = boundingBox.getSize(new THREE.Vector3());
            
            // Calculate scale based on ground plane size (assuming ground is 80x80)
            const groundSize = 80;
            const desiredTableWidth = groundSize * 0.8; // Make table slightly smaller than ground
            const scale = desiredTableWidth / size.x;
            table.scale.set(scale, scale, scale);
            
            // Recalculate bounding box after scaling
            boundingBox.setFromObject(table);
            boundingBox.getCenter(center);
            boundingBox.getSize(size);
            
            // Position table so its top surface aligns with ground plane at y = -0.5
            // and centers horizontally
            table.position.set(
                -center.x,  // Center horizontally
                -3.35, // Align top with ground plane
                -center.z   // Center depth-wise
            );
            
            // Hide the table cloth mesh
            table.traverse((child) => {
                if (child.isMesh && child.material.name === "New_Material") {
                    // console.log("Found New_Material, updating texture");
                    child.material = new THREE.MeshPhongMaterial({
                        visible: false, // This ensures the mesh doesn't participate in rendering at all
                    });
                }
                child.castShadow = true;
                child.receiveShadow = true;
            });
            
            state.scene.add(table);
        },
        undefined,
        function (error) {
            console.error('Error loading table:', error);
        }
    );
}
//"Table" (https://skfb.ly/6RYGP) by Silver10211 is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).

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
    
    // Use composer instead of renderer
    if (state.composer) {
        state.composer.render();
    } else {
        state.renderer.render(state.scene, state.camera);
    }

    // state.renderer.render(state.scene, state.camera);
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