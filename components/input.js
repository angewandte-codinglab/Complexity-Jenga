import * as THREE from 'three';
import { DragControls } from 'three/addons/DragControls.js';
// import * as d3 from 'd3';
import { state } from './state.js';
import { removeAllBlocks, createObjects } from './physics.js';
// Dropdown functions in Dropdown.js

export function initInput() {
    setupInputHandlers();
    setupViewDropdown();
    setupDragControls();
}

let blockTouched = false;
let lastHighlightedBlock = null;

function setupInputHandlers() {
    // Mouse events
    document.addEventListener('mousedown', () => {
        state.timeDiv = 4;
    });
    
    document.addEventListener('mouseup', () => {
        state.timeDiv = state.defaultTimeDiv;
    });
    
    document.addEventListener('mousemove', onMouseMove);
    
    // Keyboard events
    document.addEventListener('keydown', (event) => {
        if (event.key === " " || event.code === "Space") {
            state.runPhysics = false;
            removeAllBlocks();
            createObjects();
        } else if (event.code === "Enter") {
            state.runPhysics = !state.runPhysics;
            console.log("Physics running: " + state.runPhysics);
        } else if (event.code === "KeyM") {
            state.controls.touches.ONE = (state.controls.touches.ONE === THREE.TOUCH.PAN) 
            ? THREE.TOUCH.ROTATE 
            : THREE.TOUCH.PAN;
        } else if (event.metaKey || event.ctrlKey) {
            console.log("Block moving enabled");
            state.runPhysics = false;
            state.dragControls.enabled = true;
            state.orbitControls.enabled = false;
        } 
        // Camera position shortcuts (numbers 1-9)
        else if (!isNaN(parseInt(event.key)) && event.key !== '0') {
            const keyNum = parseInt(event.key);
            const presetNames = Object.keys(state.cameraPresets);
            
            // Check if we have enough presets for this number
            if (keyNum <= presetNames.length) {
                // Get preset name (subtract 1 because arrays are 0-indexed)
                const presetName = presetNames[keyNum - 1];
                
                // Import the function from gui.js for animation
                import('./gui.js').then(module => {
                    // Animate to selected preset with 1000ms duration
                    module.animateCameraToPreset(presetName, 1000);
                });
            }
        }
        // Toggle GUI visibility with 'h' key
        else if (event.key === 'h' || event.key === 'H') {
            if (state.gui) {
                if (state.gui.domElement.style.display === 'none') {
                    state.gui.domElement.style.display = '';
                } else {
                    state.gui.domElement.style.display = 'none';
                }
            }
        }
    });
    
    document.addEventListener('keyup', (event) => {
        // console.log(event)
        if (event.key === 'Control' || event.key === 'Meta') {
            console.log("Orbit enabled");
            if (blockTouched) state.runPhysics = !state.runPhysics;
            state.orbitControls.enabled = true;
            state.dragControls.enabled = false;
        }
    });
}

function setupViewDropdown() {
    const viewOptions = [
        { id: "number_of_companies", name: 'Number of Companies' },
        { id: "mean_page_rank", name: 'PageRank' }
    ];
    
    state.currentView = viewOptions[0];
    
    createDropdown(
        state.viewContainer, 
        "view-dropdown", 
        viewOptions, 
        state.currentView, 
        (selected) => {
            state.currentView = selected;
            state.runPhysics = false;
            removeAllBlocks();
            createObjects();
            console.log(state.currentView);
        }
    );
}

function setupDragControls() {
    state.dragControls = new DragControls(state.objects, state.camera, state.renderer.domElement);
    
    state.dragControls.addEventListener('dragend', function(event) {
        const object = event.object;
        const physicsBody = object.userData.physicsBody;
        
        if (physicsBody) {
            const transform = new Ammo.btTransform();
            transform.setIdentity();
            
            // Set the new position
            const position = object.position;
            transform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));
            
            // Set the new orientation
            const quaternion = object.quaternion;
            transform.setRotation(new Ammo.btQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w));
            
            // Update both the rigid body's world transform and its motion state
            physicsBody.setWorldTransform(transform);
            
            if (physicsBody.getMotionState()) {
                physicsBody.getMotionState().setWorldTransform(transform);
            }
            
            // Activate the body so it doesn't remain sleeping
            physicsBody.activate();
            
            // Clear the velocity to avoid unexpected movement after dragging
            physicsBody.setLinearVelocity(new Ammo.btVector3(0, 0, 0));
            physicsBody.setAngularVelocity(new Ammo.btVector3(0, 0, 0));
        }
        // blockTouched = false;
    });
    
    // Initially disable drag controls
    state.dragControls.enabled = false;
}

function onMouseMove(event) {
    //skip it if modal is on
    if(document.querySelector('.modal.show'))return;
    // Calculate normalized mouse position
    state.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    state.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Perform raycasting
    state.raycaster.setFromCamera(state.mouse, state.camera);
    const intersects = state.raycaster.intersectObjects(state.rigidBodies);
    
    // Reset previous highlighted block if exists
    if (lastHighlightedBlock) {
        resetBlockHighlight(lastHighlightedBlock);
        lastHighlightedBlock = null;
    }
    
    // Check if any block is intersected
    if (intersects.length > 0) {
        const intersectedBlock = intersects[0].object;
        
        // Store original material properties if first time highlighting
        if (!intersectedBlock.userData.hasOwnProperty('originalEmissive')) {
            // Clone the color object instead of just storing the hex value
            intersectedBlock.userData.originalEmissive = intersectedBlock.material.emissive.clone();
            intersectedBlock.userData.originalEmissiveIntensity = intersectedBlock.material.emissiveIntensity;
        }
        
        // Apply highlighting effect
        intersectedBlock.material.emissive.set(0xFFFFFF);
        intersectedBlock.material.emissiveIntensity = 0.3;
        
        // Track this block as the currently highlighted one
        lastHighlightedBlock = intersectedBlock;
        
        showBlockInfo(intersectedBlock, event);
        blockTouched = true;
    } else {
         // Add timeout before setting blockTouched to false
         setTimeout(() => {
            blockTouched = false;
        }, 200);
        hideBlockInfo();
    }
}

function showBlockInfo(block, event) {
    const hoverBox = document.getElementById('hoverBox');
    hoverBox.style.display = 'flex';
    hoverBox.innerHTML = `
        <div class="title-container">
            <span class="title">${block.userData.country}</span>
            <span class="pill" style="border-color:${block.userData.color}">${block.userData.region}</span>
        </div>
        <div class="subtitle">
            This country contains ${block.userData.companies} companies, connected to the global network with an average betweenness centrality of ${block.userData.centrality.toFixed(4)} and based on an average PageRank of ${d3.format(".4f")(block.userData.pagerank)}. Further details are displayed below.
        </div>
        <div id="infographicBox">
            Add infographics here (bricklayout ${block.userData.brickLayoutPerLayer})
        </div>
    `;
    hoverBox.style.top = `${event.clientY}px`;
    hoverBox.style.left = `${event.clientX + 15}px`;
}

function hideBlockInfo() {
    const hoverBox = document.getElementById('hoverBox');
    hoverBox.style.display = 'none';
}

function resetBlockHighlight(block) {
    if (block && block.userData.hasOwnProperty('originalEmissive')) {
        // Use the clone of the original color instead of just the hex value
        block.material.emissive.copy(block.userData.originalEmissive);
        block.material.emissiveIntensity = block.userData.originalEmissiveIntensity || 0;
    }
}