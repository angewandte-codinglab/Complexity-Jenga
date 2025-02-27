import * as THREE from 'three';
import { DragControls } from 'three/addons/DragControls.js';
// import * as d3 from 'd3';
import { state } from './state.js';
import { removeAllBlocks, createObjects } from './physics.js';
import { createDropdown } from './data.js';

export function initInterface() {
    setupInputHandlers();
    setupViewDropdown();
    setupDragControls();
}

function setupInputHandlers() {
    // Mouse events
    document.addEventListener('mousedown', () => {
        state.timeDiv = 10;
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
        } else if (event.code === "KeyM") {
            state.controls.touches.ONE = (state.controls.touches.ONE === THREE.TOUCH.PAN) 
                ? THREE.TOUCH.ROTATE 
                : THREE.TOUCH.PAN;
        } else if (event.metaKey || event.ctrlKey) {
            console.log("Block moving enabled");
            state.dragControls.enabled = true;
            state.orbitControls.enabled = false;
        }
    });
    
    document.addEventListener('keyup', (event) => {
        if (!event.metaKey && !event.ctrlKey) {
            console.log("Orbit enabled");
            state.orbitControls.enabled = true;
            state.dragControls.enabled = false;
        }
    });
}

function setupViewDropdown() {
    const viewOptions = [
        { id: "number_of_companies", name: 'Number of Companies' },
        { id: "mean_page_rank", name: 'Page Rank' }
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
    });
    
    // Initially disable drag controls
    state.dragControls.enabled = false;
}

function onMouseMove(event) {
    // Calculate normalized mouse position
    state.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    state.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Perform raycasting
    state.raycaster.setFromCamera(state.mouse, state.camera);
    const intersects = state.raycaster.intersectObjects(state.rigidBodies);
    
    // Check if any block is intersected
    if (intersects.length > 0) {
        const intersectedBlock = intersects[0].object;
        showBlockInfo(intersectedBlock, event);
    } else {
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