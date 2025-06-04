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

// Add this variable to track meta/ctrl key state
let metaKeyPressed = false;

function setupInputHandlers() {
    // Mouse events
    document.addEventListener('mousedown', () => {
        state.timeDiv = 4;
    });
    
    document.addEventListener('mouseup', () => {
        state.timeDiv = state.defaultTimeDiv;
    });
    
    document.addEventListener('mousemove', onMouseMove);
    
    
    // Store physics state before modifier key was pressed
    let previousPhysicsState = false;
    
    
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
            state.controls.touches.ONE = (state.controls.touches.ONE === THREE.TOUCH.PAN) ?
            THREE.TOUCH.ROTATE :
            THREE.TOUCH.PAN;
        } else if (event.metaKey || event.ctrlKey) {
            // Set flag that meta/ctrl is pressed
            metaKeyPressed = true;
            
            // Stop physics immediately
            state.runPhysics = false;
            
            // Enable drag controls and disable orbit
            state.dragControls.enabled = true;
            state.orbitControls.enabled = false;
            
            console.log("Block moving enabled (meta/ctrl pressed)");
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
        else  if (event.key === 'q' || event.key === 'Q') {
            const quaternion = state.camera.quaternion.clone();
            console.log('Current camera quaternion:');
            console.log(
                quaternion.x.toFixed(2),
                quaternion.y.toFixed(2),
                quaternion.z.toFixed(2),
                quaternion.w.toFixed(2)
            );
            
            const position = state.camera.position.clone(); 
            console.log('Current camera position:');
            console.log(
                position.x.toFixed(2),
                position.y.toFixed(2),
                position.z.toFixed(2)
            );
        }
    });
    
    document.addEventListener('keyup', (event) => {
        if (event.key === 'Control' || event.key === 'Meta') {
            // Clear the meta/ctrl pressed flag
            metaKeyPressed = false;
            
            console.log("Orbit enabled (meta/ctrl released)");
            
            // Enable physics if we were dragging
            if (state.dragControls.enabled) {
                state.runPhysics = true;
            }
            
            // Always restore orbit controls
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

// Modify the drag controls to work better with the meta key
function setupDragControls() {
    state.dragControls = new DragControls(state.objects, state.camera, state.renderer.domElement);
    
    // Add dragstart listener to stop physics when dragging starts
    state.dragControls.addEventListener('dragstart', function() {
        // Ensure physics is stopped when actually dragging an object
        state.runPhysics = false;
    });
    
    
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
        
        // Always enable physics when dropping a block, even if meta key is still pressed
        // This lets blocks fall naturally after placement
        state.runPhysics = true;
    });
    
    // Initially disable drag controls
    state.dragControls.enabled = false;
}

function onMouseMove(event) {
    //skip it if modal is on
    // if (document.querySelector('.modal.show')) return;
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
        showBlockInfo();
        
    }
}

function showBlockInfo(block, event) {
    const hoverBox = document.getElementById('hoverBox');
    if (block) {
        hoverBox.style.display = 'flex';
        if (state.currentHover !== block.userData.countryCode) {
            
            hoverBox.innerHTML = `
                <div class="title-container d-flex pt-3">
                    <div class="col-3 px-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 70" width="100%">
                          ${block.userData.brickIcon}
                        </svg>
                    </div>
                    <div class="d-flex flex-column col-9 fs-7">
                        <div class="fw-bold fs-5">${block.userData.country}</div>
                        <div class="d-flex align-items-center">
                            Region:
                            <span class="pill ms-2 me-1" style="background-color:${block.userData.color}"></span>
                            <span class="fw-bold">${block.userData.region}</span>
                        </div>
                        <div>Betweenness centrality: <span class="fw-bold">${block.userData.brickLabel}</span></div>
                    </div>
                </div>
                <div class="d-flex fs-7 p-2 mt-2 border-top">
                    <div class="col-6">Number of Companies: <span class="fw-bold">${block.userData.companies}</span></div>
                    <div class="col-6">Average PageRank: <span class="fw-bold">${d3.format(".4f")(block.userData.pagerank)}</span></div>
                </div>
                <div id="infographicBox"></div>
            `;
            //TODO: aligh box
            hoverBox.style.top = `${Math.min(event.clientY, document.body.clientHeight - 500)}px`;
            hoverBox.style.left = `${event.clientX + 30}px`;
            
            // Draw the network graph for the hovered country
            
            state.currentHover = block.userData.countryCode;
            loadGlobalNetworkGraph('infographicBox', state.currentHover);
        }
    } else {
        hoverBox.style.display = 'none';
    }
}


function resetBlockHighlight(block) {
    if (block && block.userData.hasOwnProperty('originalEmissive')) {
        // Use the clone of the original color instead of just the hex value
        block.material.emissive.copy(block.userData.originalEmissive);
        block.material.emissiveIntensity = block.userData.originalEmissiveIntensity || 0;
    }
}